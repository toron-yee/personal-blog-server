import { Controller, Get, Patch, Param, Delete, Query, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { NotificationType } from './entities/notification.entity';
import { Response } from '@/common/utils/response';
import { CreateSystemNotificationDto } from './dto/create-system-notification.dto';

@ApiTags('通知管理')
@ApiBearerAuth()
@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 获取当前用户的通知列表
   */
  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, description: '筛选已读/未读' })
  @ApiResponse({ status: 200, description: '返回通知列表' })
  async findByRecipient(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('isRead') isRead?: string,
  ) {
    const isReadBool = isRead ? isRead === 'true' : undefined;
    const data = await this.notificationService.findByRecipient(user.id, page, limit, isReadBool);
    return new Response('获取通知列表成功', data);
  }

  /**
   * 获取未读通知数
   */
  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数' })
  @ApiResponse({ status: 200, description: '返回未读数' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return new Response('获取未读数成功', { unreadCount: count });
  }

  /**
   * 获取单条通知详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({ status: 200, description: '返回通知详情' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  @ApiResponse({ status: 403, description: '无权访问此通知' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const notification = await this.notificationService.findOneByUser(id, user.id);
    return new Response('获取通知详情成功', notification);
  }

  /**
   * 标记单条通知为已读
   */
  @Patch(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '已标记为已读' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    await this.notificationService.findOneByUser(id, user.id);
    await this.notificationService.markAsRead(id);
    return new Response('已标记为已读');
  }

  /**
   * 标记所有通知为已读
   */
  @Patch('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({ status: 200, description: '已标记所有通知为已读' })
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationService.markAllAsRead(user.id);
    return new Response('已标记所有通知为已读');
  }

  /**
   * 删除通知
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '通知已删除' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.notificationService.findOneByUser(id, user.id);
    await this.notificationService.remove(id);
    return new Response('通知已删除');
  }

  // ==================== 系统通知接口 ====================

  /**
   * 创建系统通知（管理员）
   */
  @Post('system/create')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '创建系统通知（管理员）' })
  @ApiResponse({ status: 201, description: '系统通知已创建' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async createSystemNotification(
    @Body() createSystemNotificationDto: CreateSystemNotificationDto,
    @CurrentUser() user: any,
  ) {
    const { type, title, content } = createSystemNotificationDto;
    const notification = await this.notificationService.createSystemNotification(
      type,
      title,
      content,
      user.id,
    );
    return new Response('系统通知已创建', notification);
  }

  /**
   * 获取系统通知列表（管理员）
   */
  @Get('system/admin/list')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '获取系统通知列表（管理员）' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回系统通知列表' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getSystemNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const data = await this.notificationService.getSystemNotifications(page, limit);
    return new Response('获取系统通知列表成功', data);
  }

  /**
   * 获取用户的系统通知（包含已读状态）
   */
  @Get('system/list')
  @ApiOperation({ summary: '获取系统通知' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回系统通知' })
  async getUserSystemNotifications(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const data = await this.notificationService.getUserSystemNotifications(user.id, page, limit);
    return new Response('获取系统通知成功', data);
  }

  /**
   * 获取系统通知未读数
   */
  @Get('system/unread-count')
  @ApiOperation({ summary: '获取系统通知未读数' })
  @ApiResponse({ status: 200, description: '返回未读数' })
  async getSystemNotificationUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationService.getSystemNotificationUnreadCount(user.id);
    return new Response('获取系统通知未读数成功', { unreadCount: count });
  }

  /**
   * 标记系统通知为已读
   */
  @Patch('system/:id/read')
  @ApiOperation({ summary: '标记系统通知为已读' })
  @ApiResponse({ status: 200, description: '已标记为已读' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markSystemNotificationAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.notificationService.markSystemNotificationAsRead(user.id, id);
    return new Response('已标记为已读');
  }

  /**
   * 标记所有系统通知为已读
   */
  @Patch('system/read-all')
  @ApiOperation({ summary: '标记所有系统通知为已读' })
  @ApiResponse({ status: 200, description: '已标记所有系统通知为已读' })
  async markAllSystemNotificationsAsRead(@CurrentUser() user: any) {
    await this.notificationService.markAllSystemNotificationsAsRead(user.id);
    return new Response('已标记所有系统通知为已读');
  }

  /**
   * 停用系统通知（管理员）
   */
  @Patch('system/:id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '停用系统通知（管理员）' })
  @ApiResponse({ status: 200, description: '系统通知已停用' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async deactivateSystemNotification(@Param('id') id: string) {
    await this.notificationService.deactivateSystemNotification(id);
    return new Response('系统通知已停用');
  }

  /**
   * 删除系统通知（管理员）
   */
  @Delete('system/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '删除系统通知（管理员）' })
  @ApiResponse({ status: 200, description: '系统通知已删除' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async deleteSystemNotification(@Param('id') id: string) {
    await this.notificationService.deleteSystemNotification(id);
    return new Response('系统通知已删除');
  }
}