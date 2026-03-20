import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';
import { NotificationType } from './entities/notification.entity';
import { NotificationService } from './notification.service';

interface NotificationTriggerPayload {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  targetId: string;
}

@Injectable()
export class NotificationTriggerService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: AppLoggerService,
  ) {}

  async notifyCommentReply(payload: NotificationTriggerPayload) {
    await this.sendNotification({
      ...payload,
      type: NotificationType.COMMENT_REPLY,
      targetType: 'comment',
      content: `${payload.actorUsername} 回复了你的评论`,
    });
  }

  async notifyCommentLiked(payload: NotificationTriggerPayload) {
    await this.sendNotification({
      ...payload,
      type: NotificationType.COMMENT_LIKED,
      targetType: 'comment',
      content: `${payload.actorUsername} 点赞了你的评论`,
    });
  }

  async notifyTopicLiked(payload: NotificationTriggerPayload) {
    await this.sendNotification({
      ...payload,
      type: NotificationType.TOPIC_LIKED,
      targetType: 'topic',
      content: `${payload.actorUsername} 点赞了你的话题`,
    });
  }

  private async sendNotification(
    payload: NotificationTriggerPayload & {
      type: NotificationType;
      targetType: 'comment' | 'topic';
      content: string;
    },
  ) {
    if (payload.recipientId === payload.actorId) {
      this.logger.debug('Notification trigger skipped for self action', NotificationTriggerService.name, {
        recipientId: payload.recipientId,
        actorId: payload.actorId,
        type: payload.type,
        targetId: payload.targetId,
      });
      return;
    }

    try {
      await this.notificationService.create({
        recipientId: payload.recipientId,
        actorId: payload.actorId,
        type: payload.type,
        targetId: payload.targetId,
        targetType: payload.targetType,
        content: payload.content,
      });
    } catch (error) {
      this.logger.error(
        'Notification trigger failed',
        NotificationTriggerService.name,
        error instanceof Error ? error.stack : undefined,
        {
          recipientId: payload.recipientId,
          actorId: payload.actorId,
          type: payload.type,
          targetId: payload.targetId,
          targetType: payload.targetType,
        },
      );
    }
  }
}
