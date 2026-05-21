import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserCredentialsDto {
  @ApiPropertyOptional({ example: 'worker.updated@company.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NewSecurePass123' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Пароль не менее 8 символов' })
  password?: string;
}
