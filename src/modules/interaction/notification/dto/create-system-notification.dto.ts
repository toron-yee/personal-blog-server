import { IsString, IsEnum, Length } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateSystemNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 5000)
  content: string;
}
