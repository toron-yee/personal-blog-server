import { IsString, IsOptional, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  @Length(1, 30, { message: '昵称长度为1-30个字符' })
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '个人网址' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: '个人简介' })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: '个人简介长度为0-200个字符' })
  intro?: string;
}
