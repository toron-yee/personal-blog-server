import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@/modules/identity/user/user.module';
import { AiConversationController } from './ai-conversation.controller';
import { AiConversationService } from './ai-conversation.service';
import { AiConversation } from './entities/ai-conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiConversation]), UserModule],
  controllers: [AiConversationController],
  providers: [AiConversationService],
  exports: [AiConversationService],
})
export class AiConversationModule {}
