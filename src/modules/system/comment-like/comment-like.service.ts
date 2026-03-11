import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentLike } from './entities/comment-like.entity';
import { Comment } from '../comment/entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { CreateCommentLikeDto } from './dto/create-comment-like.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class CommentLikeService {
  constructor(
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  /**
   * 点赞评论
   * 幂等操作：重复点赞返回已存在的记录
   */
  async like(
    createCommentLikeDto: CreateCommentLikeDto,
    userId: string,
  ): Promise<CommentLike> {
    const { commentId } = createCommentLikeDto;

    // 检查评论是否存在且未删除
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
      relations: ['creator'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查用户是否存在
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已点赞（幂等性）
    const existing = await this.commentLikeRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });

    if (existing) {
      return existing;
    }

    // 创建点赞记录
    const commentLike = this.commentLikeRepository.create({
      comment,
      user,
    });

    const saved = await this.commentLikeRepository.save(commentLike);

    // 更新评论的点赞计数
    await this.commentRepository.increment(
      { id: commentId },
      'likeCount',
      1,
    );

    // 发送通知给评论创建者
    if (comment.creator && comment.creator.id !== userId) {
      try {
        await this.notificationService.create({
          recipientId: comment.creator.id,
          actorId: userId,
          type: NotificationType.COMMENT_LIKED,
          targetId: commentId,
          targetType: 'comment',
          content: `${user.username} 点赞了你的评论`,
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
  async unlike(commentId: string, userId: string): Promise<void> {
    const commentLike = await this.commentLikeRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });

    if (!commentLike) {
      throw new NotFoundException('点赞记录不存在');
    }

    await this.commentLikeRepository.remove(commentLike);

    // 更新评论的点赞计数
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (comment && comment.likeCount > 0) {
      await this.commentRepository.decrement(
        { id: commentId },
        'likeCount',
        1,
      );
    }
  }

  /**
   * 检查用户是否点赞了评论
   */
  async isLiked(commentId: string, userId: string): Promise<boolean> {
    const commentLike = await this.commentLikeRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });

    return !!commentLike;
  }

  /**
   * 获取评论的点赞用户列表
   */
  async getLikeUsers(commentId: string, page: number = 1, limit: number = 20) {
    const [users, total] = await this.commentLikeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'user')
      .where('like.commentId = :commentId', { commentId })
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
   * 获取用户点赞的评论列表
   */
  async getUserLikedComments(userId: string, page: number = 1, limit: number = 20) {
    const [likes, total] = await this.commentLikeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.comment', 'comment')
      .where('like.userId = :userId', { userId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('like.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: likes.map((like) => like.comment),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取评论的点赞数量
   */
  async getLikeCount(commentId: string): Promise<number> {
    return this.commentLikeRepository.count({
      where: { comment: { id: commentId } },
    });
  }

  /**
   * 批量检查用户是否点赞了多个评论
   */
  async checkLikedComments(
    commentIds: string[],
    userId: string,
  ): Promise<Record<string, boolean>> {
    const likes = await this.commentLikeRepository
      .createQueryBuilder('like')
      .where('like.commentId IN (:...commentIds)', { commentIds })
      .andWhere('like.userId = :userId', { userId })
      .getMany();

    const likedMap: Record<string, boolean> = {};
    commentIds.forEach((id) => {
      likedMap[id] = likes.some((like) => like.comment.id === id);
    });

    return likedMap;
  }
}
