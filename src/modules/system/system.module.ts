import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TagModule } from './tag/tag.module';
import { TopicModule } from './topic/topic.module';
import { CategoryModule } from './category/category.module';
import { CommentModule } from './comment/comment.module';
import { TopicLikeModule } from './topic-like/topic-like.module';
import { CommentLikeModule } from './comment-like/comment-like.module';
import { ReportModule } from './report/report.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [AuthModule, UserModule, TagModule, TopicModule, CategoryModule, CommentModule, TopicLikeModule, CommentLikeModule, ReportModule, NotificationModule]
})
export class SystemModule {}
