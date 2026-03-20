import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@/modules/identity/user/user.module';
import { LoggingModule } from '@/modules/infra/logging/logging.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { SystemNotificationRead } from './entities/system-notification-read.entity';
import { SystemNotification } from './entities/system-notification.entity';
import { Notification } from './entities/notification.entity';
import { NotificationTriggerService } from './notification-trigger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, SystemNotification, SystemNotificationRead]),
    UserModule,
    LoggingModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationTriggerService],
  exports: [NotificationService, NotificationTriggerService],
})
export class NotificationModule {}
