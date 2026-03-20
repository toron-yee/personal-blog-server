import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiMessageRole } from '@/common/enums/ai.enum';
import { User } from '@/modules/identity/user/entities/user.entity';
import { AiConversation } from '@/modules/interaction/ai-conversation/entities/ai-conversation.entity';

@Entity('ai_message')
@Index('idx_ai_message_user_id', ['userId'])
@Index('idx_ai_message_conversation_id', ['conversationId'])
@Index('idx_ai_message_conversation_created', ['conversationId', 'createdAt'])
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', comment: '所属用户 ID' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'conversation_id', type: 'uuid', comment: '所属会话 ID' })
  conversationId: string;

  @ManyToOne(() => AiConversation, (conversation) => conversation.messages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;

  @Column({ type: 'enum', enum: AiMessageRole, comment: '消息角色' })
  role: AiMessageRole;

  @Column({ type: 'text', comment: '消息内容' })
  content: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
