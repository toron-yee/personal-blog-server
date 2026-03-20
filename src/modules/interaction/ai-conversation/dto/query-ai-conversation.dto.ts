import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return false;
}

export class QueryAiConversationDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于 1' })
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '是否包含已归档会话', default: false })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'includeArchived 必须是布尔值' })
  includeArchived?: boolean = false;

  @ApiPropertyOptional({ description: '是否仅查看已归档会话', default: false })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'archivedOnly 必须是布尔值' })
  archivedOnly?: boolean = false;
}
