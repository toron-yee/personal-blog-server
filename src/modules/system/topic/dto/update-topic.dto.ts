import { PartialType } from '@nestjs/swagger';
import { CreateTopicDto } from './create-topic.dto';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  // 更新时允许所有字段为空，因为是部分更新
}
