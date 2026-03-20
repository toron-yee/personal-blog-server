import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '邮箱验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码为6位数字' })
  code: string;

  @ApiProperty({ description: '用户名', example: 'johndoe' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(2, 30, { message: '用户名长度为2-30个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 50, { message: '密码长度为6-50个字符' })
  password: string;

  @ApiProperty({ description: '昵称', example: 'John' })
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
  @Length(0, 200, { message: '简介长度不超过200个字符' })
  intro?: string;
}
