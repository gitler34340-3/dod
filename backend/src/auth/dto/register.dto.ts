import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль не менее 8 символов' })
  password!: string;

  @ApiProperty({ enum: Role, default: Role.Employee })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.Employee;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  employeeId?: string;
}
