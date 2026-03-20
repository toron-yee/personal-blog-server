import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/identity/user/entities/user.entity';
import { AiMessage } from '@/modules/interaction/ai-message/entities/ai-message.entity';

@Entity('ai_conversation')
@Index('idx_ai_conversation_user_id', ['userId'])
@Index('idx_ai_conversation_user_archived', ['userId', 'isArchived'])
@Index('idx_ai_conversation_user_pinned', ['userId', 'isPinned', 'pinnedAt'])
@Index('idx_ai_conversation_last_message_at', ['lastMessageAt'])
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', comment: '所属用户 ID' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, default: '新对话', comment: '会话标题' })
  title: string;

  @Column({
    name: 'last_message_preview',
    type: 'varchar',
    length: 200,
    default: '',
    comment: '最后一条消息预览',
  })
  lastMessagePreview: string;

  @Column({ name: 'last_message_at', type: 'datetime', nullable: true, comment: '最后活跃时间' })
  lastMessageAt: Date | null;

  @Column({ name: 'target_name', type: 'varchar', length: 50, nullable: true, comment: '对方名称' })
  targetName: string | null;

  @Column({ name: 'target_gender', type: 'varchar', length: 20, nullable: true, comment: '对方性别' })
  targetGender: string | null;

  @Column({ name: 'target_intro', type: 'varchar', length: 500, nullable: true, comment: '对方简介' })
  targetIntro: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '双方关系' })
  relationship: string | null;

  @Column({
    name: 'chat_atmosphere',
    type: 'varchar',
    length: 300,
    nullable: true,
    comment: '聊天氛围',
  })
  chatAtmosphere: string | null;

  @Column({
    name: 'tone_template',
    type: 'varchar',
    length: 300,
    nullable: true,
    comment: '语气模板',
  })
  toneTemplate: string | null;

  @Column({
    name: 'goal_direction',
    type: 'varchar',
    length: 300,
    nullable: true,
    comment: '目标方向',
  })
  goalDirection: string | null;

  @Column({ name: 'is_archived', type: 'boolean', default: false, comment: '是否已归档' })
  isArchived: boolean;

  @Column({ name: 'archived_at', type: 'datetime', nullable: true, comment: '归档时间' })
  archivedAt: Date | null;

  @Column({ name: 'is_pinned', type: 'boolean', default: false, comment: '是否置顶' })
  isPinned: boolean;

  @Column({ name: 'pinned_at', type: 'datetime', nullable: true, comment: '置顶时间' })
  pinnedAt: Date | null;

  @OneToMany(() => AiMessage, (message) => message.conversation)
  messages: AiMessage[];

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
