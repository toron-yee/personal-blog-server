import { Module } from '@nestjs/common';
import { AiProfileModule } from '@/modules/identity/ai-profile/ai-profile.module';
import { LoggingModule } from '@/modules/infra/logging/logging.module';
import { AiConversationModule } from '@/modules/interaction/ai-conversation/ai-conversation.module';
import { AiMessageModule } from '@/modules/interaction/ai-message/ai-message.module';
import { AiModule } from '@/modules/infra/ai/ai.module';
import { AiReplyController } from './ai-reply.controller';
import { AiReplyService } from './ai-reply.service';

@Module({
  imports: [AiProfileModule, AiConversationModule, AiMessageModule, AiModule, LoggingModule],
  controllers: [AiReplyController],
  providers: [AiReplyService],
  exports: [AiReplyService],
})
export class AiReplyModule {}
