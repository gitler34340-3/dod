import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestCredentialChangeDto {
  @ApiPropertyOptional({ example: 'new.login@company.com' })
  @IsOptional()
  @IsEmail()
  requestedEmail?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  requestedPassword?: string;

  @ApiPropertyOptional({ example: 'Прошу сменить логин и пароль' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
