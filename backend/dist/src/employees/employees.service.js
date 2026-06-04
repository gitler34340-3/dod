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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const employment_contract_service_1 = require("../documents/employment-contract.service");
const achievements_hr_service_1 = require("../achievements-hr/achievements-hr.service");
let EmployeesService = class EmployeesService {
    prisma;
    contractService;
    achievementsService;
    avatarTemplateName = '__PROFILE_AVATAR__';
    async getAvatarMap(employeeIds) {
        const uniqueIds = Array.from(new Set(employeeIds.filter(Boolean)));
        if (uniqueIds.length === 0)
            return new Map();
        const avatarDocs = await this.prisma.employeeDocument.findMany({
            where: {
                employeeId: { in: uniqueIds },
                template: { name: this.avatarTemplateName },
            },
            include: { template: true },
            orderBy: { updatedAt: 'desc' },
        });
        const map = new Map();
        for (const doc of avatarDocs) {
            if (!map.has(doc.employeeId)) {
                map.set(doc.employeeId, {
                    fileUrl: doc.fileUrl,
                    fileName: doc.fileName,
                    notes: doc.notes,
                });
            }
        }
        return map;
    }
    constructor(prisma, contractService, achievementsService) {
        this.prisma = prisma;
        this.contractService = contractService;
        this.achievementsService = achievementsService;
    }
    async create(dto, requesterRole) {
        this.requireCanManageEmployees(requesterRole);
        const employee = await this.prisma.employee.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                hireDate: new Date(dto.hireDate),
                hourlyRate: dto.hourlyRate,
                departmentId: dto.departmentId,
                canPublishStories: dto.canPublishStories ?? false,
            },
            include: { department: true },
        });
        try {
            await this.contractService.createContractForEmployee(employee.id);
        }
        catch (error) {
            console.error('Failed to create employment contract:', error);
        }
        if (dto.passportSeries || dto.passportNumber || dto.passportIssuedBy || dto.passportRegistrationAddress) {
            const db = this.prisma;
            const template = await db.documentTemplate.create({
                data: {
                    name: 'Паспорт',
                    description: 'Паспортные данные сотрудника',
                    department: employee.departmentId ?? undefined,
                    isRequired: false,
                },
            });
            await db.employeeDocument.create({
                data: {
                    employeeId: employee.id,
                    templateId: template.id,
                    status: 'approved',
                    fileName: 'Паспорт',
                    notes: [
                        'Данные сотрудника:',
                        `ФИО: ${employee.lastName} ${employee.firstName}`.trim(),
                        dto.passportSeries ? `Серия: ${dto.passportSeries}` : null,
                        dto.passportNumber ? `Номер: ${dto.passportNumber}` : null,
                        dto.passportIssuedBy ? `Кем выдан: ${dto.passportIssuedBy}` : null,
                        dto.passportIssueDate ? `Дата выдачи: ${dto.passportIssueDate}` : null,
                        dto.passportDivisionCode ? `Код подразделения: ${dto.passportDivisionCode}` : null,
                        dto.passportRegistrationAddress
                            ? `Адрес регистрации: ${dto.passportRegistrationAddress}`
                            : null,
                    ]
                        .filter(Boolean)
                        .join('\n'),
                },
            });
        }
        return employee;
    }
    async findAll(requesterRole) {
        const rows = await this.prisma.employee.findMany({
            include: {
                department: true,
                user: { select: { id: true, email: true, role: true } },
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });
        const avatarMap = await this.getAvatarMap(rows.map((row) => row.id));
        return rows.map((row) => ({
            ...row,
            avatar: avatarMap.get(row.id) ?? null,
        }));
    }
    async findOne(id) {
        const row = await this.prisma.employee.findUniqueOrThrow({
            where: { id },
            include: {
                department: true,
                user: { select: { id: true, email: true, role: true } },
                minHoursQuota: true,
            },
        });
        const avatarMap = await this.getAvatarMap([id]);
        return {
            ...row,
            avatar: avatarMap.get(id) ?? null,
        };
    }
    async update(id, dto, requesterRole) {
        this.requireCanManageEmployees(requesterRole);
        const data = {};
        if (dto.firstName != null)
            data.firstName = dto.firstName;
        if (dto.lastName != null)
            data.lastName = dto.lastName;
        if (dto.email !== undefined)
            data.email = dto.email;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.hireDate != null)
            data.hireDate = new Date(dto.hireDate);
        if (dto.hourlyRate != null)
            data.hourlyRate = dto.hourlyRate;
        if (dto.departmentId !== undefined)
            data.departmentId = dto.departmentId;
        if (dto.canPublishStories !== undefined)
            data.canPublishStories = dto.canPublishStories;
        return this.prisma.employee.update({
            where: { id },
            data,
            include: { department: true },
        });
    }
    async updateMyProfile(employeeId, dto) {
        const data = {};
        if (dto.firstName != null)
            data.firstName = dto.firstName;
        if (dto.lastName != null)
            data.lastName = dto.lastName;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.email !== undefined)
            data.email = dto.email;
        const updated = await this.prisma.employee.update({
            where: { id: employeeId },
            data,
            include: { department: true },
        });
        await this.achievementsService.awardAutomaticForEmployee(employeeId);
        const avatarMap = await this.getAvatarMap([employeeId]);
        return {
            ...updated,
            avatar: avatarMap.get(employeeId) ?? null,
        };
    }
    async updateMyAvatar(employeeId, payload) {
        const template = await this.prisma.documentTemplate.upsert({
            where: { id: this.avatarTemplateName },
            update: {
                name: this.avatarTemplateName,
                description: 'Служебный шаблон аватара профиля',
                isRequired: false,
            },
            create: {
                id: this.avatarTemplateName,
                name: this.avatarTemplateName,
                description: 'Служебный шаблон аватара профиля',
                isRequired: false,
            },
        });
        await this.prisma.employeeDocument.deleteMany({
            where: { employeeId, templateId: template.id },
        });
        const created = await this.prisma.employeeDocument.create({
            data: {
                employeeId,
                templateId: template.id,
                status: 'approved',
                fileName: payload.fileName || 'avatar.png',
                fileUrl: payload.fileUrl,
                notes: JSON.stringify({
                    zoom: payload.zoom ?? 1,
                    offsetX: payload.offsetX ?? 0,
                    offsetY: payload.offsetY ?? 0,
                }),
            },
        });
        return {
            employeeId,
            fileUrl: created.fileUrl,
            fileName: created.fileName,
            notes: created.notes,
        };
    }
    async getEmployeeAvatar(employeeId) {
        const avatarMap = await this.getAvatarMap([employeeId]);
        return avatarMap.get(employeeId) ?? null;
    }
    async remove(id, requesterRole) {
        this.requireCanManageEmployees(requesterRole);
        return this.prisma.employee.delete({ where: { id } });
    }
    async getEmployeeOfMonth() {
        return this.prisma.employeeOfMonth.findFirst({
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            include: {
                employee: {
                    include: {
                        department: true,
                        user: { select: { id: true, email: true, role: true } },
                    },
                },
                selectedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
            },
        });
    }
    async setEmployeeOfMonth(employeeId, payload, requesterRole, selectedByEmployeeId) {
        this.requireCanManageEmployees(requesterRole);
        await this.prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });
        return this.prisma.employeeOfMonth.upsert({
            where: {
                month_year: {
                    month: payload.month,
                    year: payload.year,
                },
            },
            update: {
                employeeId,
                selectedByEmployeeId: selectedByEmployeeId ?? null,
                title: payload.title?.trim() || 'Работник месяца',
                message: payload.message?.trim() || null,
            },
            create: {
                employeeId,
                selectedByEmployeeId: selectedByEmployeeId ?? null,
                month: payload.month,
                year: payload.year,
                title: payload.title?.trim() || 'Работник месяца',
                message: payload.message?.trim() || null,
            },
            include: {
                employee: {
                    include: {
                        department: true,
                        user: { select: { id: true, email: true, role: true } },
                    },
                },
                selectedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                    },
                },
            },
        });
    }
    async terminate(id, dto, requesterRole, performedByUserId) {
        this.requireCanManageEmployees(requesterRole);
        const emp = await this.prisma.employee.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!emp) {
            throw new Error('Employee not found');
        }
        const userId = emp.user?.id ?? null;
        const title = `Увольнение ${emp.firstName} ${emp.lastName}`;
        await this.prisma.$transaction([
            this.prisma.$executeRaw `
        INSERT INTO documents (user_id, title, type, file_url, size, signed, urgent, created_at, content, createdByUserId)
        VALUES (${userId}, ${title}, 'termination', '', '', 0, 0, ${new Date().toISOString()}, ${dto.reason}, ${performedByUserId})
      `,
            this.prisma.employee.delete({ where: { id } }),
        ]);
        return { success: true };
    }
    requireCanManageEmployees(role) {
        if (!['Admin', 'HR', 'Manager'].includes(role)) {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        employment_contract_service_1.EmploymentContractService,
        achievements_hr_service_1.AchievementsHrService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map