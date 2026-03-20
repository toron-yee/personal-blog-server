import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ description: '收件人邮箱', example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  toEmail: string;

  @ApiProperty({ description: '邮件主题', example: '测试邮件' })
  @IsString()
  subject: string;

  @ApiProperty({ description: '邮件HTML内容', example: '<h1>Hello</h1>' })
  @IsNotEmpty()
  @IsString()
  htmlInfo: string;
}