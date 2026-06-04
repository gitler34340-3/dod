import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Иван' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Петров' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  hireDate!: string;

  @ApiProperty({ example: 500, description: 'Hourly rate in rubles' })
  @IsNumber()
  @Min(0)
  hourlyRate!: number;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportSeries?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportIssuedBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportIssueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportDivisionCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passportRegistrationAddress?: string;

  @ApiPropertyOptional({ description: 'Разрешена публикация сторис' })
  @IsBoolean()
  @IsOptional()
  canPublishStories?: boolean;
}