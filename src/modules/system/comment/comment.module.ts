import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { Comment } from './entities/comment.entity';
import { Topic } from '../topic/entities/topic.entity';
import { User } from '../user/entities/user.entity';
import { ContentModerationService } from './services/content-moderation.service';
import { ReportModule } from '../report/report.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Topic, User]), ReportModule, NotificationModule],
  controllers: [CommentController],
  providers: [CommentService, ContentModerationService],
  exports: [CommentService, ContentModerationService],
})
export class CommentModule {}
