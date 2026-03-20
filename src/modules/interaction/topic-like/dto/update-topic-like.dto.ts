import { PartialType } from '@nestjs/swagger';
import { CreateTopicLikeDto } from './create-topic-like.dto';

export class UpdateTopicLikeDto extends PartialType(CreateTopicLikeDto) {}
