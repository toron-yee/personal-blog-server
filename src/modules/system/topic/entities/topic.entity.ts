import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index
} from 'typeorm';
import { Category } from '@/modules/system/category/entities/category.entity';
import { Tag } from '@/modules/system/tag/entities/tag.entity';
import { User } from '@/modules/system/user/entities/user.entity';
import { Comment } from '@/modules/system/comment/entities/comment.entity';
import { TopicLike } from '@/modules/system/topic-like/entities/topic-like.entity';

/**
 * 话题实体
 * 博客系统的核心内容实体，包含标题、内容等基本信息
 */
@Entity('topic')
@Index('idx_topic_is_deleted', ['isDeleted'])
@Index('idx_topic_deleted_created', ['isDeleted', 'createdAt'])
@Index('idx_topic_deleted_sticky', ['isDeleted', 'isSticky'])
@Index('idx_topic_deleted_recommended', ['isDeleted', 'isRecommended'])
@Index('idx_topic_creator_deleted', ['creator', 'isDeleted'])
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, comment: '话题标题' })
  title: string;

  @Column({ type: 'text', comment: '话题内容' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'html', comment: '内容类型: html/markdown/plain' })
  contentType: 'html' | 'markdown' | 'plain';

  @Column({ type: 'varchar', length: 255, default: '', comment: '话题封面图片URL' })
  cover: string;

  @Column({ type: 'varchar', length: 200, default: '', comment: '话题摘要' })
  summary: string;

  @Column({ type: 'boolean', default: false, comment: '是否置顶：0-不置顶 1-置顶' })
  isSticky: boolean;

  @Column({ type: 'boolean', default: false, comment: '是否推荐：0-不推荐 1-推荐' })
  isRecommended: boolean;

  @Column({ type: 'boolean', default: true, comment: '是否公开：0-私密 1-公开' })
  isPublic: boolean;

  @Column({ type: 'boolean', default: false, comment: '是否草稿：0-已发布 1-草稿' })
  isDraft: boolean;

  @Column({ type: 'boolean', default: false, comment: '是否删除：0-未删除 1-已删除' })
  isDeleted: boolean;

  @Column({ type: 'int', default: 0, comment: '浏览次数' })
  viewCount: number;

  @Column({ type: 'int', default: 0, comment: '点赞次数' })
  likeCount: number;

  @Column({ type: 'int', default: 0, comment: '评论次数' })
  commentCount: number;

  /**
   * 创建者关联
   * 多对一关系，一个用户可以创建多个话题
   */
  @ManyToOne(() => User, (user) => user.topics)
  creator: User;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  /**
   * 与类别的一对一关联
   * 一个话题仅归属一个类别
   */
  @OneToOne(() => Category, { nullable: true })
  category: Category;

  /**
   * 与标签的多对多关联
   * 一个话题可以绑定多个标签（最少1个，最多5个）
   */
  @ManyToMany(() => Tag, (tag) => tag.topics)
  @JoinTable()
  tags: Tag[];

  /**
   * 话题的评论
   * 一对多关系，一个话题可以有多个评论
   */
  @OneToMany(() => Comment, (comment) => comment.topic)
  comments: Comment[];

  /**
   * 话题的点赞
   * 一对多关系，一个话题可以被多个用户点赞
   */
  @OneToMany(() => TopicLike, (like) => like.topic)
  topicLikes: TopicLike[];

  /**
   * 在保存前验证数据
   */
  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    // 数据校验逻辑
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('话题标题不能为空');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new Error('话题内容不能为空');
    }

    // 如果没有提供摘要，则从内容中截取
    if (!this.summary || this.summary.trim().length === 0) {
      this.summary = this.content.substring(0, 200);
      if (this.summary.length === 200) {
        this.summary += '...';
      }
    }

    // 验证标签数量
    if (this.tags && this.tags.length > 5) {
      throw new Error('话题最多只能绑定5个标签');
    }

    // 清理标题和内容的前后空格
    this.title = this.title.trim();
    this.content = this.content.trim();
  }

  /**
   * 检查是否可以添加标签
   * 用于业务逻辑中的约束检查
   */
  canAddTag(): boolean {
    return !this.tags || this.tags.length < 5;
  }

  /**
   * 添加标签（确保不超过最大数量）
   * @param tag 要添加的标签
   */
  addTag(tag: Tag): void {
    if (!this.canAddTag()) {
      throw new Error('话题标签数量已达到上限（最多5个）');
    }

    if (!this.tags) {
      this.tags = [];
    }

    // 检查标签是否已存在
    if (!this.tags.some(existingTag => existingTag.id === tag.id)) {
      this.tags.push(tag);
    }
  }

  /**
   * 移除标签
   * @param tag 要移除的标签
   */
  removeTag(tag: Tag): void {
    if (this.tags) {
      this.tags = this.tags.filter(existingTag => existingTag.id !== tag.id);
    }
  }
}
