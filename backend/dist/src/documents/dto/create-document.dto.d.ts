export declare class CreateDocumentDto {
    title: string;
    employeeId?: string;
    description?: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
}
export declare class UpdateDocumentDto {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
    fileUrl?: string;
    fileName?: string;
}
export declare class DocumentResponseDto {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    fileName?: string;
    fileUrl?: string;
    ownerId: string;
    ownerEmail?: string;
    createdAt: Date;
    updatedAt: Date;
}
