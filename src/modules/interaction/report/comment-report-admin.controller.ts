import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { ReportType } from '@/common/enums/report.enum';
import { ReportService } from './report.service';

@ApiTags('评论管理')
@Controller('comment')
export class CommentReportAdminController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * 获取评论的举报列表（管理员）
   */
  @Get('admin/:id/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取评论的举报列表', description: '仅管理员可操作' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回举报列表' })
  getCommentReports(
    @Param('id', ParseUUIDPipe) commentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.reportService.findByTarget(
      commentId,
      ReportType.COMMENT,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
