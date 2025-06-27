import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'viewer'], { message: 'Role must be either admin or viewer' })
  role?: 'admin' | 'viewer';
}
