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
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('话题管理')
@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  /**
   * 创建话题
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建话题' })
  @ApiResponse({ status: 201, description: '话题创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  create(@Body() createTopicDto: CreateTopicDto, @CurrentUser() user: any) {
    return this.topicService.create(createTopicDto, user.id);
  }

  /**
   * 获取所有话题（分页）
   */
  @Public()
  @Get()
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-list', 120)
  @ApiOperation({ summary: '获取所有话题' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回话题列表' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicService.findAll(parseInt(page, 10), parseInt(limit, 10));
  }

  /**
   * 获取热门话题
   */
  @Public()
  @Get('hot/list')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-hot', 300)
  @ApiOperation({ summary: '获取热门话题' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量，默认10' })
  @ApiResponse({ status: 200, description: '返回热门话题列表' })
  getHotTopics(@Query('limit') limit: string = '10') {
    return this.topicService.getHotTopics(parseInt(limit, 10));
  }

  /**
   * 获取推荐话题
   */
  @Public()
  @Get('recommended/list')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-recommended', 300)
  @ApiOperation({ summary: '获取推荐话题' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量，默认10' })
  @ApiResponse({ status: 200, description: '返回推荐话题列表' })
  getRecommendedTopics(@Query('limit') limit: string = '10') {
    return this.topicService.getRecommendedTopics(parseInt(limit, 10));
  }

  /**
   * 搜索话题
   */
  @Public()
  @Get('search/keyword')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-search', 120)
  @ApiOperation({ summary: '搜索话题' })
  @ApiQuery({ name: 'keyword', required: true, type: String, description: '搜索关键词' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回搜索结果' })
  search(
    @Query('keyword') keyword: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicService.search(
      keyword,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取用户的话题列表
   */
  @Public()
  @Get('user/:userId')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-user', 120)
  @ApiOperation({ summary: '获取用户的话题列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回用户话题列表' })
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicService.findByUser(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 按分类获取话题
   */
  @Public()
  @Get('category/:categoryId')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-category', 120)
  @ApiOperation({ summary: '按分类获取话题' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回分类话题列表' })
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicService.findByCategory(
      categoryId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 按标签获取话题
   */
  @Public()
  @Get('tag/:tagId')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-tag', 120)
  @ApiOperation({ summary: '按标签获取话题' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回标签话题列表' })
  findByTag(
    @Param('tagId') tagId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicService.findByTag(
      tagId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取用户的草稿列表
   */
  @Get('drafts/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的草稿列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回草稿列表' })
  getUserDrafts(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicService.getUserDrafts(
      user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 发布草稿
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布草稿' })
  @ApiResponse({ status: 200, description: '草稿已发布' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '话题不存在' })
  publishDraft(@Param('id') id: string, @CurrentUser() user: any) {
    return this.topicService.publishDraft(id, user.id);
  }

  /**
   * 保存为草稿
   */
  @Patch(':id/draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '保存为草稿' })
  @ApiResponse({ status: 200, description: '已保存为草稿' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '话题不存在' })
  saveDraft(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @CurrentUser() user: any,
  ) {
    return this.topicService.saveDraft(id, updateTopicDto, user.id);
  }

  /**
   * 获取话题详情并记录浏览
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取话题详情' })
  @ApiResponse({ status: 200, description: '返回话题详情' })
  @ApiResponse({ status: 404, description: '话题不存在' })
  getDetail(@Param('id') id: string, @Req() req: Request) {
    const viewData = {
      userId: (req as any).user?.id,
      ip: this.getClientIp(req),
      userAgent: req.get('user-agent') || '',
    };
    return this.topicService.getDetailAndRecordView(id, viewData);
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].trim();
    }

    return req.ip || req.socket.remoteAddress || '';
  }

  /**
   * 更新话题
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新话题' })
  @ApiResponse({ status: 200, description: '话题更新成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '话题不存在' })
  update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @CurrentUser() user: any,
  ) {
    return this.topicService.update(id, updateTopicDto, user.id);
  }

  /**
   * 删除话题
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除话题' })
  @ApiResponse({ status: 200, description: '话题已删除' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '话题不存在' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.topicService.remove(id, user.id);
  }

  /**
   * 置顶话题（管理员）
   */
  @Post(':id/sticky')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '置顶话题', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '话题已置顶' })
  sticky(@Param('id') id: string) {
    return this.topicService.sticky(id);
  }

  /**
   * 取消置顶（管理员）
   */
  @Post(':id/unsticky')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消置顶', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '话题已取消置顶' })
  unsticky(@Param('id') id: string) {
    return this.topicService.unsticky(id);
  }

  /**
   * 推荐话题（管理员）
   */
  @Post(':id/recommend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '推荐话题', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '话题已推荐' })
  recommend(@Param('id') id: string) {
    return this.topicService.recommend(id);
  }

  /**
   * 取消推荐（管理员）
   */
  @Post(':id/unrecommend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消推荐', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '话题已取消推荐' })
  unrecommend(@Param('id') id: string) {
    return this.topicService.unrecommend(id);
  }
}
