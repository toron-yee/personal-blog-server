import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AiConversationService } from './ai-conversation.service';
import { CreateAiConversationDto } from './dto/create-ai-conversation.dto';
import { UpdateAiConversationDto } from './dto/update-ai-conversation.dto';
import { QueryAiConversationDto } from './dto/query-ai-conversation.dto';

@ApiTags('AI 对话会话')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-conversation')
export class AiConversationController {
  constructor(private readonly aiConversationService: AiConversationService) {}

  @Post()
  @ApiOperation({ summary: '创建 AI 会话' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAiConversationDto) {
    return this.aiConversationService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取我的 AI 会话列表' })
  findMine(@CurrentUser('id') userId: string, @Query() query: QueryAiConversationDto) {
    return this.aiConversationService.findMine(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取 AI 会话详情' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiConversationService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新 AI 会话标题' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAiConversationDto,
  ) {
    return this.aiConversationService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '归档 AI 会话' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiConversationService.archive(userId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: '恢复已归档的 AI 会话' })
  restore(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiConversationService.restore(userId, id);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: '置顶 AI 会话' })
  pin(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiConversationService.pin(userId, id);
  }

  @Post(':id/unpin')
  @ApiOperation({ summary: '取消置顶 AI 会话' })
  unpin(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.aiConversationService.unpin(userId, id);
  }
}
