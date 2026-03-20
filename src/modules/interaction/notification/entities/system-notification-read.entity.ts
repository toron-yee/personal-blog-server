import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '@/modules/identity/user/entities/user.entity';
import { SystemNotification } from './system-notification.entity';

/**
 * 系统通知已读记录实体
 * 记录用户对系统通知的已读状态
 */
@Entity('system_notification_read')
@Index('idx_system_notification_read_unique', ['user', 'notification'], { unique: true })
@Index('idx_system_notification_read_user', ['user'])
@Index('idx_system_notification_read_notification', ['notification'])
export class SystemNotificationRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 用户
   * 多对一关系，一个用户可以有多条已读记录
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  /**
   * 系统通知
   * 多对一关系，一个系统通知可以被多个用户标记为已读
   */
  @ManyToOne(() => SystemNotification, { nullable: false, onDelete: 'CASCADE' })
  notification: SystemNotification;

  @CreateDateColumn({ name: 'read_at', comment: '已读时间' })
  readAt: Date;
}

