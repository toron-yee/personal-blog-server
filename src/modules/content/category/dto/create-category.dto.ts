import { IsString, IsOptional, IsInt, IsBoolean, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
