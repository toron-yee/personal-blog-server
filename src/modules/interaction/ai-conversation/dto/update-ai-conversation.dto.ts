import { PartialType } from '@nestjs/swagger';
import { CreateAiConversationDto } from './create-ai-conversation.dto';

export class UpdateAiConversationDto extends PartialType(CreateAiConversationDto) {}
