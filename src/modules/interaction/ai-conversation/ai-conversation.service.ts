import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserReaderService } from '@/modules/identity/user/user-reader.service';
import { Response } from '@/common/utils/response';
import { CreateAiConversationDto } from './dto/create-ai-conversation.dto';
import { QueryAiConversationDto } from './dto/query-ai-conversation.dto';
import { UpdateAiConversationDto } from './dto/update-ai-conversation.dto';
import { AiConversation } from './entities/ai-conversation.entity';

export const DEFAULT_AI_CONVERSATION_TITLE = '新对话';

interface FindConversationOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

@Injectable()
export class AiConversationService {
  constructor(
    @InjectRepository(AiConversation)
    private readonly aiConversationRepo: Repository<AiConversation>,
    private readonly userReaderService: UserReaderService,
  ) {}

  async create(userId: string, dto: CreateAiConversationDto) {
    const conversation = await this.createEntity(userId, dto);
    return new Response('创建成功', conversation);
  }

  async createEntity(userId: string, dto: Partial<CreateAiConversationDto> = {}) {
    await this.userReaderService.findUserEntityByIdOrFail(userId);

    const conversation = this.aiConversationRepo.create({
      userId,
      title: this.normalizeTitle(dto.title),
      lastMessageAt: new Date(),
      lastMessagePreview: '',
      targetName: this.normalizeOptionalText(dto.targetName, 50),
      targetGender: this.normalizeOptionalText(dto.targetGender, 20),
      targetIntro: this.normalizeOptionalText(dto.targetIntro, 500),
      relationship: this.normalizeOptionalText(dto.relationship, 50),
      chatAtmosphere: this.normalizeOptionalText(dto.chatAtmosphere, 300),
      toneTemplate: this.normalizeOptionalText(dto.toneTemplate, 300),
      goalDirection: this.normalizeOptionalText(dto.goalDirection, 300),
      isArchived: false,
      archivedAt: null,
      isPinned: false,
      pinnedAt: null,
    });

    return this.aiConversationRepo.save(conversation);
  }

