import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';

@Injectable()
export class TopicStatsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
  ) {}

  async incrementCommentCount(topicId: string) {
    await this.topicRepository.increment({ id: topicId }, 'commentCount', 1);
  }

  async decrementCommentCount(topicId: string) {
    await this.topicRepository
      .createQueryBuilder()
      .update(Topic)
      .set({ commentCount: () => 'GREATEST(commentCount - 1, 0)' })
      .where('id = :topicId', { topicId })
      .execute();
  }

  async incrementLikeCount(topicId: string) {
    await this.topicRepository.increment({ id: topicId }, 'likeCount', 1);
  }

  async decrementLikeCount(topicId: string) {
    await this.topicRepository
      .createQueryBuilder()
      .update(Topic)
      .set({ likeCount: () => 'GREATEST(likeCount - 1, 0)' })
      .where('id = :topicId', { topicId })
      .execute();
  }
}
