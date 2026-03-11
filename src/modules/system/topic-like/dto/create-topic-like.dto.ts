import { IsUUID } from 'class-validator';

export class CreateTopicLikeDto {
  @IsUUID()
  topicId: string;
}
