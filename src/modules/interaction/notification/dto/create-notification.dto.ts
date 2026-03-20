import { IsString, IsUUID, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  recipientId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsUUID()
  actorId: string;

  @IsUUID()
  targetId: string;

  @IsString()
  targetType: string;

  @IsString()
  content: string;
}
