import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentReaderService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findActiveCommentById(
    id: string,
    options?: Omit<FindOneOptions<Comment>, 'where'>,
  ) {
    return this.commentRepository.findOne({
      ...options,
      where: { id, isDeleted: false },
    });
  }

  async findActiveCommentByIdOrFail(
    id: string,
    options?: Omit<FindOneOptions<Comment>, 'where'>,
  ) {
    const comment = await this.findActiveCommentById(id, options);
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }
}
