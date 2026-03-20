import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentModule } from '@/modules/content/comment/comment.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { CommentReportAdminController } from './comment-report-admin.controller';
import { Report } from './entities/report.entity';
import { ReportTargetCounterService } from './report-target-counter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), CommentModule],
  controllers: [ReportController, CommentReportAdminController],
  providers: [ReportService, ReportTargetCounterService],
  exports: [ReportService],
})
export class ReportModule {}
