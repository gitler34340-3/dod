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
exports.DocumentTemplateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentTemplateService = class DocumentTemplateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllTemplates() {
        const db = this.prisma;
        return db.documentTemplate.findMany({
            include: {
                submissions: {
                    select: {
                        id: true,
                        employeeId: true,
                        status: true,
                        uploadedAt: true,
                        employee: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTemplatesForDepartment(department) {
        const db = this.prisma;
        return db.documentTemplate.findMany({
            where: {
                OR: [{ department: null }, { department }],
                isRequired: true,
            },
        });
    }
    async getTemplateById(id) {
        const db = this.prisma;
        const template = await db.documentTemplate.findUnique({
            where: { id },
            include: {
                submissions: {
                    select: {
                        id: true,
                        employeeId: true,
                        status: true,
                        uploadedAt: true,
                        employee: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
            },
        });
        if (!template) {
            throw new common_1.NotFoundException('Шаблон не найден');
        }
        return template;
    }
    async createTemplate(dto, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только админ может создавать шаблоны');
        }
        const db = this.prisma;
        return db.documentTemplate.create({
            data: {
                name: dto.name,
                description: dto.description,
                department: dto.department,
                isRequired: dto.isRequired ?? true,
            },
        });
    }
    async updateTemplate(id, dto, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только админ может обновлять шаблоны');
        }
        const db = this.prisma;
        const template = await this.getTemplateById(id);
        if (!template) {
            throw new common_1.NotFoundException('Шаблон не найден');
        }
        return db.documentTemplate.update({
            where: { id },
            data: {
                name: dto.name ?? template.name,
                description: dto.description ?? template.description,
                department: dto.department ?? template.department,
                isRequired: dto.isRequired ?? template.isRequired,
            },
        });
    }
    async deleteTemplate(id, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только админ может удалять шаблоны');
        }
        const db = this.prisma;
        const template = await this.getTemplateById(id);
        if (!template) {
            throw new common_1.NotFoundException('Шаблон не найден');
        }
        return db.documentTemplate.delete({ where: { id } });
    }
};
exports.DocumentTemplateService = DocumentTemplateService;
exports.DocumentTemplateService = DocumentTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentTemplateService);
//# sourceMappingURL=document-template.service.js.map