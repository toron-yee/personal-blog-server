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
import { CommentLikeService } from './comment-like.service';
import { CreateCommentLikeDto } from './dto/create-comment-like.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('评论点赞')
@Controller('comment-like')
export class CommentLikeController {
  constructor(private readonly commentLikeService: CommentLikeService) {}

  /**
   * 点赞评论
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞评论' })
  @ApiResponse({ status: 201, description: '点赞成功' })
  like(
    @Body() createCommentLikeDto: CreateCommentLikeDto,
    @CurrentUser() user: any,
  ) {
    return this.commentLikeService.like(createCommentLikeDto, user.id);
  }

  /**
   * 取消点赞
   */
  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消点赞' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  unlike(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.commentLikeService.unlike(commentId, user.id);
  }

  /**
   * 检查是否点赞
   */
  @Get(':commentId/is-liked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '检查是否点赞' })
  @ApiResponse({ status: 200, description: '返回点赞状态' })
  isLiked(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.commentLikeService.isLiked(commentId, user.id);
  }

  /**
   * 获取评论的点赞用户列表
   */
  @Public()
  @Get(':commentId/users')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('comment-like-users', 120)
  @ApiOperation({ summary: '获取评论的点赞用户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回点赞用户列表' })
  getLikeUsers(
    @Param('commentId') commentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentLikeService.getLikeUsers(
      commentId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取用户点赞的评论列表
   */
  @Get('user/liked-comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户点赞的评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回用户点赞的评论列表' })
  getUserLikedComments(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentLikeService.getUserLikedComments(
      user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取评论的点赞数量
   */
  @Public()
  @Get(':commentId/count')
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('comment-like-count', 300)
  @ApiOperation({ summary: '获取评论的点赞数量' })
  @ApiResponse({ status: 200, description: '返回点赞数量' })
  getLikeCount(@Param('commentId') commentId: string) {
    return this.commentLikeService.getLikeCount(commentId);
  }
}
