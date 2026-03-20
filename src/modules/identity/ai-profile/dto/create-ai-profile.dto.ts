import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateAiProfileDto {
  @ApiProperty({ description: 'AI 分身名称', example: '赛博小助手' })
  @IsString()
  @IsNotEmpty({ message: 'AI 分身名称不能为空' })
  @Length(1, 50, { message: 'AI 分身名称长度为 1-50 个字符' })
  name: string;

  @ApiPropertyOptional({ description: '性别', example: '女' })
  @IsOptional()
  @IsString()
  @Length(0, 20, { message: '性别长度不能超过 20 个字符' })
  gender?: string;

  @ApiPropertyOptional({ description: '年龄', example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age?: number;

  @ApiPropertyOptional({ description: '性格', example: '温柔、理性、嘴有点毒' })
  @IsOptional()
  @IsString()
  @Length(0, 100, { message: '性格长度不能超过 100 个字符' })
  personality?: string;

  @ApiPropertyOptional({ description: '说话习惯', example: '喜欢先总结，再展开细说' })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: '说话习惯长度不能超过 200 个字符' })
  speakingStyle?: string;

  @ApiPropertyOptional({ description: '爱好', example: '看书、旅行、研究数码产品' })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: '爱好长度不能超过 200 个字符' })
  hobbies?: string;

  @ApiPropertyOptional({ description: '职业', example: '产品经理' })
  @IsOptional()
  @IsString()
  @Length(0, 100, { message: '职业长度不能超过 100 个字符' })
  occupation?: string;

  @ApiPropertyOptional({ description: '备注', example: '讨厌套话，回答要直接' })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: '备注长度不能超过 500 个字符' })
  remarks?: string;
}
