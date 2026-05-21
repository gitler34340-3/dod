import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateDocumentTemplateDto {
  name: string;
  description?: string;
  department?: string;
  isRequired?: boolean;
}

export class UpdateDocumentTemplateDto {
  name?: string;
  description?: string;
  department?: string;
  isRequired?: boolean;
}

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignEmployeeDocumentDto {
  @IsString()
  employeeId!: string;

  @IsString()
  documentName!: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsIn(['high', 'normal', 'low'])
  priority?: 'high' | 'normal' | 'low';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewDocumentDto {
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RespondEmployeeDocumentDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['submitted', 'completed'])
  status?: 'submitted' | 'completed';
}

export class CreateEmploymentContractDto {
  position?: string;
  endDate?: Date;
  content?: string;
  fileName?: string;
  fileUrl?: string;
}

export class UpdateEmploymentContractDto {
  position?: string;
  endDate?: Date;
  content?: string;
  salary?: number;
  fileName?: string;
  fileUrl?: string;
}
