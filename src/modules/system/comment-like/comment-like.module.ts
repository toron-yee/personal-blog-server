import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentLikeService } from './comment-like.service';
import { CommentLikeController } from './comment-like.controller';
import { CommentLike } from './entities/comment-like.entity';
import { Comment } from '../comment/entities/comment.entity';
import { User } from '../user/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommentLike, Comment, User]), NotificationModule],
  controllers: [CommentLikeController],
  providers: [CommentLikeService],
  exports: [CommentLikeService],
})
export class CommentLikeModule {}
