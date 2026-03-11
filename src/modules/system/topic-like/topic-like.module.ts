import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicLikeService } from './topic-like.service';
import { TopicLikeController } from './topic-like.controller';
import { TopicLike } from './entities/topic-like.entity';
import { Topic } from '../topic/entities/topic.entity';
import { User } from '../user/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([TopicLike, Topic, User]), NotificationModule],
  controllers: [TopicLikeController],
  providers: [TopicLikeService],
  exports: [TopicLikeService],
})
export class TopicLikeModule {}
