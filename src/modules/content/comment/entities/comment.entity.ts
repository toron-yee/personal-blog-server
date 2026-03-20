import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Topic } from '@/modules/content/topic/entities/topic.entity';
import { User } from '@/modules/identity/user/entities/user.entity';
import { CommentLike } from '@/modules/interaction/comment-like/entities/comment-like.entity';
import { CommentStatus, ViolationType } from '@/common/enums/comment.enum';

/**
 * 评论实体
 * 用户对话题的评论，支持回复功能
 */
@Entity('comment')
@Index('idx_comment_status', ['status'])
@Index('idx_comment_topic_status', ['topic', 'status'])
@Index('idx_comment_creator_status', ['creator', 'status'])
@Index('idx_comment_reviewed_at', ['reviewedAt'])
@Index('idx_comment_deleted_created', ['isDeleted', 'createdAt'])
@Index('idx_comment_topic_deleted', ['topic', 'isDeleted'])
@Index('idx_comment_parent_deleted', ['parent', 'isDeleted'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 评论内容
   */
  @Column({ type: 'text', comment: '评论内容' })
  content: string;

  /**
   * 所属话题
   * 多对一关系，一个话题可以有多个评论
   */
  @ManyToOne(() => Topic, (topic) => topic.comments, { nullable: false })
  topic: Topic;

  /**
   * 评论创建者
   * 多对一关系，一个用户可以创建多个评论
   */
  @ManyToOne(() => User, (user) => user.comments, { nullable: false })
  creator: User;

  /**
   * 父评论（用于支持回复功能）
   * 可选的自引用，用于构建评论树
   */
  @ManyToOne(() => Comment, (comment) => comment.children, { nullable: true })
  parent: Comment | null;

  /**
   * 子评论（回复）
   * 一对多关系，一个评论可以有多个回复
   */
  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];

  /**
   * 被回复的用户
   * 当这是一条回复时，记录被回复的用户ID
   * 用于通知和展示，不作为外键约束
   */
  @Column({ type: 'uuid', nullable: true, comment: '被回复的用户ID' })
  replyToUserId: string | null;

  /**
   * 点赞次数
   * 用于快速查询，实际点赞关系存储在 CommentLike 表
   */
  @Column({ type: 'int', default: 0, comment: '点赞次数' })
  likeCount: number;

  /**
   * 举报次数
   * 用于快速查询，实际举报信息存储在 Report 表
   */
  @Column({ type: 'int', default: 0, comment: '举报次数' })
  reportCount: number;

  /**
   * 评论状态
   * NORMAL: 正常 | FLAGGED: 标记为可疑 | PENDING_REVIEW: 待审核 | REJECTED: 已拒绝 | HIDDEN: 已隐藏
   */
  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.NORMAL,
    comment: '评论状态',
  })
  status: CommentStatus;

  /**
   * 违规类型
   */
  @Column({
    type: 'enum',
    enum: ViolationType,
    nullable: true,
    comment: '违规类型',
  })
  violationType: ViolationType | null;

  /**
   * 违规原因说明
   */
  @Column({ type: 'text', nullable: true, comment: '违规原因说明' })
  violationReason: string | null;

  /**
   * 审核人ID
   */
  @Column({ type: 'uuid', nullable: true, comment: '审核人ID' })
  reviewedBy: string | null;

  /**
   * 审核时间
   */
  @UpdateDateColumn({ name: 'reviewed_at', nullable: true, comment: '审核时间' })
  reviewedAt: Date | null;

  /**
   * 是否删除（软删除）
   */
  @Column({ type: 'boolean', default: false, comment: '是否删除' })
  isDeleted: boolean;

  /**
   * 评论点赞关系
   * 一对多关系，一个评论可以被多个用户点赞
   */
  @OneToMany(() => CommentLike, (like) => like.comment)
  likes: CommentLike[];

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  /**
   * 在保存前验证数据
   */
  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('评论内容不能为空');
    }

    if (this.content.length > 5000) {
      throw new Error('评论内容不能超过5000字符');
    }

    this.content = this.content.trim();
  }
}

