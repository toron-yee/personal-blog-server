import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentModule } from '@/modules/content/comment/comment.module';
import { NotificationModule } from '@/modules/interaction/notification/notification.module';
import { UserModule } from '@/modules/identity/user/user.module';
import { CommentLikeService } from './comment-like.service';
import { CommentLikeController } from './comment-like.controller';
import { CommentLike } from './entities/comment-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentLike]), CommentModule, NotificationModule, UserModule],
  controllers: [CommentLikeController],
  providers: [CommentLikeService],
  exports: [CommentLikeService],
})
export class CommentLikeModule {}
