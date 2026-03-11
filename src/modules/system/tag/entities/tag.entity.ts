import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Topic } from '@/modules/system/topic/entities/topic.entity';

/**
 * 标签实体
 * 用于对话题进行标签管理，支持多对多关联
 */
@Entity('tag')
@Index('idx_tag_is_deleted', ['isDeleted'])
@Index('idx_tag_is_active', ['isActive'])
@Index('idx_tag_deleted_active', ['isDeleted', 'isActive'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '标签名称' })
  name: string;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6', comment: '标签颜色（十六进制）' })
  color: string;

  @Column({ type: 'varchar', length: 200, default: '', comment: '标签描述' })
  description: string;

  @Column({ type: 'int', default: 0, comment: '使用次数' })
  usageCount: number;

  @Column({ type: 'boolean', default: true, comment: '是否启用：0-禁用 1-启用' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, comment: '是否删除：0-未删除 1-已删除' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  /**
   * 与话题的多对多关联
   * 一个标签可以被多个话题使用
   */
  @ManyToMany(() => Topic, (topic) => topic.tags)
  topics: Topic[];

  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    // 数据校验逻辑
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('标签名称不能为空');
    }

    // 验证颜色格式
    if (!/^#[0-9A-Fa-f]{6}$/.test(this.color)) {
      throw new Error('标签颜色格式不正确，请使用十六进制格式，如：#3B82F6');
    }

    // 格式化标签名称为小写
    this.name = this.name.toLowerCase().trim();
  }
}
