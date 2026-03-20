import { Module } from '@nestjs/common';
import { CategoryModule } from '@/modules/content/category/category.module';
import { CommentModule } from '@/modules/content/comment/comment.module';
import { TagModule } from '@/modules/content/tag/tag.module';
import { TopicModule } from '@/modules/content/topic/topic.module';

@Module({
  imports: [TopicModule, CommentModule, CategoryModule, TagModule],
  exports: [TopicModule, CommentModule, CategoryModule, TagModule],
})
export class ContentModule {}

