import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Comment } from '@/modules/system/comment/entities/comment.entity';
import { User } from '@/modules/system/user/entities/user.entity';

/**
 * 评论点赞实体
 * 记录用户对评论的点赞关系
 * 约束：同一用户对同一评论只能点赞一次（通过服务层幂等校验）
 */
@Entity('comment_like')
@Index('idx_comment_like_unique', ['comment', 'user'], { unique: true })
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 被点赞的评论
   * 多对一关系，一个评论可以被多个用户点赞
   */
  @ManyToOne(() => Comment, (comment) => comment.likes, { nullable: false })
  comment: Comment;

  /**
   * 点赞用户
   * 多对一关系，一个用户可以点赞多个评论
   */
  @ManyToOne(() => User, (user) => user.commentLikes, { nullable: false })
  user: User;

  @CreateDateColumn({ name: 'created_at', comment: '点赞时间' })
  createdAt: Date;
}
