import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicService } from './topic.service';
import { TopicController } from './topic.controller';
import { Topic } from './entities/topic.entity';
import { Category } from '@/modules/content/category/entities/category.entity';
import { Tag } from '@/modules/content/tag/entities/tag.entity';
import { StorageModule } from '@/modules/infra/storage/storage.module';
import { UserModule } from '@/modules/identity/user/user.module';
import { TopicReaderService } from './topic-reader.service';
import { TopicStatsService } from './topic-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Topic, Category, Tag]), StorageModule, UserModule],
  controllers: [TopicController],
  providers: [TopicService, TopicReaderService, TopicStatsService],
  exports: [TopicService, TopicReaderService, TopicStatsService],
})
export class TopicModule {}

