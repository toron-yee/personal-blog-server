import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicLike } from './entities/topic-like.entity';
import { Topic } from '../topic/entities/topic.entity';
import { User } from '../user/entities/user.entity';
import { CreateTopicLikeDto } from './dto/create-topic-like.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class TopicLikeService {
  constructor(
    @InjectRepository(TopicLike)
    private topicLikeRepository: Repository<TopicLike>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
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
    const topic = await this.topicRepository.findOne({
      where: { id: topicId, isDeleted: false },
      relations: ['creator'],
    });

    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    // 检查用户是否存在且未删除
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

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
    await this.topicRepository.increment(
      { id: topicId },
      'likeCount',
      1,
    );

    // 发送通知给话题创建者
    if (topic.creator && topic.creator.id !== userId) {
      try {
        await this.notificationService.create({
          recipientId: topic.creator.id,
          actorId: userId,
          type: NotificationType.TOPIC_LIKED,
          targetId: topicId,
          targetType: 'topic',
          content: `${user.username} 点赞了你的话题`,
        });
      } catch (error) {
        // 通知创建失败不影响点赞操作
        console.error('创建通知失败:', error);
      }
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
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
    });

    if (topic && topic.likeCount > 0) {
      await this.topicRepository.decrement(
        { id: topicId },
        'likeCount',
        1,
      );
    }
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
