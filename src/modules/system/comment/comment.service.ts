import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Topic } from '../topic/entities/topic.entity';
import { User } from '../user/entities/user.entity';
import { CommentStatus, ViolationType } from '@/common/enums/comment.enum';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ContentModerationService } from './services/content-moderation.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

interface FindViolationsFilter {
  status?: CommentStatus;
  violationType?: ViolationType;
  topicId?: string;
  creatorId?: string;
  dateRange?: Date[];
  page?: number;
  limit?: number;
}

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private contentModerationService: ContentModerationService,
    private notificationService: NotificationService,
  ) {}

  /**
   * 创建评论
   */
  async create(createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    const { topicId, parentId, replyToUserId, content } = createCommentDto;

    // 实时内容检查
    const checkResult = await this.contentModerationService.checkContentRealtime(content);
    if (checkResult.isViolation) {
      throw new BadRequestException(checkResult.reason);
    }

    // 检查话题是否存在
    const topic = await this.topicRepository.findOne({
      where: { id: topicId, isDeleted: false },
    });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    // 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查父评论（如果是回复）
    let parent = null;
    if (parentId) {
      parent = await this.commentRepository.findOne({
        where: { id: parentId, isDeleted: false },
      });
      if (!parent) {
        throw new NotFoundException('父评论不存在');
      }
    }

    // 创建评论
    const comment = this.commentRepository.create({
      content,
      topic,
      creator: user,
      parent,
      replyToUserId,
      status: CommentStatus.NORMAL,
    });

    const saved = await this.commentRepository.save(comment);

    // 更新话题的评论计数
    await this.topicRepository.increment({ id: topicId }, 'commentCount', 1);

    // 如果是回复，发送通知给被回复的用户
    if (parentId && replyToUserId && replyToUserId !== userId) {
      try {
        await this.notificationService.create({
          recipientId: replyToUserId,
          actorId: userId,
          type: NotificationType.COMMENT_REPLY,
          targetId: saved.id,
          targetType: 'comment',
          content: `${user.username} 回复了你的评论`,
        });
      } catch (error) {
        // 通知创建失败不影响评论创建
        console.error('创建通知失败:', error);
      }
    }

    return saved;
  }

  /**
   * 获取话题的评论列表
   */
  async findByTopic(topicId: string, page: number = 1, limit: number = 20) {
    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.creator', 'creator')
      .leftJoinAndSelect('comment.topic', 'topic')
      .leftJoinAndSelect('comment.likes', 'likes')
      .leftJoinAndSelect('comment.children', 'children')
      .where('comment.topicId = :topicId', { topicId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('comment.status = :status', { status: CommentStatus.NORMAL })
      .andWhere('comment.parentId IS NULL')  // 只获取顶级评论
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取评论的回复列表
   */
  async findReplies(commentId: string, page: number = 1, limit: number = 20) {
    const [replies, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.creator', 'creator')
      .leftJoinAndSelect('comment.replyToUser', 'replyToUser')
      .where('comment.parentId = :parentId', { parentId: commentId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('comment.status = :status', { status: CommentStatus.NORMAL })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: replies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取用户的评论列表
   */
  async findByUser(userId: string, page: number = 1, limit: number = 20) {
    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.topic', 'topic')
      .leftJoinAndSelect('comment.creator', 'creator')
      .leftJoinAndSelect('comment.likes', 'likes')
      .where('comment.creatorId = :userId', { userId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('comment.status = :status', { status: CommentStatus.NORMAL })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单个评论
   */
  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.creator', 'creator')
      .leftJoinAndSelect('comment.topic', 'topic')
      .leftJoinAndSelect('comment.children', 'children')
      .where('comment.id = :id', { id })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  /**
   * 更新评论
   */
  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment> {
    const comment = await this.findOne(id);

    // 检查权限
    if (comment.creator.id !== userId) {
      throw new BadRequestException('只有创建者可以编辑评论');
    }

    // 如果更新内容，进行内容检查
    if (updateCommentDto.content) {
      const checkResult = await this.contentModerationService.checkContentRealtime(
        updateCommentDto.content,
      );
      if (checkResult.isViolation) {
        throw new BadRequestException(checkResult.reason);
      }
    }

    Object.assign(comment, updateCommentDto);
    return this.commentRepository.save(comment);
  }

  /**
   * 删除评论（软删除）
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    // 检查权限
    if (comment.creator.id !== userId) {
      throw new BadRequestException('只有创建者可以删除评论');
    }

    comment.isDeleted = true;
    await this.commentRepository.save(comment);

    // 更新话题的评论计数
    if (comment.topic && comment.topic.commentCount > 0) {
      await this.topicRepository.decrement(
        { id: comment.topic.id },
        'commentCount',
        1,
      );
    }
  }

  /**
   * 查询违规评论
   * 支持多维度过滤和分页
   */
  async findViolations(filters: FindViolationsFilter) {
    const {
      status,
      violationType,
      topicId,
      creatorId,
      dateRange,
      page = 1,
      limit = 20,
    } = filters;

    const query = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.topic', 'topic')
      .leftJoinAndSelect('comment.creator', 'creator');

    // 状态过滤
    if (status) {
      query.andWhere('comment.status = :status', { status });
    } else {
      // 默认查询非正常状态的评论
      query.andWhere('comment.status != :normalStatus', {
        normalStatus: CommentStatus.NORMAL,
      });
    }

    // 违规类型过滤
    if (violationType) {
      query.andWhere('comment.violationType = :violationType', {
        violationType,
      });
    }

    // 话题过滤
    if (topicId) {
      query.andWhere('comment.topicId = :topicId', { topicId });
    }

    // 创建者过滤
    if (creatorId) {
      query.andWhere('comment.creatorId = :creatorId', { creatorId });
    }

    // 日期范围过滤
    if (dateRange && dateRange.length === 2) {
      query.andWhere('comment.reviewedAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange[0],
        endDate: dateRange[1],
      });
    }

    // 排序和分页
    const [data, total] = await query
      .orderBy('comment.reviewedAt', 'DESC')
      .addOrderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 标记评论为可疑
   * 用于实时过滤未通过的评论
   */
  async flagComment(
    commentId: string,
    violationType: ViolationType,
    reason: string,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    comment.status = CommentStatus.FLAGGED;
    comment.violationType = violationType;
    comment.violationReason = reason;

    return this.commentRepository.save(comment);
  }

  /**
   * 拒绝评论
   * 标记为已拒绝状态，记录审核信息
   */
  async rejectComment(
    commentId: string,
    violationType: ViolationType,
    reason: string,
    reviewedBy: string,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    comment.status = CommentStatus.REJECTED;
    comment.violationType = violationType;
    comment.violationReason = reason;
    comment.reviewedBy = reviewedBy;
    comment.reviewedAt = new Date();

    return this.commentRepository.save(comment);
  }

  /**
   * 隐藏评论
   * 用于用户举报或管理员操作
   */
  async hideComment(commentId: string, reason: string, reviewedBy: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    comment.status = CommentStatus.HIDDEN;
    comment.violationReason = reason;
    comment.reviewedBy = reviewedBy;
    comment.reviewedAt = new Date();

    return this.commentRepository.save(comment);
  }

  /**
   * 恢复评论
   * 将被拒绝或隐藏的评论恢复为正常状态
   */
  async restoreComment(commentId: string, reviewedBy: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    comment.status = CommentStatus.NORMAL;
    comment.violationType = null;
    comment.violationReason = null;
    comment.reviewedBy = reviewedBy;
    comment.reviewedAt = new Date();

    return this.commentRepository.save(comment);
  }

  /**
   * 获取用户的违规评论统计
   */
  async getUserViolationStats(userId: string) {
    const stats = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('comment.creatorId = :userId', { userId })
      .andWhere('comment.status != :normalStatus', {
        normalStatus: CommentStatus.NORMAL,
      })
      .groupBy('comment.status')
      .getRawMany();

    return stats;
  }

  /**
   * 获取待审核评论数量
   */
  async getPendingReviewCount() {
    return this.commentRepository.count({
      where: { status: CommentStatus.PENDING_REVIEW },
    });
  }

  /**
   * 批量更新评论状态为待审核
   * 用于异步审核任务
   */
  async updateToPendingReview(
    commentIds: string[],
    violationType: ViolationType,
    reason: string,
  ) {
    return this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({
        status: CommentStatus.PENDING_REVIEW,
        violationType,
        violationReason: reason,
      })
      .where('id IN (:...ids)', { ids: commentIds })
      .execute();
  }
}
