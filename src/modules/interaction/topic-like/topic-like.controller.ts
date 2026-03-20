import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TopicLikeService } from './topic-like.service';
import { CreateTopicLikeDto } from './dto/create-topic-like.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('话题点赞')
@Controller('topic-like')
export class TopicLikeController {
  constructor(private readonly topicLikeService: TopicLikeService) {}

  /**
   * 点赞话题
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞话题' })
  @ApiResponse({ status: 201, description: '点赞成功' })
  like(
    @Body() createTopicLikeDto: CreateTopicLikeDto,
    @CurrentUser() user: any,
  ) {
    return this.topicLikeService.like(createTopicLikeDto, user.id);
  }

  /**
   * 取消点赞
   */
  @Delete(':topicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消点赞' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  unlike(@Param('topicId') topicId: string, @CurrentUser() user: any) {
    return this.topicLikeService.unlike(topicId, user.id);
  }

  /**
   * 检查是否点赞
   */
  @Get(':topicId/is-liked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查是否点赞' })
  @ApiResponse({ status: 200, description: '返回点赞状态' })
  isLiked(@Param('topicId') topicId: string, @CurrentUser() user: any) {
    return this.topicLikeService.isLiked(topicId, user.id);
  }

  /**
   * 获取话题的点赞用户列表
   */
  @Public()
  @Get(':topicId/users')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-like-users', 120)
  @ApiOperation({ summary: '获取话题的点赞用户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回点赞用户列表' })
  getLikeUsers(
    @Param('topicId') topicId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicLikeService.getLikeUsers(
      topicId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取用户点赞的话题列表
   */
  @Get('user/liked-topics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户点赞的话题列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回用户点赞的话题列表' })
  getUserLikedTopics(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.topicLikeService.getUserLikedTopics(
      user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取话题的点赞数量
   */
  @Public()
  @Get(':topicId/count')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('topic-like-count', 300)
  @ApiOperation({ summary: '获取话题的点赞数量' })
  @ApiResponse({ status: 200, description: '返回点赞数量' })
  getLikeCount(@Param('topicId') topicId: string) {
    return this.topicLikeService.getLikeCount(topicId);
  }
}
