import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment } from './entities/comment.entity';
import { CommentReaderService } from './comment-reader.service';
import { CommentStatsService } from './comment-stats.service';
import { Topic } from '@/modules/content/topic/entities/topic.entity';
import { ContentModerationService } from './services/content-moderation.service';
import { NotificationModule } from '@/modules/interaction/notification/notification.module';
import { UserModule } from '@/modules/identity/user/user.module';
import { TopicModule } from '@/modules/content/topic/topic.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Topic]), TopicModule, NotificationModule, UserModule],
  controllers: [CommentController],
  providers: [CommentService, CommentReaderService, CommentStatsService, ContentModerationService],
  exports: [CommentService, CommentReaderService, CommentStatsService, ContentModerationService],
})
export class CommentModule {}

