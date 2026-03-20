import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @Length(1, 30)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: '颜色格式不正确，请使用十六进制格式，如：#3B82F6',
  })
  color?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;
}
