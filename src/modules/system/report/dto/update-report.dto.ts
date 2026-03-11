import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportStatus } from '@/common/enums/report.enum';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  resolution?: string;
}
