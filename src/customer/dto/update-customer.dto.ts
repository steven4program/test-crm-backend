import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Company must not exceed 100 characters' })
  company?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Address must not exceed 255 characters' })
  address?: string;
}
