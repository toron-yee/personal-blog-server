import { IsString, IsUUID, IsOptional, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 5000)
  content: string;

  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  replyToUserId?: string;
}
