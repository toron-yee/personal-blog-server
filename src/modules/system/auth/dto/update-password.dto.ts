import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ description: '旧密码' })
  @IsString()
  @IsNotEmpty({ message: '旧密码不能为空' })
  oldPassword: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @Length(6, 50, { message: '新密码长度为6-50个字符' })
  newPassword: string;
}
