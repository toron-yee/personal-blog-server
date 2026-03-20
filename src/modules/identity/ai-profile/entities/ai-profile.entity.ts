import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/modules/identity/user/entities/user.entity';

@Entity('user_ai_profile')
@Index('idx_user_ai_profile_user_id', ['userId'], { unique: true })
export class AiProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', comment: '关联用户 ID' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50, comment: 'AI 分身名称' })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '性别' })
  gender: string | null;

  @Column({ type: 'int', nullable: true, comment: '年龄' })
  age: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '性格' })
  personality: string | null;

  @Column({ name: 'speaking_style', type: 'varchar', length: 200, nullable: true, comment: '说话习惯' })
  speakingStyle: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '爱好' })
  hobbies: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '职业' })
  occupation: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '备注' })
  remarks: string | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
