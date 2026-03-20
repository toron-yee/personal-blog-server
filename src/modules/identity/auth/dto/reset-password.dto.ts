import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码为6位数字' })
  code: string;

  @ApiProperty({ description: '新密码', example: 'newPassword123' })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 50, { message: '密码长度为6-50个字符' })
  newPassword: string;
}
