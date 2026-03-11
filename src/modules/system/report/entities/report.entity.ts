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
import { ReportType, ReportStatus, ReportReason } from '@/common/enums/report.enum';

/**
 * 举报实体
 * 用户对评论、话题、用户等的举报
 */
@Entity('report')
@Index('idx_report_type_status', ['type', 'status'])
@Index('idx_report_target_id', ['targetId'])
@Index('idx_report_reporter_id', ['reporter'])
@Index('idx_report_created_at', ['createdAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 举报类型
   * COMMENT: 举报评论 | TOPIC: 举报话题 | USER: 举报用户
   */
  @Column({
    type: 'enum',
    enum: ReportType,
    comment: '举报类型',
  })
  type: ReportType;

  /**
   * 被举报对象的 ID
   * 根据 type 的值，可能是评论ID、话题ID或用户ID
   */
  @Column({ type: 'uuid', comment: '被举报对象ID' })
  targetId: string;

  /**
   * 举报人
   * 多对一关系，一个用户可以进行多次举报
   */
  @ManyToOne(() => User, { nullable: false })
  reporter: User;

  /**
   * 举报原因
   */
  @Column({
    type: 'enum',
    enum: ReportReason,
    comment: '举报原因',
  })
  reason: ReportReason;

  /**
   * 举报详细说明
   */
  @Column({ type: 'text', comment: '举报详细说明' })
  description: string;

  /**
   * 举报状态
   * PENDING: 待审核 | PROCESSING: 处理中 | RESOLVED: 已处理 | REJECTED: 已驳回
   */
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    comment: '举报状态',
  })
  status: ReportStatus;

  /**
   * 处理结果说明
   */
  @Column({ type: 'text', nullable: true, comment: '处理结果说明' })
  resolution: string | null;

  /**
   * 处理人 ID
   */
  @Column({ type: 'uuid', nullable: true, comment: '处理人ID' })
  handledBy: string | null;

  /**
   * 处理时间
   */
  @UpdateDateColumn({ name: 'handled_at', nullable: true, comment: '处理时间' })
  handledAt: Date | null;

  /**
   * 是否删除（软删除）
   */
  @Column({ type: 'boolean', default: false, comment: '是否删除' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
