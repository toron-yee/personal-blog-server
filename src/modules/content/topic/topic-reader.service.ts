import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';

@Injectable()
export class TopicReaderService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
  ) {}

  async findActiveTopicById(
    id: string,
    options?: Omit<FindOneOptions<Topic>, 'where'>,
  ) {
    return this.topicRepository.findOne({
      ...options,
      where: { id, isDeleted: false },
    });
  }

  async findActiveTopicByIdOrFail(
    id: string,
    options?: Omit<FindOneOptions<Topic>, 'where'>,
  ) {
    const topic = await this.findActiveTopicById(id, options);
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    return topic;
  }
}
