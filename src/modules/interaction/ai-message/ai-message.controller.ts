import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AiMessageService } from './ai-message.service';
import { QueryAiMessageDto } from './dto/query-ai-message.dto';

@ApiTags('AI 对话消息')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-message')
export class AiMessageController {
  constructor(private readonly aiMessageService: AiMessageService) {}

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: '获取某个会话的消息历史' })
  findByConversation(
    @CurrentUser('id') userId: string,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: QueryAiMessageDto,
  ) {
    return this.aiMessageService.findByConversation(userId, conversationId, query);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除某条 AI 对话消息' })
  remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.aiMessageService.remove(userId, id);
  }
}
