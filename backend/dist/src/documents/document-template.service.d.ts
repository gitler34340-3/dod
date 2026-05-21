import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto } from './dto/index';
export declare class DocumentTemplateService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllTemplates(): Promise<any>;
    getTemplatesForDepartment(department: string): Promise<any>;
    getTemplateById(id: string): Promise<any>;
    createTemplate(dto: CreateDocumentTemplateDto, userRole: string): Promise<any>;
    updateTemplate(id: string, dto: UpdateDocumentTemplateDto, userRole: string): Promise<any>;
    deleteTemplate(id: string, userRole: string): Promise<any>;
}
