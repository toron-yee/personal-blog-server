import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  FindViolationsDto,
  RejectCommentDto,
  HideCommentDto,
} from './dto/moderation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReportService } from '@/modules/system/report/report.service';
import { ReportType } from '@/common/enums/report.enum';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('评论管理')
@Controller('comment')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly reportService: ReportService,
  ) {}

  /**
   * 创建评论
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建评论' })
  @ApiResponse({ status: 201, description: '评论创建成功' })
  @ApiResponse({ status: 400, description: '内容违规或参数错误' })
  create(@Body() createCommentDto: CreateCommentDto, @CurrentUser() user: any) {
    return this.commentService.create(createCommentDto, user.id);
  }

  /**
   * 获取话题的评论列表
   */
  @Public()
  @Get('topic/:topicId')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('comment-topic', 120)
  @ApiOperation({ summary: '获取话题的评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回评论列表' })
  findByTopic(
    @Param('topicId') topicId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentService.findByTopic(
      topicId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取评论的回复列表
   */
  @Public()
  @Get(':commentId/replies')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('comment-replies', 120)
  @ApiOperation({ summary: '获取评论的回复列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回回复列表' })
  findReplies(
    @Param('commentId') commentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentService.findReplies(
      commentId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取用户的评论列表
   */
  @Public()
  @Get('user/:userId')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('comment-user', 120)
  @ApiOperation({ summary: '获取用户的评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回用户评论列表' })
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentService.findByUser(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取评论详情
   */
  @Public()
  @Get(':id')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('comment-detail', 300)
  @ApiOperation({ summary: '获取评论详情' })
  @ApiResponse({ status: 200, description: '返回评论详情' })
  @ApiResponse({ status: 404, description: '评论不存在' })
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  /**
   * 更新评论
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新评论' })
  @ApiResponse({ status: 200, description: '评论更新成功' })
  @ApiResponse({ status: 400, description: '内容违规' })
  @ApiResponse({ status: 403, description: '无权限' })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentService.update(id, updateCommentDto, user.id);
  }

  /**
   * 删除评论
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论' })
  @ApiResponse({ status: 200, description: '评论已删除' })
  @ApiResponse({ status: 403, description: '无权限' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentService.remove(id, user.id);
  }

  /**
   * 查询违规评论（管理员）
   */
  @Get('admin/violations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询违规评论', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '返回违规评论列表' })
  async findViolations(@Query() filters: FindViolationsDto) {
    const dateRange =
      filters.startDate && filters.endDate
        ? [new Date(filters.startDate), new Date(filters.endDate)]
        : undefined;

    return this.commentService.findViolations({
      status: filters.status,
      violationType: filters.violationType,
      topicId: filters.topicId,
      creatorId: filters.creatorId,
      dateRange,
      page: filters.page,
      limit: filters.limit,
    });
  }

  /**
   * 获取待审核评论数量（管理员）
   */
  @Get('admin/pending-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取待审核评论数量', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '返回待审核数量' })
  async getPendingReviewCount() {
    const count = await this.commentService.getPendingReviewCount();
    return { count };
  }

  /**
   * 获取用户的违规统计（管理员）
   */
  @Get('admin/user/:userId/violations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户的违规统计', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '返回违规统计' })
  async getUserViolationStats(@Param('userId') userId: string) {
    return this.commentService.getUserViolationStats(userId);
  }

  /**
   * 拒绝评论（管理员）
   */
  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '拒绝评论', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '评论已拒绝' })
  async rejectComment(
    @Param('id') commentId: string,
    @Body() dto: RejectCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentService.rejectComment(
      commentId,
      dto.violationType,
      dto.reason,
      user.id,
    );
  }

  /**
   * 隐藏评论（管理员）
   */
  @Post('admin/:id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '隐藏评论', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '评论已隐藏' })
  async hideComment(
    @Param('id') commentId: string,
    @Body() dto: HideCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentService.hideComment(commentId, dto.reason, user.id);
  }

  /**
   * 恢复评论（管理员）
   */
  @Post('admin/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '恢复评论', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '评论已恢复' })
  async restoreComment(
    @Param('id') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.commentService.restoreComment(commentId, user.id);
  }

  /**
   * 获取评论的举报列表（管理员）
   */
  @Get('admin/:id/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取评论的举报列表', description: '仅管理员可操作' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回举报列表' })
  getCommentReports(
    @Param('id', ParseUUIDPipe) commentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.reportService.findByTarget(
      commentId,
      ReportType.COMMENT,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
