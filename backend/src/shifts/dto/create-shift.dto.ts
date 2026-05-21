import { ShiftType, EmployeeRole } from '@prisma/client';
import { IsOptional, IsString, IsNotEmpty, IsEnum, IsNumber, IsBoolean, Allow } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShiftDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @IsNotEmpty()
  @IsEnum(EmployeeRole)
  role!: EmployeeRole;

  @IsOptional()
  @IsString()
  @Allow()
  comment?: string;

  @IsOptional()
  @IsEnum(ShiftType)
  @Allow()
  type?: ShiftType;

  @IsOptional()
  @IsBoolean()
  @Allow()
  canDecline?: boolean;

  @IsOptional()
  @IsNumber()
  @Allow()
  maxParticipants?: number;
}
