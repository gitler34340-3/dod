import { DocumentsService } from './documents.service';
import type { User } from '../domain/entities';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/create-document.dto';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    getMyDocuments(user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto[]>;
    getAllDocuments(user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto[]>;
    getDocument(id: string, user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto>;
    createDocument(dto: CreateDocumentDto, user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto>;
    createDocumentForEmployee(dto: CreateDocumentDto, user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto>;
    updateDocument(id: string, dto: UpdateDocumentDto, user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto>;
    deleteDocument(id: string, user: User): Promise<{
        message: string;
    }>;
    archiveDocument(id: string, user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto>;
    restoreDocument(id: string, user: User): Promise<import("./dto/create-document.dto").DocumentResponseDto>;
    exportDocumentsAsJson(user: User, res: any): Promise<void>;
}
