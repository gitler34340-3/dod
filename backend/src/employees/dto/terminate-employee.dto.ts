import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class TerminateEmployeeDto {
  @ApiProperty({ example: 'Увольнение по собственному желанию' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
