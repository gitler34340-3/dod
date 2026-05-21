export declare class CreateDocumentTemplateDto {
    name: string;
    description?: string;
    department?: string;
    isRequired?: boolean;
}
export declare class UpdateDocumentTemplateDto {
    name?: string;
    description?: string;
    department?: string;
    isRequired?: boolean;
}
export declare class UploadDocumentDto {
    fileName?: string;
    fileUrl?: string;
    notes?: string;
}
export declare class AssignEmployeeDocumentDto {
    employeeId: string;
    documentName: string;
    deadline?: string;
    priority?: 'high' | 'normal' | 'low';
    notes?: string;
}
export declare class ReviewDocumentDto {
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
}
export declare class RespondEmployeeDocumentDto {
    fileName?: string;
    fileUrl?: string;
    notes?: string;
    status?: 'submitted' | 'completed';
}
export declare class CreateEmploymentContractDto {
    position?: string;
    endDate?: Date;
    content?: string;
    fileName?: string;
    fileUrl?: string;
}
export declare class UpdateEmploymentContractDto {
    position?: string;
    endDate?: Date;
    content?: string;
    salary?: number;
    fileName?: string;
    fileUrl?: string;
}
