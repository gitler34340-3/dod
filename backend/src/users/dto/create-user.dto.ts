import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'worker@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль не менее 8 символов' })
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.Employee })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.Employee;

  @ApiPropertyOptional({ description: 'ID связанного сотрудника' })
  @IsString()
  @IsOptional()
  employeeId?: string;
}
