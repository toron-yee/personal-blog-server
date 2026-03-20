import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AiReplyService } from './ai-reply.service';
import { CreateAiReplyDto } from './dto/create-ai-reply.dto';

@ApiTags('AI 回复生成')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-reply')
export class AiReplyController {
  constructor(private readonly aiReplyService: AiReplyService) {}

  @Post('generate')
  @ApiOperation({ summary: '基于历史对话生成 AI 回复' })
  generateReply(@CurrentUser('id') userId: string, @Body() dto: CreateAiReplyDto) {
    return this.aiReplyService.generateReply(userId, dto);
  }
}
