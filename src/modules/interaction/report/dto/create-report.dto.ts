import { IsEnum, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ReportType, ReportReason } from '@/common/enums/report.enum';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsUUID()
  targetId: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;
}
