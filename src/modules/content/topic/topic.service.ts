import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Topic } from './entities/topic.entity';
import { Category } from '@/modules/content/category/entities/category.entity';
import { Tag } from '@/modules/content/tag/entities/tag.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { StorageService } from '@/modules/infra/storage/storage.service';
import { XssSanitizer } from '@/common/utils/xss-sanitizer';
import { UserReaderService } from '@/modules/identity/user/user-reader.service';

interface TopicViewContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class TopicService {
  private static readonly VIEW_DEDUP_TTL_SECONDS = 10 * 60;
  private static readonly VIEW_RATE_LIMIT_PER_MINUTE = 20;

  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private storageService: StorageService,
    private userReaderService: UserReaderService,
  ) {}

  /**
   * 创建话题
   */
  async create(createTopicDto: CreateTopicDto, userId: string): Promise<Topic> {
    const { categoryId, tagIds, ...topicData } = createTopicDto;

    // 检查用户是否存在
    const user = await this.userReaderService.findUserEntityByIdOrFail(userId);

    // 检查分类是否存在（如果提供了）
    let category = null;
    if (categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: categoryId, isDeleted: false, isActive: true },
      });
      if (!category) {
        throw new BadRequestException('分类不存在或已禁用');
      }
    }

    // 检查标签是否存在（如果提供了）
    let tags: Tag[] = [];
    if (tagIds && tagIds.length > 0) {
      tags = await this.tagRepository.find({
        where: { id: In(tagIds), isDeleted: false, isActive: true },
      });

      if (tags.length !== tagIds.length) {
        throw new BadRequestException('部分标签不存在或已禁用');
      }
    }

    // XSS 防护：清理内容
    const contentType = topicData.contentType || 'html';
    topicData.content = XssSanitizer.sanitize(topicData.content, contentType);

    // 创建话题
    const topic = this.topicRepository.create({
      ...topicData,
      contentType,
      creator: user,
      category,
      tags,
    });

    const saved = await this.topicRepository.save(topic);

    // 增加标签使用次数
    if (tags.length > 0) {
      await this.tagRepository
        .createQueryBuilder()
        .update(Tag)
        .set({ usageCount: () => 'usageCount + 1' })
        .where('id IN (:...ids)', { ids: tags.map((t) => t.id) })
        .execute();
    }

    return saved;
  }

  /**
   * 获取所有话题（分页）
   */
  async findAll(page: number = 1, limit: number = 20) {
    const [topics, total] = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('topic.isPublic = :isPublic', { isPublic: true })
      .orderBy('topic.isSticky', 'DESC')
      .addOrderBy('topic.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户的话题列表
   */
  async findByUser(userId: string, page: number = 1, limit: number = 20) {
    const [topics, total] = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.creatorId = :userId', { userId })
      .andWhere('topic.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('topic.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 按分类获取话题
   */
  async findByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    const [topics, total] = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.categoryId = :categoryId', { categoryId })
      .andWhere('topic.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('topic.isPublic = :isPublic', { isPublic: true })
      .orderBy('topic.isSticky', 'DESC')
      .addOrderBy('topic.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 按标签获取话题
   */
  async findByTag(tagId: string, page: number = 1, limit: number = 20) {
    const [topics, total] = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .innerJoin('topic.tags', 'tag', 'tag.id = :tagId', { tagId })
      .where('topic.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('topic.isPublic = :isPublic', { isPublic: true })
      .orderBy('topic.isSticky', 'DESC')
      .addOrderBy('topic.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取热门话题
   */
  async getHotTopics(limit: number = 10) {
    return this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('topic.isPublic = :isPublic', { isPublic: true })
      .orderBy('topic.likeCount', 'DESC')
      .addOrderBy('topic.viewCount', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 获取推荐话题
   */
  async getRecommendedTopics(limit: number = 10) {
    return this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('topic.isPublic = :isPublic', { isPublic: true })
      .andWhere('topic.isRecommended = :isRecommended', { isRecommended: true })
      .orderBy('topic.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 根据 ID 获取话题
   */
  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .leftJoinAndSelect('topic.comments', 'comments')
      .leftJoinAndSelect('topic.topicLikes', 'topicLikes')
      .where('topic.id = :id', { id })
      .andWhere('topic.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    return topic;
  }

  private async tryIncrementViewCount(topicId: string, context: TopicViewContext): Promise<void> {
    const viewerId = this.buildViewerId(context);

    if (!viewerId) {
      await this.topicRepository.increment({ id: topicId }, 'viewCount', 1);
      return;
    }

    try {
      // 使用 cache-manager 实现简化的去重逻辑
      const minuteBucket = Math.floor(Date.now() / 60000);
      const rateKey = `topic:view:rate:${topicId}:${viewerId}:${minuteBucket}`;

      // 获取当前计数
      const currentRate = await this.cacheManager.get<number>(rateKey);
      const rate = (currentRate || 0) + 1;

      // 设置计数，60 秒过期
      await this.cacheManager.set(rateKey, rate, 60000);

      if (rate > TopicService.VIEW_RATE_LIMIT_PER_MINUTE) {
        return;
      }

      // 检查去重 key
      const dedupeKey = `topic:view:dedupe:${topicId}:${viewerId}`;
      const exists = await this.cacheManager.get(dedupeKey);

      if (!exists) {
        // 设置去重标记
        await this.cacheManager.set(
          dedupeKey,
          '1',
          TopicService.VIEW_DEDUP_TTL_SECONDS * 1000,
        );
        await this.topicRepository.increment({ id: topicId }, 'viewCount', 1);
      }
    } catch {
      await this.topicRepository.increment({ id: topicId }, 'viewCount', 1);
    }
  }

  private buildViewerId(context: TopicViewContext): string | null {
    if (context.userId) {
      return `u:${context.userId}`;
    }

    if (!context.ip) {
      return null;
    }

    const raw = `${context.ip}|${context.userAgent || ''}`;
    const hash = createHash('sha256').update(raw).digest('hex').slice(0, 24);
    return `a:${hash}`;
  }

  async recordView(id: string, context: TopicViewContext = {}): Promise<{ viewed: boolean }> {
    await this.findOne(id);
    await this.tryIncrementViewCount(id, context);
    return { viewed: true };
  }

  /**
   * 获取话题详情（增加浏览次数）
   */
  async getDetail(id: string): Promise<Topic> {
    return this.findOne(id);
  }

  /**
   * 获取话题详情并记录浏览
   */
  async getDetailAndRecordView(id: string, context: TopicViewContext = {}): Promise<Topic> {
    const topic = await this.findOne(id);
    await this.tryIncrementViewCount(id, context);
    return topic;
  }

  /**
   * 更新话题
   */
  async update(
    id: string,
    updateTopicDto: UpdateTopicDto,
    userId: string,
  ): Promise<Topic> {
    const topic = await this.findOne(id);

    // 检查权限（只有创建者可以编辑）
    if (topic.creator.id !== userId) {
      throw new ForbiddenException('只有创建者可以编辑话题');
    }

    const { categoryId, tagIds, ...topicData } = updateTopicDto;

    // 更新分类
    if (categoryId !== undefined) {
      if (categoryId === null) {
        topic.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: categoryId, isDeleted: false, isActive: true },
        });
        if (!category) {
          throw new BadRequestException('分类不存在或已禁用');
        }
        topic.category = category;
      }
    }

    // 更新标签
    if (tagIds !== undefined) {
      if (tagIds.length === 0) {
        topic.tags = [];
      } else {
        const tags = await this.tagRepository.find({
          where: { id: In(tagIds), isDeleted: false, isActive: true },
        });
        if (tags.length !== tagIds.length) {
          throw new BadRequestException('部分标签不存在或已禁用');
        }
        topic.tags = tags;
      }
    }

    // XSS 防护：如果更新了内容，需要清理
    if (topicData.content) {
      const contentType = topicData.contentType || topic.contentType || 'html';
      topicData.content = XssSanitizer.sanitize(topicData.content, contentType);
    }

    // 封面图变更时删除旧封面
    if (topicData.cover !== undefined && topicData.cover !== topic.cover && topic.cover) {
      this.storageService.deleteFile(topic.cover).catch(() => {});
    }

    Object.assign(topic, topicData);
    return this.topicRepository.save(topic);
  }

  /**
   * 软删除话题
   */
  async remove(id: string, userId: string): Promise<void> {
    const topic = await this.findOne(id);

    // 检查权限
    if (topic.creator.id !== userId) {
      throw new ForbiddenException('只有创建者可以删除话题');
    }

    topic.isDeleted = true;
    await this.topicRepository.save(topic);

    // 删除封面图
    if (topic.cover) {
      this.storageService.deleteFile(topic.cover).catch(() => {});
    }

    // 减少标签使用次数
    if (topic.tags && topic.tags.length > 0) {
      await this.tagRepository
        .createQueryBuilder()
        .update(Tag)
        .set({ usageCount: () => 'GREATEST(usageCount - 1, 0)' })
        .where('id IN (:...ids)', { ids: topic.tags.map((t) => t.id) })
        .execute();
    }
  }

  /**
   * 置顶话题（管理员）
   */
  async sticky(id: string): Promise<Topic> {
    const topic = await this.findOne(id);
    topic.isSticky = true;
    return this.topicRepository.save(topic);
  }

  /**
   * 取消置顶（管理员）
   */
  async unsticky(id: string): Promise<Topic> {
    const topic = await this.findOne(id);
    topic.isSticky = false;
    return this.topicRepository.save(topic);
  }

  /**
   * 推荐话题（管理员）
   */
  async recommend(id: string): Promise<Topic> {
    const topic = await this.findOne(id);
    topic.isRecommended = true;
    return this.topicRepository.save(topic);
  }

  /**
   * 取消推荐（管理员）
   */
  async unrecommend(id: string): Promise<Topic> {
    const topic = await this.findOne(id);
    topic.isRecommended = false;
    return this.topicRepository.save(topic);
  }

  /**
   * 搜索话题
   */
  async search(keyword: string, page: number = 1, limit: number = 20) {
    const [topics, total] = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('topic.isPublic = :isPublic', { isPublic: true })
      .andWhere(
        '(topic.title LIKE :keyword OR topic.content LIKE :keyword OR topic.summary LIKE :keyword)',
        { keyword: `%${keyword}%` },
      )
      .orderBy('topic.isSticky', 'DESC')
      .addOrderBy('topic.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户的草稿列表
   */
  async getUserDrafts(userId: string, page: number = 1, limit: number = 20) {
    const [topics, total] = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.tags', 'tags')
      .where('topic.creatorId = :userId', { userId })
      .andWhere('topic.isDraft = :isDraft', { isDraft: true })
      .andWhere('topic.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('topic.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 发布草稿
   */
  async publishDraft(id: string, userId: string): Promise<Topic> {
    const topic = await this.findOne(id);

    // 检查权限
    if (topic.creator.id !== userId) {
      throw new ForbiddenException('只有创建者可以发布草稿');
    }

    // 检查是否为草稿
    if (!topic.isDraft) {
      throw new BadRequestException('该话题不是草稿');
    }

    topic.isDraft = false;
    return this.topicRepository.save(topic);
  }

  /**
   * 保存为草稿
   */
  async saveDraft(id: string, updateTopicDto: UpdateTopicDto, userId: string): Promise<Topic> {
    const topic = await this.findOne(id);

    // 检查权限
    if (topic.creator.id !== userId) {
      throw new ForbiddenException('只有创建者可以编辑话题');
    }

    const { categoryId, tagIds, ...topicData } = updateTopicDto;

    // 更新分类
    if (categoryId !== undefined) {
      if (categoryId === null) {
        topic.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: categoryId, isDeleted: false, isActive: true },
        });
        if (!category) {
          throw new BadRequestException('分类不存在或已禁用');
        }
        topic.category = category;
      }
    }

    // 更新标签
    if (tagIds !== undefined) {
      if (tagIds.length === 0) {
        topic.tags = [];
      } else {
        const tags = await this.tagRepository.find({
          where: { id: In(tagIds), isDeleted: false, isActive: true },
        });
        if (tags.length !== tagIds.length) {
          throw new BadRequestException('部分标签不存在或已禁用');
        }
        topic.tags = tags;
      }
    }

    // XSS 防护：如果更新了内容，需要清理
    if (topicData.content) {
      const contentType = topicData.contentType || topic.contentType || 'html';
      topicData.content = XssSanitizer.sanitize(topicData.content, contentType);
    }

    // 封面图变更时删除旧封面
    if (topicData.cover !== undefined && topicData.cover !== topic.cover && topic.cover) {
      this.storageService.deleteFile(topic.cover).catch(() => {});
    }

    // 确保保存为草稿
    topicData.isDraft = true;

    Object.assign(topic, topicData);
    return this.topicRepository.save(topic);
  }
}

