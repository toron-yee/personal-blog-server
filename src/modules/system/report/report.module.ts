import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Report } from './entities/report.entity';
import { Comment } from '@/modules/system/comment/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Comment])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
