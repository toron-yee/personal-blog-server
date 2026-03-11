import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Topic } from '@/modules/system/topic/entities/topic.entity';
import { User } from '@/modules/system/user/entities/user.entity';

/**
 * 话题点赞实体
 * 记录用户对话题的点赞关系
 * 约束：同一用户对同一话题只能点赞一次（通过服务层幂等校验）
 */
@Entity('topic_like')
@Index('idx_topic_like_unique', ['topic', 'user'], { unique: true })
export class TopicLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 被点赞的话题
   * 多对一关系，一个话题可以被多个用户点赞
   */
  @ManyToOne(() => Topic, (topic) => topic.topicLikes, { nullable: false })
  topic: Topic;

  /**
   * 点赞用户
   * 多对一关系，一个用户可以点赞多个话题
   */
  @ManyToOne(() => User, (user) => user.topicLikes, { nullable: false })
  user: User;

  @CreateDateColumn({ name: 'created_at', comment: '点赞时间' })
  createdAt: Date;
}
