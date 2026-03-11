import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { SystemNotification } from './entities/system-notification.entity';
import { SystemNotificationRead } from './entities/system-notification-read.entity';
import { User } from '@/modules/system/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, SystemNotification, SystemNotificationRead, User])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
