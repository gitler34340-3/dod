import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayrollDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: '2025-02-01' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ example: '2025-02-28' })
  @IsDateString()
  periodEnd!: string;

  @ApiProperty({ example: 80000 })
  @IsNumber()
  @Min(0)
  baseSalary!: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bonuses?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deductions?: number;
}
