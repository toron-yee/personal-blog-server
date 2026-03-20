import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserReaderService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findUserEntityById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findUserEntityByIdOrFail(id: string) {
    const user = await this.findUserEntityById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }
}
