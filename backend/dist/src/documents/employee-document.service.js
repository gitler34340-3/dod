"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const achievements_hr_service_1 = require("../achievements-hr/achievements-hr.service");
let EmployeeDocumentService = class EmployeeDocumentService {
    prisma;
    achievementsService;
    constructor(prisma, achievementsService) {
        this.prisma = prisma;
        this.achievementsService = achievementsService;
    }
    appendHistoryEntry(existing, entry) {
        const current = existing?.trim() || '';
        return [current, `[HISTORY ${new Date().toISOString()}] ${entry}`]
            .filter(Boolean)
            .join('\n');
    }
    async getRequiredDocumentsForEmployee(employeeId) {
        const db = this.prisma;
        const employee = await this.prisma.employee.findUniqueOrThrow({
            where: { id: employeeId },
            select: { departmentId: true },
        });
        const templates = await db.documentTemplate.findMany({
            where: {
                isRequired: true,
                OR: [{ department: null }, { department: employee.departmentId ?? undefined }],
            },
        });
        const submissions = await db.employeeDocument.findMany({
            where: { employeeId },
            include: { template: true },
        });
        return templates.map(template => {
            const submission = submissions.find(s => s.templateId === template.id);
            return {
                templateId: template.id,
                name: template.name,
                description: template.description,
                isRequired: template.isRequired,
                submission: submission
                    ? {
                        id: submission.id,
                        fileName: submission.fileName,
                        fileUrl: submission.fileUrl,
                        status: submission.status,
                        uploadedAt: submission.uploadedAt,
                        notes: submission.notes,
                    }
                    : null,
            };
        });
    }
    async uploadDocument(employeeId, templateId, dto) {
        const db = this.prisma;
        const template = await db.documentTemplate.findUniqueOrThrow({ where: { id: templateId } });
        const employee = await this.prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });
        await db.employeeDocument.deleteMany({ where: { employeeId, templateId } });
        const created = await db.employeeDocument.create({
            data: {
                employeeId,
                templateId,
                fileName: dto.fileName,
                fileUrl: dto.fileUrl,
                notes: dto.notes,
                status: 'pending',
            },
            include: { template: true },
        });
        await this.achievementsService.awardAutomaticForEmployee(employeeId);
        return created;
    }
    async assignDocumentToEmployee(dto, userRole) {
        if (!['Admin', 'HR', 'Manager'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только администратор или HR может назначать документы');
        }
        const db = this.prisma;
        const employee = await this.prisma.employee.findUniqueOrThrow({
            where: { id: dto.employeeId },
            select: { id: true, departmentId: true },
        });
        const template = await db.documentTemplate.create({
            data: {
                name: dto.documentName,
                description: [
                    dto.deadline ? `Дедлайн: ${dto.deadline}` : null,
                    dto.priority ? `Приоритет: ${dto.priority}` : null,
                    dto.notes?.trim() || null,
                ]
                    .filter(Boolean)
                    .join('\n'),
                department: employee.departmentId ?? undefined,
                isRequired: false,
            },
        });
        return db.employeeDocument.create({
            data: {
                employeeId: employee.id,
                templateId: template.id,
                status: 'pending',
                notes: [
                    dto.deadline ? `Дедлайн: ${dto.deadline}` : null,
                    dto.priority ? `Приоритет: ${dto.priority}` : null,
                    dto.notes?.trim() || null,
                ]
                    .filter(Boolean)
                    .join('\n'),
            },
            include: {
                template: true,
                employee: { select: { firstName: true, lastName: true, email: true } },
            },
        });
    }
    async getEmployeeDocument(documentId, employeeId, userRole) {
        const db = this.prisma;
        const document = await db.employeeDocument.findUnique({
            where: { id: documentId },
            include: { template: true },
        });
        if (!document) {
            throw new common_1.NotFoundException('Документ не найден');
        }
        if (document.employeeId !== employeeId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        return document;
    }
    async getEmployeeDocuments(employeeId) {
        const db = this.prisma;
        return db.employeeDocument.findMany({
            where: { employeeId },
            include: { template: true },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async respondToDocument(documentId, employeeId, dto) {
        const db = this.prisma;
        const document = await db.employeeDocument.findUniqueOrThrow({
            where: { id: documentId },
            include: { template: true },
        });
        if (document.employeeId !== employeeId) {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        const employeeResponse = dto.notes?.trim() || '';
        const mergedNotes = this.appendHistoryEntry(document.notes, `EMPLOYEE_RESPONSE: ${employeeResponse || 'Без комментария'}`);
        const updated = await db.employeeDocument.update({
            where: { id: documentId },
            data: {
                fileName: dto.fileName ?? document.fileName,
                fileUrl: dto.fileUrl ?? document.fileUrl,
                notes: mergedNotes,
                status: dto.status ?? 'submitted',
            },
            include: {
                template: true,
                employee: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        await this.achievementsService.awardAutomaticForEmployee(employeeId);
        return updated;
    }
    async getAllEmployeeDocuments(templateId, status, employeeId) {
        const db = this.prisma;
        return db.employeeDocument.findMany({
            where: {
                ...(templateId && { templateId }),
                ...(status && { status }),
                ...(employeeId && { employeeId }),
            },
            include: {
                template: true,
                employee: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async reviewDocument(documentId, dto, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только админ может проверять документы');
        }
        if (!dto?.status) {
            throw new common_1.BadRequestException('Не указан статус проверки документа');
        }
        const db = this.prisma;
        const existing = await db.employeeDocument.findUniqueOrThrow({ where: { id: documentId } });
        const mergedNotes = this.appendHistoryEntry(existing.notes, `ADMIN_REVIEW [${dto.status.toUpperCase()}]: ${(dto.notes || '').trim() || 'Без комментария'}`);
        const updated = await db.employeeDocument.update({
            where: { id: documentId },
            data: { status: dto.status, notes: mergedNotes },
            include: { template: true },
        });
        await this.achievementsService.awardAutomaticForEmployee(existing.employeeId);
        return updated;
    }
    async deleteEmployeeDocument(documentId, employeeId, userRole) {
        const db = this.prisma;
        const document = await db.employeeDocument.findUniqueOrThrow({ where: { id: documentId } });
        if (document.employeeId !== employeeId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        return db.employeeDocument.delete({ where: { id: documentId } });
    }
};
exports.EmployeeDocumentService = EmployeeDocumentService;
exports.EmployeeDocumentService = EmployeeDocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        achievements_hr_service_1.AchievementsHrService])
], EmployeeDocumentService);
//# sourceMappingURL=employee-document.service.js.map