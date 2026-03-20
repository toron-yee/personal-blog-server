import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentStatsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async incrementLikeCount(commentId: string) {
    await this.commentRepository.increment({ id: commentId }, 'likeCount', 1);
  }

  async decrementLikeCount(commentId: string) {
    await this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({ likeCount: () => 'GREATEST(likeCount - 1, 0)' })
      .where('id = :commentId', { commentId })
      .execute();
  }

  async incrementReportCount(commentId: string, delta: number = 1) {
    await this.commentRepository.increment(
      { id: commentId },
      'reportCount',
      delta,
    );
  }

  async decrementReportCount(commentId: string) {
    await this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({ reportCount: () => 'GREATEST(reportCount - 1, 0)' })
      .where('id = :commentId', { commentId })
      .execute();
  }
}
