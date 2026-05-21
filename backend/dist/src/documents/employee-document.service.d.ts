import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto, ReviewDocumentDto, AssignEmployeeDocumentDto, RespondEmployeeDocumentDto } from './dto/index';
import { AchievementsHrService } from '../achievements-hr/achievements-hr.service';
export declare class EmployeeDocumentService {
    private prisma;
    private readonly achievementsService;
    constructor(prisma: PrismaService, achievementsService: AchievementsHrService);
    private appendHistoryEntry;
    getRequiredDocumentsForEmployee(employeeId: string): Promise<any>;
    uploadDocument(employeeId: string, templateId: string, dto: UploadDocumentDto): Promise<any>;
    assignDocumentToEmployee(dto: AssignEmployeeDocumentDto, userRole: string): Promise<any>;
    getEmployeeDocument(documentId: string, employeeId: string, userRole: string): Promise<any>;
    getEmployeeDocuments(employeeId: string): Promise<any>;
    respondToDocument(documentId: string, employeeId: string, dto: RespondEmployeeDocumentDto): Promise<any>;
    getAllEmployeeDocuments(templateId?: string, status?: string, employeeId?: string): Promise<any>;
    reviewDocument(documentId: string, dto: ReviewDocumentDto, userRole: string): Promise<any>;
    deleteEmployeeDocument(documentId: string, employeeId: string, userRole: string): Promise<any>;
}
