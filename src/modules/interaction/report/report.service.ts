import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatus, ReportType } from '@/common/enums/report.enum';
import { ReportTargetCounterService } from './report-target-counter.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly reportTargetCounterService: ReportTargetCounterService,
  ) {}

  /**
   * 创建举报
   */
  async create(createReportDto: CreateReportDto, reporterId: string) {
    // 检查是否已经举报过同一对象
    const existingReport = await this.reportRepository.findOne({
      where: {
        type: createReportDto.type,
        targetId: createReportDto.targetId,
        reporter: { id: reporterId },
        status: ReportStatus.PENDING,
        isDeleted: false,
      },
    });

    if (existingReport) {
      throw new BadRequestException('您已经举报过该内容，请勿重复举报');
    }

    const report = this.reportRepository.create({
      ...createReportDto,
      reporter: { id: reporterId },
    });

    const savedReport = await this.reportRepository.save(report);

    // 更新相关实体的举报计数
    await this.reportTargetCounterService.changeReportCount(
      createReportDto.type,
      createReportDto.targetId,
      1,
    );

    return savedReport;
  }

  /**
   * 获取举报列表（管理员）
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus,
    type?: ReportType,
  ) {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .where('report.isDeleted = :isDeleted', { isDeleted: false });

    if (status) {
      query.andWhere('report.status = :status', { status });
    }

    if (type) {
      query.andWhere('report.type = :type', { type });
    }

    query.orderBy('report.createdAt', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取举报详情（管理员）
   */
  async findOne(id: string) {
    const report = await this.reportRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['reporter'],
    });

    if (!report) {
      throw new NotFoundException('举报不存在');
    }

    return report;
  }

  /**
   * 按目标查询举报（用于查看某个内容的所有举报）
   */
  async findByTarget(
    targetId: string,
    type: ReportType,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await this.reportRepository.findAndCount({
      where: {
        targetId,
        type,
        isDeleted: false,
      },
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * 更新举报状态（管理员处理）
   */
  async update(id: string, updateReportDto: UpdateReportDto, handledBy: string) {
    const report = await this.findOne(id);

    if (updateReportDto.status) {
      report.status = updateReportDto.status;
      report.handledBy = handledBy;
      report.handledAt = new Date();
    }

    if (updateReportDto.resolution) {
      report.resolution = updateReportDto.resolution;
    }

    return this.reportRepository.save(report);
  }

  /**
   * 删除举报（软删除）
   */
  async remove(id: string) {
    const report = await this.findOne(id);
    report.isDeleted = true;

    // 删除举报时，减少相关实体的举报计数
    await this.reportTargetCounterService.changeReportCount(
      report.type,
      report.targetId,
      -1,
    );

    return this.reportRepository.save(report);
  }

  /**
   * 获取举报统计（管理员）
   */
  async getStats() {
    const stats = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('report.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('report.status')
      .getRawMany();

    const typeStats = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('report.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('report.type')
      .getRawMany();

    return {
      byStatus: stats,
      byType: typeStats,
    };
  }

  /**
   * 获取用户的举报历史
   */
  async getUserReports(userId: string, page: number = 1, limit: number = 20) {
    const [data, total] = await this.reportRepository.findAndCount({
      where: {
        reporter: { id: userId },
        isDeleted: false,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

}
