import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '@/modules/system/user/entities/user.entity';

export enum NotificationType {
  COMMENT_REPLY = 'COMMENT_REPLY', // 评论被回复
  TOPIC_LIKED = 'TOPIC_LIKED', // 话题被点赞
  COMMENT_LIKED = 'COMMENT_LIKED', // 评论被点赞
}

/**
 * 通知实体
 * 记录用户的各类通知（评论回复、点赞等）
 */
@Entity('notification')
@Index('idx_notification_recipient_created', ['recipient', 'createdAt'])
@Index('idx_notification_recipient_is_read', ['recipient', 'isRead'])
@Index('idx_notification_recipient_type', ['recipient', 'type'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 通知接收者
   * 多对一关系，一个用户可以收到多个通知
   */
  @ManyToOne(() => User, (user) => user.notifications, { nullable: false })
  recipient: User;

  /**
   * 通知类型
   * COMMENT_REPLY: 评论被回复
   * TOPIC_LIKED: 话题被点赞
   * COMMENT_LIKED: 评论被点赞
   */
  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: '通知类型',
  })
  type: NotificationType;

  /**
   * 操作者（谁执行了这个操作）
   * 多对一关系，一个用户可以触发多个通知
   */
  @ManyToOne(() => User, { nullable: false })
  actor: User;

  /**
   * 目标ID（被评论/点赞的内容ID）
   * 可以是 comment_id 或 topic_id
   */
  @Column({ type: 'uuid', comment: '目标ID（comment或topic的ID）' })
  targetId: string;

  /**
   * 目标类型
   * comment: 评论
   * topic: 话题
   */
  @Column({ type: 'varchar', length: 20, comment: '目标类型（comment/topic）' })
  targetType: string;

  /**
   * 通知内容
   * 用于展示给用户的文本内容
   */
  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  /**
   * 是否已读
   */
  @Column({ type: 'boolean', default: false, comment: '是否已读' })
  isRead: boolean;

  /**
   * 已读时间
   */
  @Column({ type: 'timestamp', nullable: true, comment: '已读时间' })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
