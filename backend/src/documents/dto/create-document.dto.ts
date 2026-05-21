import { IsString, IsOptional, IsDefined } from 'class-validator';

export class CreateDocumentDto {
  @IsDefined()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class DocumentResponseDto {
  id!: string;
  title!: string;
  description?: string;
  type!: string;
  status!: string;
  fileName?: string;
  fileUrl?: string;
  ownerId!: string;
  ownerEmail?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
