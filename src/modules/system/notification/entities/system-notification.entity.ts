import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from './notification.entity';

/**
 * 系统通知实体
 * 用于发送给所有用户的系统级通知
 */
@Entity('system_notification')
@Index('idx_system_notification_is_active', ['isActive'])
@Index('idx_system_notification_created', ['createdAt'])
export class SystemNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 通知类型
   */
  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: '通知类型',
  })
  type: NotificationType;

  /**
   * 通知标题
   */
  @Column({ type: 'varchar', length: 100, comment: '通知标题' })
  title: string;

  /**
   * 通知内容
   */
  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  /**
   * 是否激活
   * 只有激活的系统通知才会显示给用户
   */
  @Column({ type: 'boolean', default: true, comment: '是否激活' })
  isActive: boolean;

  /**
   * 创建者ID（管理员）
   */
  @Column({ type: 'uuid', comment: '创建者ID' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
