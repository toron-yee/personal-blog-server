import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicModule } from '@/modules/content/topic/topic.module';
import { NotificationModule } from '@/modules/interaction/notification/notification.module';
import { UserModule } from '@/modules/identity/user/user.module';
import { TopicLikeService } from './topic-like.service';
import { TopicLikeController } from './topic-like.controller';
import { TopicLike } from './entities/topic-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TopicLike]), TopicModule, NotificationModule, UserModule],
  controllers: [TopicLikeController],
  providers: [TopicLikeService],
  exports: [TopicLikeService],
})
export class TopicLikeModule {}
