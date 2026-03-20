import { Injectable, Logger } from '@nestjs/common';
import { ReportType } from '@/common/enums/report.enum';
import { CommentStatsService } from '@/modules/content/comment/comment-stats.service';

@Injectable()
export class ReportTargetCounterService {
  private readonly logger = new Logger(ReportTargetCounterService.name);

  constructor(private readonly commentStatsService: CommentStatsService) {}

  async changeReportCount(type: ReportType, targetId: string, delta: number) {
    try {
      if (type === ReportType.COMMENT) {
        if (delta > 0) {
          await this.commentStatsService.incrementReportCount(targetId, delta);
          return;
        }

        await this.commentStatsService.decrementReportCount(targetId);
      }
      // 后续可以添加 TOPIC、USER 等类型的处理
    } catch (error) {
      this.logger.warn(`Failed to update report count for ${type}:${targetId}`);
      if (error instanceof Error) {
        this.logger.debug(error.stack);
      }
    }
  }
}
