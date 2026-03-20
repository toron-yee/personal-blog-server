import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token' })
  @IsString()
  @IsNotEmpty({ message: 'refreshToken 不能为空' })
  refreshToken: string;
}
