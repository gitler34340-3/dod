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
exports.ShiftTemplateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ShiftTemplateService = class ShiftTemplateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    templates = {
        '2/2': {
            name: '2/2 (два дня работы, два дня отдыха)',
            workDays: 2,
            restDays: 2,
            workHoursPerDay: 8,
            shifts: [
                { dayOfWeek: 0, startHour: 8, endHour: 16 },
                { dayOfWeek: 1, startHour: 8, endHour: 16 },
            ],
        },
        '5/2-morning': {
            name: '5/2 утро (5 дней работы 08:00-16:00, 2 дня отдыха)',
            workDays: 5,
            restDays: 2,
            workHoursPerDay: 8,
            shifts: [
                { dayOfWeek: 0, startHour: 8, endHour: 16 },
                { dayOfWeek: 1, startHour: 8, endHour: 16 },
                { dayOfWeek: 2, startHour: 8, endHour: 16 },
                { dayOfWeek: 3, startHour: 8, endHour: 16 },
                { dayOfWeek: 4, startHour: 8, endHour: 16 },
            ],
        },
        '5/2-evening': {
            name: '5/2 вечер (5 дней работы 16:00-00:00, 2 дня отдыха)',
            workDays: 5,
            restDays: 2,
            workHoursPerDay: 8,
            shifts: [
                { dayOfWeek: 0, startHour: 16, endHour: 0 },
                { dayOfWeek: 1, startHour: 16, endHour: 0 },
                { dayOfWeek: 2, startHour: 16, endHour: 0 },
                { dayOfWeek: 3, startHour: 16, endHour: 0 },
                { dayOfWeek: 4, startHour: 16, endHour: 0 },
            ],
        },
    };
    getAvailableTemplates() {
        return Object.entries(this.templates).map(([key, value]) => ({
            id: key,
            ...value,
        }));
    }
    async saveTemplate(departmentId, managerId, name, pattern, userRole) {
        if (userRole !== 'Manager' && userRole !== 'Admin' && userRole !== 'HR') {
            throw new common_1.ForbiddenException('Недостаточно прав для создания шаблона');
        }
        return this.prisma.shiftTemplate.create({
            data: {
                name,
                pattern,
                departmentId,
                managerId,
                description: `Custom template: ${name}`,
            },
        });
    }
    async getTemplatesForDepartment(departmentId) {
        return this.prisma.shiftTemplate.findMany({
            where: { departmentId },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }
    async applyTemplateToMonth(departmentId, managerId, templateId, year, month, userRole) {
        if (userRole !== 'Manager' && userRole !== 'Admin' && userRole !== 'HR') {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
        const template = this.templates[templateId];
        if (!template) {
            throw new common_1.BadRequestException('Шаблон не найден');
        }
        const manager = await this.prisma.employee.findUniqueOrThrow({
            where: { id: managerId },
        });
        if (manager.departmentId !== departmentId) {
            throw new common_1.ForbiddenException('Менеджер не принадлежит этому отделу');
        }
        const shiftsToCreate = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const shiftData = template.shifts.find((s) => s.dayOfWeek === dayOfWeek);
            if (shiftData) {
                const startTime = new Date(year, month, day, shiftData.startHour, 0, 0);
                let endTime = new Date(year, month, day, shiftData.endHour, 0, 0);
                if (shiftData.endHour < shiftData.startHour) {
                    endTime = new Date(year, month, day + 1, shiftData.endHour, 0, 0);
                }
                shiftsToCreate.push({
                    employeeId: managerId,
                    departmentId,
                    startTime,
                    endTime,
                    role: 'Manager',
                    status: 'Confirmed',
                    type: 'Mandatory',
                    canDecline: false,
                    createdBy: managerId,
                });
            }
        }
        const result = await this.prisma.shift.createMany({
            data: shiftsToCreate,
        });
        return {
            message: 'Шаблон успешно применен к месяцу',
            shiftsCreated: result.count,
        };
    }
};
exports.ShiftTemplateService = ShiftTemplateService;
exports.ShiftTemplateService = ShiftTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftTemplateService);
//# sourceMappingURL=shift-template.service.js.map