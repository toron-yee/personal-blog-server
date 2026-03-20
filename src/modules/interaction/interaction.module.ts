import { Module } from '@nestjs/common';
import { AiConversationModule } from '@/modules/interaction/ai-conversation/ai-conversation.module';
import { AiMessageModule } from '@/modules/interaction/ai-message/ai-message.module';
import { AiReplyModule } from '@/modules/interaction/ai-reply/ai-reply.module';
import { CommentLikeModule } from '@/modules/interaction/comment-like/comment-like.module';
import { NotificationModule } from '@/modules/interaction/notification/notification.module';
import { ReportModule } from '@/modules/interaction/report/report.module';
import { TopicLikeModule } from '@/modules/interaction/topic-like/topic-like.module';

@Module({
  imports: [
    NotificationModule,
    ReportModule,
    TopicLikeModule,
    CommentLikeModule,
    AiConversationModule,
    AiMessageModule,
    AiReplyModule,
  ],
  exports: [
    NotificationModule,
    ReportModule,
    TopicLikeModule,
    CommentLikeModule,
    AiConversationModule,
    AiMessageModule,
    AiReplyModule,
  ],
})
export class InteractionModule {}
