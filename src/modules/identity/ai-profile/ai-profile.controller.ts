import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiProfileService } from './ai-profile.service';
import { CreateAiProfileDto } from './dto/create-ai-profile.dto';
import { UpdateAiProfileDto } from './dto/update-ai-profile.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('AI 分身资料')
@ApiBearerAuth()
@Controller('ai-profile')
export class AiProfileController {
  constructor(private readonly aiProfileService: AiProfileService) {}

  @Post('me')
  @ApiOperation({ summary: '创建当前用户的 AI 分身资料' })
  create(@CurrentUser('id') userId: string, @Body() createAiProfileDto: CreateAiProfileDto) {
    return this.aiProfileService.create(userId, createAiProfileDto);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户的 AI 分身资料' })
  findMine(@CurrentUser('id') userId: string) {
    return this.aiProfileService.findMine(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: '更新当前用户的 AI 分身资料' })
  update(@CurrentUser('id') userId: string, @Body() updateAiProfileDto: UpdateAiProfileDto) {
    return this.aiProfileService.updateMine(userId, updateAiProfileDto);
  }

  @Delete('me')
  @ApiOperation({ summary: '删除当前用户的 AI 分身资料' })
  remove(@CurrentUser('id') userId: string) {
    return this.aiProfileService.removeMine(userId);
  }
}
