import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { CommentStatus, ViolationType } from '@/common/enums/comment.enum';

/**
 * 查询违规评论的过滤条件
 */
export class FindViolationsDto {
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;

  @IsOptional()
  @IsEnum(ViolationType)
  violationType?: ViolationType;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}

/**
 * 拒绝评论的请求体
 */
export class RejectCommentDto {
  @IsEnum(ViolationType)
  violationType: ViolationType;

  @IsString()
  reason: string;
}

/**
 * 隐藏评论的请求体
 */
export class HideCommentDto {
  @IsString()
  reason: string;
}

/**
 * 恢复评论的请求体
 */
export class RestoreCommentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
