import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReaderService } from '@/modules/identity/user/user-reader.service';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { SystemNotificationRead } from './entities/system-notification-read.entity';
import { SystemNotification } from './entities/system-notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(SystemNotification)
    private systemNotificationRepository: Repository<SystemNotification>,
    @InjectRepository(SystemNotificationRead)
    private systemNotificationReadRepository: Repository<SystemNotificationRead>,
    private userReaderService: UserReaderService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const { recipientId, actorId, type, targetId, targetType, content } = createNotificationDto;
    const startedAt = Date.now();

    if (recipientId === actorId) {
      this.logger.debug('Notification skipped for self action', NotificationService.name, {
        recipientId,
        actorId,
        type,
        targetId,
        targetType,
      });
      return null;
    }

    const [recipient, actor] = await Promise.all([
      this.userReaderService.findUserEntityById(recipientId),
      this.userReaderService.findUserEntityById(actorId),
    ]);

    if (!recipient || !actor) {
      this.logger.warn('Notification creation rejected because user was not found', NotificationService.name, {
        recipientId,
        actorId,
        type,
        targetId,
        targetType,
      });
      throw new NotFoundException('用户不存在');
    }

    const notification = this.notificationRepository.create({
      recipient,
      actor,
      type: type as NotificationType,
      targetId,
      targetType,
      content,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    this.logger.log('Notification created', NotificationService.name, {
      notificationId: savedNotification.id,
      recipientId,
      actorId,
      type,
      targetId,
      targetType,
      durationMs: Date.now() - startedAt,
    });

    return savedNotification;
  }

  async findByRecipient(recipientId: string, page: number = 1, limit: number = 20, isRead?: boolean) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :recipientId', { recipientId })
      .leftJoinAndSelect('notification.actor', 'actor')
      .orderBy('notification.createdAt', 'DESC');

    if (isRead !== undefined) {
      query.andWhere('notification.isRead = :isRead', { isRead });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(recipientId: string) {
    return this.notificationRepository.count({
      where: {
        recipient: { id: recipientId },
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: string) {
    return this.notificationRepository.update(
      { id: notificationId },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  async markAllAsRead(recipientId: string) {
    return this.notificationRepository.update(
      {
        recipient: { id: recipientId },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  async remove(notificationId: string) {
    return this.notificationRepository.delete({ id: notificationId });
  }

  async findOneByUser(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['actor', 'recipient'],
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.recipient.id !== userId) {
      throw new ForbiddenException('无权访问此通知');
    }

    return notification;
  }

  async createSystemNotification(
    type: NotificationType,
    title: string,
    content: string,
    createdBy: string,
  ) {
    const startedAt = Date.now();
    const systemNotification = this.systemNotificationRepository.create({
      type,
      title,
      content,
      createdBy,
      isActive: true,
    });

    const savedNotification = await this.systemNotificationRepository.save(systemNotification);

    this.logger.log('System notification created', NotificationService.name, {
      notificationId: savedNotification.id,
      type,
      createdBy,
      durationMs: Date.now() - startedAt,
    });

    return savedNotification;
  }

  async getSystemNotifications(page: number = 1, limit: number = 20) {
    const [data, total] = await this.systemNotificationRepository
      .createQueryBuilder('notification')
      .where('notification.isActive = :isActive', { isActive: true })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserSystemNotifications(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total] = await this.systemNotificationRepository
      .createQueryBuilder('notification')
      .where('notification.isActive = :isActive', { isActive: true })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const readRecords = await this.systemNotificationReadRepository.find({
      where: { user: { id: userId } },
      select: ['notification'],
    });

    const readNotificationIds = new Set(readRecords.map((r) => r.notification.id));
    const data = notifications.map((notification) => ({
      ...notification,
      isRead: readNotificationIds.has(notification.id),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markSystemNotificationAsRead(userId: string, notificationId: string) {
    const user = await this.userReaderService.findUserEntityById(userId);
    const notification = await this.systemNotificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    const existing = await this.systemNotificationReadRepository.findOne({
      where: { user: { id: userId }, notification: { id: notificationId } },
    });

    if (existing) {
      return existing;
    }

    const record = this.systemNotificationReadRepository.create({
      user,
      notification,
    });

    return this.systemNotificationReadRepository.save(record);
  }

  async markAllSystemNotificationsAsRead(userId: string) {
    const user = await this.userReaderService.findUserEntityById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const notifications = await this.systemNotificationRepository.find({
      where: { isActive: true },
    });

    const readRecords = await this.systemNotificationReadRepository.find({
      where: { user: { id: userId } },
    });

    const readNotificationIds = new Set(readRecords.map((r) => r.notification.id));
    const toCreate = notifications
      .filter((n) => !readNotificationIds.has(n.id))
      .map((n) =>
        this.systemNotificationReadRepository.create({
          user,
          notification: n,
        }),
      );

    if (toCreate.length > 0) {
      return this.systemNotificationReadRepository.save(toCreate);
    }

    return [];
  }

  async getSystemNotificationUnreadCount(userId: string) {
    const activeNotifications = await this.systemNotificationRepository.count({
      where: { isActive: true },
    });

    const readCount = await this.systemNotificationReadRepository.count({
      where: { user: { id: userId } },
    });

    return Math.max(0, activeNotifications - readCount);
  }

  async deactivateSystemNotification(notificationId: string) {
    return this.systemNotificationRepository.update(
      { id: notificationId },
      { isActive: false },
    );
  }

  async deleteSystemNotification(notificationId: string) {
    return this.systemNotificationRepository.delete({ id: notificationId });
  }
}
