import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user.enum';
import { ReportStatus, ReportType } from '@/common/enums/report.enum';

@ApiTags('举报管理')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * 创建举报
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建举报' })
  @ApiResponse({ status: 201, description: '举报创建成功' })
  @ApiResponse({ status: 400, description: '参数错误或重复举报' })
  create(@Body() createReportDto: CreateReportDto, @CurrentUser() user: any) {
    return this.reportService.create(createReportDto, user.id);
  }

  /**
   * 获取举报列表（管理员）
   */
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取举报列表', description: '仅管理员可操作' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus, description: '举报状态' })
  @ApiQuery({ name: 'type', required: false, enum: ReportType, description: '举报类型' })
  @ApiResponse({ status: 200, description: '返回举报列表' })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: ReportStatus,
    @Query('type') type?: ReportType,
  ) {
    return this.reportService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      status,
      type,
    );
  }

  /**
   * 获取举报详情（管理员）
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取举报详情', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '返回举报详情' })
  @ApiResponse({ status: 404, description: '举报不存在' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.findOne(id);
  }

  /**
   * 处理举报（管理员）
   */
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '处理举报', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '举报已处理' })
  @ApiResponse({ status: 404, description: '举报不存在' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportService.update(id, updateReportDto, user.id);
  }

  /**
   * 删除举报（管理员）
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除举报', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '举报已删除' })
  @ApiResponse({ status: 404, description: '举报不存在' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.remove(id);
  }

  /**
   * 获取举报统计（管理员）
   */
  @Get('admin/stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取举报统计', description: '仅管理员可操作' })
  @ApiResponse({ status: 200, description: '返回举报统计' })
  getStats() {
    return this.reportService.getStats();
  }

  /**
   * 按目标查询举报（管理员）
   */
  @Get('admin/target/:targetId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询某个内容的所有举报', description: '仅管理员可操作' })
  @ApiQuery({ name: 'type', required: true, enum: ReportType, description: '举报类型' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回举报列表' })
  findByTarget(
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query('type') type: ReportType,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.reportService.findByTarget(
      targetId,
      type,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * 获取用户的举报历史
   */
  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的举报历史' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量，默认20' })
  @ApiResponse({ status: 200, description: '返回举报历史' })
  getUserReports(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.reportService.getUserReports(
      user.id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
