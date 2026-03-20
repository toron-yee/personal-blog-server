import { IsEmail, IsNotEmpty, IsString, Length, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/common/enums/user.enum';

export class CreateUserDto {
  @ApiProperty({ description: '邮箱' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(2, 30, { message: '用户名长度为2-30个字符' })
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 50, { message: '密码长度为6-50个字符' })
  password: string;

  @ApiProperty({ description: '昵称' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @Length(1, 30, { message: '昵称长度为1-30个字符' })
  nickname: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '个人网址' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: '个人简介' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  intro?: string;

  @ApiPropertyOptional({ description: '角色', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: '角色值无效' })
  role?: UserRole;
}
