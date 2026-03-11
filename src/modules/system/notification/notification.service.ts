import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { SystemNotification } from './entities/system-notification.entity';
import { SystemNotificationRead } from './entities/system-notification-read.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '@/modules/system/user/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(SystemNotification)
    private systemNotificationRepository: Repository<SystemNotification>,
    @InjectRepository(SystemNotificationRead)
    private systemNotificationReadRepository: Repository<SystemNotificationRead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 创建通知
   */
  async create(createNotificationDto: CreateNotificationDto) {
    const { recipientId, actorId, type, targetId, targetType, content } = createNotificationDto;

    // 获取接收者和操作者
    const [recipient, actor] = await Promise.all([
      this.userRepository.findOne({ where: { id: recipientId } }),
      this.userRepository.findOne({ where: { id: actorId } }),
    ]);

    if (!recipient || !actor) {
      throw new NotFoundException('用户不存在');
    }

    // 不给自己发送通知
    if (recipientId === actorId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipient,
      actor,
      type: type as NotificationType,
      targetId,
      targetType,
      content,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * 获取用户通知列表（分页）
   */
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

  /**
   * 获取未读通知数
   */
  async getUnreadCount(recipientId: string) {
    return this.notificationRepository.count({
      where: {
        recipient: { id: recipientId },
        isRead: false,
      },
    });
  }

  /**
   * 标记单条通知为已读
   */
  async markAsRead(notificationId: string) {
    return this.notificationRepository.update(
      { id: notificationId },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  /**
   * 标记所有通知为已读
   */
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

  /**
   * 删除通知
   */
  async remove(notificationId: string) {
    return this.notificationRepository.delete({ id: notificationId });
  }

  /**
   * 获取单条通知（验证权限）
   */
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

  /**
   * 创建系统通知（发送给所有用户）
   */
  async createSystemNotification(
    type: NotificationType,
    title: string,
    content: string,
    createdBy: string,
  ) {
    const systemNotification = this.systemNotificationRepository.create({
      type,
      title,
      content,
      createdBy,
      isActive: true,
    });

    return this.systemNotificationRepository.save(systemNotification);
  }

  /**
   * 获取系统通知列表
   */
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

  /**
   * 获取用户的系统通知（包含已读状态）
   */
  async getUserSystemNotifications(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total] = await this.systemNotificationRepository
      .createQueryBuilder('notification')
      .where('notification.isActive = :isActive', { isActive: true })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // 获取用户已读的系统通知ID
    const readRecords = await this.systemNotificationReadRepository.find({
      where: { user: { id: userId } },
      select: ['notification'],
    });

    const readNotificationIds = new Set(readRecords.map((r) => r.notification.id));

    // 为每个通知添加已读状态
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

  /**
   * 标记系统通知为已读
   */
  async markSystemNotificationAsRead(userId: string, notificationId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const notification = await this.systemNotificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    // 检查是否已读
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

  /**
   * 标记所有系统通知为已读
   */
  async markAllSystemNotificationsAsRead(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 获取所有激活的系统通知
    const notifications = await this.systemNotificationRepository.find({
      where: { isActive: true },
    });

    // 获取用户已读的通知
    const readRecords = await this.systemNotificationReadRepository.find({
      where: { user: { id: userId } },
    });

    const readNotificationIds = new Set(readRecords.map((r) => r.notification.id));

    // 创建未读通知的已读记录
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

  /**
   * 获取系统通知未读数
   */
  async getSystemNotificationUnreadCount(userId: string) {
    const activeNotifications = await this.systemNotificationRepository.count({
      where: { isActive: true },
    });

    const readCount = await this.systemNotificationReadRepository.count({
      where: { user: { id: userId } },
    });

    return Math.max(0, activeNotifications - readCount);
  }

  /**
   * 停用系统通知
   */
  async deactivateSystemNotification(notificationId: string) {
    return this.systemNotificationRepository.update(
      { id: notificationId },
      { isActive: false },
    );
  }

  /**
   * 删除系统通知
   */
  async deleteSystemNotification(notificationId: string) {
    return this.systemNotificationRepository.delete({ id: notificationId });
  }
}