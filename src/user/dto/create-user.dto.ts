import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsIn,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'viewer'], { message: 'Role must be either admin or viewer' })
  role?: 'admin' | 'viewer' = 'viewer';
}
