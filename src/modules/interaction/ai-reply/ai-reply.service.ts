import { Injectable } from '@nestjs/common';
import { Response } from '@/common/utils/response';
import { AiProfileService } from '@/modules/identity/ai-profile/ai-profile.service';
import { HunyuanService, HunyuanMessage } from '@/modules/infra/ai/hunyuan.service';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';
import {
  AiConversationService,
  DEFAULT_AI_CONVERSATION_TITLE,
} from '@/modules/interaction/ai-conversation/ai-conversation.service';
import { AiMessageService } from '@/modules/interaction/ai-message/ai-message.service';
import { CreateAiReplyDto } from './dto/create-ai-reply.dto';
import { buildSystemPrompt } from './utils/prompt-builder';
import { splitReplyParts } from './utils/reply-splitter';

@Injectable()
export class AiReplyService {
  constructor(
    private readonly aiProfileService: AiProfileService,
    private readonly aiConversationService: AiConversationService,
    private readonly aiMessageService: AiMessageService,
    private readonly hunyuanService: HunyuanService,
    private readonly logger: AppLoggerService,
  ) {}

  async generateReply(userId: string, dto: CreateAiReplyDto) {
    const createdNewConversation = !dto.conversationId;
    const startedAt = Date.now();

    this.logger.log('AI reply generation started', AiReplyService.name, {
      userId,
      conversationId: dto.conversationId || null,
      createdNewConversation,
    });

    try {
      let conversation = dto.conversationId
        ? await this.aiConversationService.findOwnedEntityByIdOrFail(dto.conversationId, userId)
        : await this.aiConversationService.createEntity(userId, {
            title: dto.conversationTitle,
            ...dto.chatContext,
          });

      if (dto.conversationId && dto.chatContext) {
        conversation = await this.aiConversationService.saveChatContext(
          userId,
          conversation.id,
          dto.chatContext,
        );
      }

      const profile = await this.aiProfileService.findEntityByUserIdOrFail(userId);
      const userMessage = dto.userMessage.trim();
      const shouldAutoTitle =
        conversation.title === DEFAULT_AI_CONVERSATION_TITLE &&
        conversation.lastMessagePreview.trim().length === 0;

      await this.aiMessageService.saveUserMessage(userId, conversation.id, userMessage);
      if (shouldAutoTitle) {
        await this.aiConversationService.applyAutoTitleIfNeeded(conversation.id, userMessage);
      }
      await this.aiConversationService.touchConversation(conversation.id, userMessage);

      const history = await this.aiMessageService.findRecentContext(conversation.id, 20);
      const messages: HunyuanMessage[] = [
        { Role: 'system', Content: buildSystemPrompt(profile, conversation) },
        ...history.map((message) => ({
          Role: message.role,
          Content: message.content,
        })),
      ];

      const modelStartedAt = Date.now();
      const content = await this.hunyuanService.chat(messages);
      const parts = splitReplyParts(content);
      const finalParts = parts.length > 0 ? parts : ['[AI 返回为空]'];
      const savedAssistantMessages = await this.aiMessageService.saveAssistantMessages(
        userId,
        conversation.id,
        finalParts,
      );

      await this.aiConversationService.touchConversation(
        conversation.id,
        finalParts[finalParts.length - 1],
      );

      const latestConversation = await this.aiConversationService.findOwnedEntityByIdOrFail(
        conversation.id,
        userId,
      );

      this.logger.log('AI reply generation completed', AiReplyService.name, {
        userId,
        conversationId: conversation.id,
        createdNewConversation,
        contextMessageCount: history.length,
        replyPartCount: finalParts.length,
        savedAssistantMessageCount: savedAssistantMessages.length,
        modelDurationMs: Date.now() - modelStartedAt,
        durationMs: Date.now() - startedAt,
      });

      return new Response('生成成功', {
        conversationId: latestConversation.id,
        conversationTitle: latestConversation.title,
        conversation: latestConversation,
        createdNewConversation,
        content: finalParts[0],
        parts: finalParts,
        messages: savedAssistantMessages,
      });
    } catch (error) {
      this.logger.error(
        'AI reply generation failed',
        AiReplyService.name,
        error instanceof Error ? error.stack : undefined,
        {
          userId,
          conversationId: dto.conversationId || null,
          createdNewConversation,
          durationMs: Date.now() - startedAt,
        },
      );
      throw error;
    }
  }
}
