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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentsService = class DocumentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserDocuments(userId) {
        const documents = await this.prisma.document.findMany({
            where: { ownerId: userId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return documents.map((doc) => this.mapToResponse(doc));
    }
    async getAllDocuments(userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Недостаточно прав для просмотра всех документов');
        }
        const documents = await this.prisma.document.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return documents.map((doc) => this.mapToResponse(doc));
    }
    async getDocumentById(documentId, userId, userRole) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException('Документ не найден');
        }
        if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Нет доступа к этому документу');
        }
        return this.mapToResponse(document);
    }
    async createDocument(dto, userId) {
        const document = await this.prisma.document.create({
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type || 'document',
                status: 'active',
                ownerId: userId,
                fileUrl: dto.fileUrl,
                fileName: dto.fileName,
            },
        });
        return this.mapToResponse(document);
    }
    async createDocumentForEmployee(dto, userRole) {
        if (!['Admin', 'HR', 'Manager'].includes(userRole)) {
            throw new common_1.ForbiddenException('Недостаточно прав для создания документа сотруднику');
        }
        if (!dto.employeeId) {
            throw new common_1.NotFoundException('Сотрудник не указан');
        }
        const employee = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!employee?.user?.id) {
            throw new common_1.NotFoundException('У сотрудника не найден привязанный пользователь');
        }
        const document = await this.prisma.document.create({
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type || 'document',
                status: 'active',
                ownerId: employee.user.id,
                fileUrl: dto.fileUrl,
                fileName: dto.fileName,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        return this.mapToResponse(document);
    }
    async updateDocument(documentId, dto, userId, userRole) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException('Документ не найден');
        }
        if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Нет прав для редактирования этого документа');
        }
        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: {
                title: dto.title || document.title,
                description: dto.description !== undefined ? dto.description : document.description,
                type: dto.type || document.type,
                status: dto.status || document.status,
                fileName: dto.fileName !== undefined ? dto.fileName : document.fileName,
                fileUrl: dto.fileUrl !== undefined ? dto.fileUrl : document.fileUrl,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        return this.mapToResponse(updated);
    }
    async deleteDocument(documentId, userId, userRole) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new common_1.NotFoundException('Документ не найден');
        }
        if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Нет прав для удаления этого документа');
        }
        await this.prisma.document.delete({
            where: { id: documentId },
        });
        return { message: 'Документ успешно удален' };
    }
    async archiveDocument(documentId, userId, userRole) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException('Документ не найден');
        }
        if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Нет прав для архивирования этого документа');
        }
        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: { status: 'archived' },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        return this.mapToResponse(updated);
    }
    async restoreDocument(documentId, userId, userRole) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException('Документ не найден');
        }
        if (document.ownerId !== userId && !['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Нет прав для восстановления этого документа');
        }
        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: { status: 'active' },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        return this.mapToResponse(updated);
    }
    async exportDocumentsAsJson(userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Недостаточно прав для экспорта');
        }
        const documents = await this.prisma.document.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            exportedAt: new Date().toISOString(),
            totalDocuments: documents.length,
            documents: documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                description: doc.description,
                type: doc.type,
                status: doc.status,
                ownerEmail: doc.owner?.email,
                fileName: doc.fileName,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            })),
        };
    }
    mapToResponse(document) {
        return {
            id: document.id,
            title: document.title,
            description: document.description,
            type: document.type,
            status: document.status,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            ownerId: document.ownerId,
            ownerEmail: document.owner?.email,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        };
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map