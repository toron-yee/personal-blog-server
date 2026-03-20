import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversationModule } from '@/modules/interaction/ai-conversation/ai-conversation.module';
import { AiMessageController } from './ai-message.controller';
import { AiMessageService } from './ai-message.service';
import { AiMessage } from './entities/ai-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiMessage]), AiConversationModule],
  controllers: [AiMessageController],
  providers: [AiMessageService],
  exports: [AiMessageService],
})
export class AiMessageModule {}
