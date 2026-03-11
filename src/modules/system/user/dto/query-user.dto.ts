import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserRole } from '@/common/enums/user.enum';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({ description: '用户名模糊搜索' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: '昵称模糊搜索' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ description: '邮箱模糊搜索' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '角色筛选', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
