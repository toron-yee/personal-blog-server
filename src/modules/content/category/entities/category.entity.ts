import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Topic } from '@/modules/content/topic/entities/topic.entity';

/**
 * 类别实体
 * 用于对话题进行分类管理
 */
@Entity('category')
@Index('idx_category_is_deleted', ['isDeleted'])
@Index('idx_category_is_active', ['isActive'])
@Index('idx_category_deleted_active', ['isDeleted', 'isActive'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '类别名称' })
  name: string;

  @Column({ type: 'varchar', length: 200, default: '', comment: '类别描述' })
  description: string;

  @Column({ type: 'varchar', default: '', comment: '类别图标' })
  icon: string;

  @Column({ type: 'int', default: 0, comment: '排序权重，数值越大越靠前' })
  sort: number;

  @Column({ type: 'boolean', default: true, comment: '是否启用：0-禁用 1-启用' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, comment: '是否删除：0-未删除 1-已删除' })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  /**
   * 与话题的一对一关联
   * 一个类别可以包含多个话题
   */
  @OneToMany(() => Topic, (topic) => topic.category)
  topics: Topic[];

  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    // 数据校验逻辑
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('类别名称不能为空');
    }

    // 可以添加更多的数据校验逻辑
  }
}

