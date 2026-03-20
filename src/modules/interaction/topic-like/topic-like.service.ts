import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicReaderService } from '@/modules/content/topic/topic-reader.service';
import { TopicStatsService } from '@/modules/content/topic/topic-stats.service';
import { UserReaderService } from '@/modules/identity/user/user-reader.service';
import { NotificationTriggerService } from '@/modules/interaction/notification/notification-trigger.service';
import { CreateTopicLikeDto } from './dto/create-topic-like.dto';
import { TopicLike } from './entities/topic-like.entity';

@Injectable()
export class TopicLikeService {
  constructor(
    @InjectRepository(TopicLike)
    private topicLikeRepository: Repository<TopicLike>,
    private topicReaderService: TopicReaderService,
    private topicStatsService: TopicStatsService,
    private notificationTriggerService: NotificationTriggerService,
    private userReaderService: UserReaderService,
  ) {}

  /**
   * 点赞话题
   * 幂等操作：重复点赞返回已存在的记录
   */
  async like(
    createTopicLikeDto: CreateTopicLikeDto,
    userId: string,
  ): Promise<TopicLike> {
    const { topicId } = createTopicLikeDto;

    // 检查话题是否存在且未删除
    const topic = await this.topicReaderService.findActiveTopicByIdOrFail(topicId, {
      relations: ['creator'],
    });

    // 检查用户是否存在且未删除
    const user = await this.userReaderService.findUserEntityByIdOrFail(userId);

    // 检查是否已点赞（幂等性）
    const existing = await this.topicLikeRepository.findOne({
      where: { topic: { id: topicId }, user: { id: userId } },
    });

    if (existing) {
      return existing;
    }

    // 创建点赞记录
    const topicLike = this.topicLikeRepository.create({
      topic,
      user,
    });

    const saved = await this.topicLikeRepository.save(topicLike);

    // 更新话题的点赞计数
    await this.topicStatsService.incrementLikeCount(topicId);

    // 发送通知给话题创建者
    if (topic.creator && topic.creator.id !== userId) {
      await this.notificationTriggerService.notifyTopicLiked({
        recipientId: topic.creator.id,
        actorId: userId,
        actorUsername: user.username,
        targetId: topicId,
      });
    }

    return saved;
  }

  /**
   * 取消点赞
   */
  async unlike(topicId: string, userId: string): Promise<void> {
    const topicLike = await this.topicLikeRepository.findOne({
      where: { topic: { id: topicId }, user: { id: userId } },
    });

    if (!topicLike) {
      throw new NotFoundException('点赞记录不存在');
    }

    await this.topicLikeRepository.remove(topicLike);

    // 更新话题的点赞计数
    await this.topicStatsService.decrementLikeCount(topicId);
  }

  /**
   * 检查用户是否点赞了话题
   */
  async isLiked(topicId: string, userId: string): Promise<boolean> {
    const topicLike = await this.topicLikeRepository.findOne({
      where: { topic: { id: topicId }, user: { id: userId } },
    });

    return !!topicLike;
  }

  /**
   * 获取话题的点赞用户列表
   */
  async getLikeUsers(topicId: string, page: number = 1, limit: number = 20) {
    const [users, total] = await this.topicLikeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'user')
      .where('like.topicId = :topicId', { topicId })
      .orderBy('like.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map((like) => like.user),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户点赞的话题列表
   */
  async getUserLikedTopics(userId: string, page: number = 1, limit: number = 20) {
    const [likes, total] = await this.topicLikeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.topic', 'topic')
      .where('like.userId = :userId', { userId })
      .andWhere('topic.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('like.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: likes.map((like) => like.topic),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取话题的点赞数量
   */
  async getLikeCount(topicId: string): Promise<number> {
    return this.topicLikeRepository.count({
      where: { topic: { id: topicId } },
    });
  }

  /**
   * 批量检查用户是否点赞了多个话题
   */
  async checkLikedTopics(
    topicIds: string[],
    userId: string,
  ): Promise<Record<string, boolean>> {
    const likes = await this.topicLikeRepository
      .createQueryBuilder('like')
      .where('like.topicId IN (:...topicIds)', { topicIds })
      .andWhere('like.userId = :userId', { userId })
      .getMany();

    const likedMap: Record<string, boolean> = {};
    topicIds.forEach((id) => {
      likedMap[id] = likes.some((like) => like.topic.id === id);
    });

    return likedMap;
  }
}
