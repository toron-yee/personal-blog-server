import { IsString, IsNotEmpty, IsOptional, IsBoolean, ArrayNotEmpty, ArrayMaxSize, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({ description: '话题标题', example: 'TypeORM 入门教程' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '话题内容', example: '这是TypeORM的详细教程内容...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '内容类型', enum: ['html', 'markdown', 'plain'], default: 'html', required: false })
  @IsOptional()
  @IsEnum(['html', 'markdown', 'plain'])
  contentType?: 'html' | 'markdown' | 'plain';

  @ApiProperty({ description: '话题封面图片URL', example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ description: '话题摘要', example: '本文详细介绍TypeORM的使用方法', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: '是否置顶', example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isSticky?: boolean;

  @ApiProperty({ description: '是否推荐', example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @ApiProperty({ description: '是否公开', example: true, default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: '是否草稿', example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiProperty({ description: '类别ID', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: '标签ID列表',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    required: false,
    maxItems: 5
  })
  @IsOptional()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
