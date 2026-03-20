import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMessageRole } from '@/common/enums/ai.enum';
import { Response } from '@/common/utils/response';
import { AiConversationService } from '@/modules/interaction/ai-conversation/ai-conversation.service';
import { QueryAiMessageDto } from './dto/query-ai-message.dto';
import { AiMessage } from './entities/ai-message.entity';

@Injectable()
export class AiMessageService {
  constructor(
    @InjectRepository(AiMessage)
    private readonly aiMessageRepo: Repository<AiMessage>,
    private readonly aiConversationService: AiConversationService,
  ) {}

  async findByConversation(userId: string, conversationId: string, query: QueryAiMessageDto) {
    await this.aiConversationService.findOwnedEntityByIdOrFail(conversationId, userId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [data, total] = await this.aiMessageRepo.findAndCount({
      where: { userId, conversationId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new Response('查询成功', {
      data: [...data].reverse(),
      total,
      page,
      pageSize,
    });
  }

  async findRecentContext(conversationId: string, limit: number = 20) {
    const data = await this.aiMessageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return [...data].reverse();
  }

  async saveUserMessage(userId: string, conversationId: string, content: string) {
    return this.createMessage(userId, conversationId, AiMessageRole.USER, content);
  }

  async saveAssistantMessages(userId: string, conversationId: string, contents: string[]) {
    const normalizedContents = contents
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (normalizedContents.length === 0) {
      return [];
    }

    const entities = normalizedContents.map((content) =>
      this.aiMessageRepo.create({
        userId,
        conversationId,
        role: AiMessageRole.ASSISTANT,
        content,
      }),
    );

    return this.aiMessageRepo.save(entities);
  }

  async remove(userId: string, messageId: string) {
    const message = await this.aiMessageRepo.findOne({
      where: { id: messageId, userId },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    await this.aiConversationService.findOwnedEntityByIdOrFail(message.conversationId, userId, {
      includeArchived: true,
    });

    await this.aiMessageRepo.remove(message);

    const latestMessage = await this.aiMessageRepo.findOne({
      where: { userId, conversationId: message.conversationId },
      order: { createdAt: 'DESC' },
    });

    const conversation = await this.aiConversationService.syncConversationSummary(
      message.conversationId,
      latestMessage?.content ?? '',
      latestMessage?.createdAt ?? null,
    );

    return new Response('删除成功', {
      messageId,
      conversation,
    });
  }

  private async createMessage(
    userId: string,
    conversationId: string,
    role: AiMessageRole,
    content: string,
  ) {
    const normalized = content.trim();
    if (!normalized) {
      throw new BadRequestException('消息内容不能为空');
    }

    const entity = this.aiMessageRepo.create({
      userId,
      conversationId,
      role,
      content: normalized,
    });

    return this.aiMessageRepo.save(entity);
  }
}
