import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, DocumentResponseDto } from './dto/create-document.dto';
export declare class DocumentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserDocuments(userId: string): Promise<DocumentResponseDto[]>;
    getAllDocuments(userRole: string): Promise<DocumentResponseDto[]>;
    getDocumentById(documentId: string, userId: string, userRole: string): Promise<DocumentResponseDto>;
    createDocument(dto: CreateDocumentDto, userId: string): Promise<DocumentResponseDto>;
    createDocumentForEmployee(dto: CreateDocumentDto, userRole: string): Promise<DocumentResponseDto>;
    updateDocument(documentId: string, dto: UpdateDocumentDto, userId: string, userRole: string): Promise<DocumentResponseDto>;
    deleteDocument(documentId: string, userId: string, userRole: string): Promise<{
        message: string;
    }>;
    archiveDocument(documentId: string, userId: string, userRole: string): Promise<DocumentResponseDto>;
    restoreDocument(documentId: string, userId: string, userRole: string): Promise<DocumentResponseDto>;
    exportDocumentsAsJson(userRole: string): Promise<any>;
    private mapToResponse;
}
