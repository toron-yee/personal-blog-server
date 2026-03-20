import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@/common/enums/user.enum';
import { Topic } from '@/modules/content/topic/entities/topic.entity';
import { Comment } from '@/modules/content/comment/entities/comment.entity';
import { CommentLike } from '@/modules/interaction/comment-like/entities/comment-like.entity';
import { TopicLike } from '@/modules/interaction/topic-like/entities/topic-like.entity';
import { Notification } from '@/modules/interaction/notification/entities/notification.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_user_email', { unique: true })
  @Column({ type: 'varchar', length: 100, unique: true, comment: '邮箱' })
  email: string;

  @Index('idx_user_username', { unique: true })
  @Column({ type: 'varchar', length: 30, unique: true, comment: '用户名' })
  username: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 200, comment: '密码' })
  password: string;

  @Column({ type: 'varchar', length: 30, comment: '昵称' })
  nickname: string;

  @Column({ type: 'varchar', default: '', comment: '头像' })
  avatar: string;

  @Column({ type: 'varchar', default: '', comment: '个人网址' })
  website: string;

  @Column({ type: 'varchar', length: 200, default: '', comment: '个人简介' })
  intro: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER, comment: '角色: 0访客 1用户 2管理员 3超级管理员' })
  role: UserRole;

  @Column({ type: 'int', default: 0, comment: '粉丝数（预留字段）' })
  followerCount: number;

  @Column({ type: 'int', default: 0, comment: '关注数（预留字段）' })
  followingCount: number;

  /**
   * 创建的话题关联
   * 一个用户可以创建多个话题
   */
  @OneToMany(() => Topic, (topic) => topic.creator)
  topics: Topic[];

  /**
   * 创建的评论关联
   * 一个用户可以创建多个评论
   */
  @OneToMany(() => Comment, (comment) => comment.creator)
  comments: Comment[];

  /**
   * 点赞的评论关联
   * 一个用户可以点赞多个评论
   */
  @OneToMany(() => CommentLike, (like) => like.user)
  commentLikes: CommentLike[];

  /**
   * 点赞的话题关联
   * 一个用户可以点赞多个话题
   */
  @OneToMany(() => TopicLike, (like) => like.user)
  topicLikes: TopicLike[];

  /**
   * 接收的通知关联
   * 一个用户可以接收多个通知
   */
  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications: Notification[];

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @BeforeInsert()
  hashPassword() {
    if (this.password) {
      this.password = bcrypt.hashSync(this.password, 10);
    }
  }
}

