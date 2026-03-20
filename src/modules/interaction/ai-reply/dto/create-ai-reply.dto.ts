import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

export class AiReplyChatContextDto {
  @ApiPropertyOptional({ description: '对方名称', example: '小雨' })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '对方名称长度不能超过 50 个字符' })
  targetName?: string;

  @ApiPropertyOptional({ description: '对方性别', example: '女' })
  @IsOptional()
  @IsString()
  @Length(0, 20, { message: '对方性别长度不能超过 20 个字符' })
  targetGender?: string;

  @ApiPropertyOptional({ description: '对方简介', example: '慢热一点，喜欢旅行。' })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '对方简介长度不能超过 500 个字符' })
  targetIntro?: string;

  @ApiPropertyOptional({ description: '双方关系', example: '暧昧对象' })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '关系长度不能超过 50 个字符' })
  relationship?: string;

  @ApiPropertyOptional({ description: '聊天氛围', example: '轻松自然一点，别太猛。' })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: '聊天氛围长度不能超过 300 个字符' })
  chatAtmosphere?: string;

  @ApiPropertyOptional({ description: '语气模板', example: '像微信短句聊天，别太书面。' })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: '语气模板长度不能超过 300 个字符' })
  toneTemplate?: string;

  @ApiPropertyOptional({ description: '目标方向', example: '先接住话题，再自然延长聊天。' })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: '目标方向长度不能超过 300 个字符' })
  goalDirection?: string;
}

export class CreateAiReplyDto {
  @ApiPropertyOptional({ description: '会话 ID，不传则自动创建新会话' })
  @IsOptional()
  @IsUUID('4', { message: '会话 ID 格式不正确' })
  conversationId?: string;

  @ApiPropertyOptional({ description: '新会话标题，不传则自动生成', example: '周末安排' })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '会话标题长度需要在 1 到 100 个字符之间' })
  conversationTitle?: string;

  @ApiProperty({ description: '用户本次输入内容', example: '周末去哪里玩比较合适？' })
  @IsString()
  @IsNotEmpty({ message: '用户消息不能为空' })
  @Length(1, 2000, { message: '用户消息长度需要在 1 到 2000 个字符之间' })
  userMessage: string;

  @ApiPropertyOptional({ description: '本次发送附带的聊天上下文', type: AiReplyChatContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AiReplyChatContextDto)
  chatContext?: AiReplyChatContextDto;
}
