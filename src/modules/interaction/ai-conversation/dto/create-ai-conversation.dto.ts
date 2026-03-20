import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAiConversationDto {
  @ApiPropertyOptional({ description: '会话标题', example: '周末聊天' })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '会话标题长度需要在 1 到 100 个字符之间' })
  title?: string;

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

  @ApiPropertyOptional({ description: '对方简介', example: '慢热，喜欢旅行和拍照。' })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '对方简介长度不能超过 500 个字符' })
  targetIntro?: string;

  @ApiPropertyOptional({ description: '双方关系', example: '暧昧对象' })
  @IsOptional()
  @IsString()
  @Length(0, 50, { message: '关系描述长度不能超过 50 个字符' })
  relationship?: string;

  @ApiPropertyOptional({ description: '聊天氛围', example: '轻松自然，别太油。' })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: '聊天氛围长度不能超过 300 个字符' })
  chatAtmosphere?: string;

  @ApiPropertyOptional({ description: '语气模板', example: '像微信短句，别太正式。' })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: '语气模板长度不能超过 300 个字符' })
  toneTemplate?: string;

  @ApiPropertyOptional({ description: '目标方向', example: '先延长对话，再自然聊到见面。' })
  @IsOptional()
  @IsString()
  @Length(0, 300, { message: '目标方向长度不能超过 300 个字符' })
  goalDirection?: string;
}