  async findMine(userId: string, query: QueryAiConversationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const includeArchived = query.includeArchived ?? false;
    const archivedOnly = query.archivedOnly ?? false;

    const where = this.buildWhere(userId, {
      includeArchived,
      onlyArchived: archivedOnly,
    });

    const [data, total] = await this.aiConversationRepo.findAndCount({
      where,
      order: { isPinned: 'DESC', pinnedAt: 'DESC', lastMessageAt: 'DESC', updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new Response('查询成功', {
      data,
      total,
      page,
      pageSize,
      includeArchived,
      archivedOnly,
    });
  }

  async findOne(userId: string, id: string) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId);
    return new Response('查询成功', conversation);
  }

  async update(userId: string, id: string, dto: UpdateAiConversationDto) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId);
    this.applyConversationFields(conversation, dto);
    await this.aiConversationRepo.save(conversation);
    return new Response('更新成功', conversation);
  }

  async saveChatContext(
    userId: string,
    id: string,
    dto: Partial<CreateAiConversationDto> = {},
  ) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId, {
      includeArchived: true,
    });
    this.applyConversationFields(conversation, dto, false);
    return this.aiConversationRepo.save(conversation);
  }

  async archive(userId: string, id: string) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId, {
      includeArchived: true,
    });

    conversation.isArchived = true;
    conversation.archivedAt = new Date();
    conversation.isPinned = false;
    conversation.pinnedAt = null;
    await this.aiConversationRepo.save(conversation);

    return new Response('归档成功', conversation);
  }

  async restore(userId: string, id: string) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId, {
      includeArchived: true,
    });

    conversation.isArchived = false;
    conversation.archivedAt = null;
    await this.aiConversationRepo.save(conversation);

    return new Response('恢复成功', conversation);
  }

  async pin(userId: string, id: string) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId);
    conversation.isPinned = true;
    conversation.pinnedAt = new Date();
    await this.aiConversationRepo.save(conversation);
    return new Response('置顶成功', conversation);
  }

  async unpin(userId: string, id: string) {
    const conversation = await this.findOwnedEntityByIdOrFail(id, userId, {
      includeArchived: true,
    });
    conversation.isPinned = false;
    conversation.pinnedAt = null;
    await this.aiConversationRepo.save(conversation);
    return new Response('取消置顶成功', conversation);
  }

  async findOwnedEntityByIdOrFail(
    id: string,
    userId: string,
    options: FindConversationOptions = {},
  ) {
    const where = this.buildWhere(userId, options);
    const conversation = await this.aiConversationRepo.findOne({
      where: {
        ...where,
        id,
      },
    });

    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }

    return conversation;
  }

  async touchConversation(conversationId: string, preview: string) {
    const conversation = await this.aiConversationRepo.findOne({
      where: { id: conversationId, isArchived: false },
    });
    if (!conversation) {
      return null;
    }

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = this.normalizePreview(preview);
    return this.aiConversationRepo.save(conversation);
  }

  async syncConversationSummary(
    conversationId: string,
    preview: string,
    lastMessageAt: Date | null,
  ) {
    const conversation = await this.aiConversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      return null;
    }

    conversation.lastMessagePreview = this.normalizePreview(preview);
    conversation.lastMessageAt = lastMessageAt;
    return this.aiConversationRepo.save(conversation);
  }

  async applyAutoTitleIfNeeded(conversationId: string, seedText: string) {
    const conversation = await this.aiConversationRepo.findOne({
      where: { id: conversationId, isArchived: false },
    });
    if (!conversation) {
      return null;
    }

    if (
      conversation.title !== DEFAULT_AI_CONVERSATION_TITLE ||
      conversation.lastMessagePreview.trim().length > 0
    ) {
      return conversation;
    }

    conversation.title = this.generateAutoTitle(seedText);
    return this.aiConversationRepo.save(conversation);
  }

  private buildWhere(
    userId: string,
    options: FindConversationOptions = {},
  ): FindOptionsWhere<AiConversation> {
    const where: FindOptionsWhere<AiConversation> = { userId };

    if (options.onlyArchived) {
      where.isArchived = true;
      return where;
    }

    if (!options.includeArchived) {
      where.isArchived = false;
    }

    return where;
  }

  private applyConversationFields(
    conversation: AiConversation,
    dto: Partial<CreateAiConversationDto>,
    allowTitleUpdate: boolean = true,
  ) {
    if (allowTitleUpdate && dto.title !== undefined) {
      conversation.title = this.normalizeTitle(dto.title);
    }

    if (dto.targetName !== undefined) {
      conversation.targetName = this.normalizeOptionalText(dto.targetName, 50);
    }

    if (dto.targetGender !== undefined) {
      conversation.targetGender = this.normalizeOptionalText(dto.targetGender, 20);
    }

    if (dto.targetIntro !== undefined) {
      conversation.targetIntro = this.normalizeOptionalText(dto.targetIntro, 500);
    }

    if (dto.relationship !== undefined) {
      conversation.relationship = this.normalizeOptionalText(dto.relationship, 50);
    }

    if (dto.chatAtmosphere !== undefined) {
      conversation.chatAtmosphere = this.normalizeOptionalText(dto.chatAtmosphere, 300);
    }

    if (dto.toneTemplate !== undefined) {
      conversation.toneTemplate = this.normalizeOptionalText(dto.toneTemplate, 300);
    }

    if (dto.goalDirection !== undefined) {
      conversation.goalDirection = this.normalizeOptionalText(dto.goalDirection, 300);
    }
  }

  private normalizeTitle(title?: string) {
    const normalized = title?.trim();
    return normalized && normalized.length > 0
      ? normalized.slice(0, 100)
      : DEFAULT_AI_CONVERSATION_TITLE;
  }

  private normalizePreview(content: string) {
    return content.trim().slice(0, 200);
  }

  private normalizeOptionalText(value: string | undefined, maxLength: number) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized.slice(0, maxLength) : null;
  }

  private generateAutoTitle(source: string) {
    const trimmed = source.trim();
    if (!trimmed) {
      return DEFAULT_AI_CONVERSATION_TITLE;
    }

    const normalized = trimmed
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, ' ')
      .trim();
    const chars = Array.from(normalized);
    return chars.slice(0, 18).join('');
  }
}
