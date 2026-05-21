import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const reviewStatuses = ['Approved', 'Rejected'] as const;

export class ReviewCredentialChangeDto {
  @ApiProperty({ enum: reviewStatuses })
  @IsEnum(reviewStatuses)
  status!: 'Approved' | 'Rejected';
}
