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
exports.ShiftPreferencesManagementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ShiftPreferencesManagementService = class ShiftPreferencesManagementService {
    prisma;
    SUBMISSION_DEADLINE_DAY = 5;
    SUBMISSION_DEADLINE_HOUR = 18;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getSubmissionDeadline(weekStartDate) {
        const deadline = new Date(weekStartDate);
        const daysUntilFriday = (5 - deadline.getDay() + 7) % 7;
        deadline.setDate(deadline.getDate() + daysUntilFriday);
        deadline.setHours(this.SUBMISSION_DEADLINE_HOUR, 0, 0, 0);
        return deadline;
    }
    isSubmissionOpen(weekStartDate) {
        const deadline = this.getSubmissionDeadline(weekStartDate);
        const now = new Date();
        return now < deadline;
    }
    async submitWeeklyPreferences(employeeId, dto) {
        const weekStart = new Date(dto.weekStartDate);
        const deadline = this.getSubmissionDeadline(weekStart);
        const now = new Date();
        if (now > deadline) {
            throw new common_1.BadRequestException(`Дедлайн для подачи пожеланий на неделю ${dto.weekStartDate} прошел (${deadline.toLocaleString()})`);
        }
        const existingPreferences = await this.prisma.shiftPreference.findFirst({
            where: {
                workerId: employeeId,
                requestedDates: {
                    contains: dto.weekStartDate,
                },
            },
        });
        if (existingPreferences) {
            throw new common_1.BadRequestException('Вы уже подали пожелания на эту неделю');
        }
        const totalHours = dto.timeSlots.reduce((sum, slot) => sum + (slot.estimatedHours || 0), 0);
        if (totalHours > 60) {
            throw new common_1.BadRequestException(`Вы подали пожелания на ${totalHours} часов, что превышает максимум (60 часов/неделю)`);
        }
        return this.prisma.shiftPreference.create({
            data: {
                workerId: employeeId,
                requestedDates: JSON.stringify(dto.timeSlots),
                shiftType: dto.timeSlots.length > 0 ? 'Flexible' : 'Morning',
                status: 'Pending',
            },
        });
    }
    async getPreferencesForShift(shiftId, departmentId, userRole) {
        if (userRole !== client_1.Role.Admin && userRole !== client_1.Role.HR) {
            throw new common_1.ForbiddenException('Только админ и HR могут видеть пожелания');
        }
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
            include: { department: true },
        });
        const allPreferences = await this.prisma.shiftPreference.findMany({
            where: {
                worker: {
                    departmentId: shift.departmentId,
                },
                status: 'Pending',
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        hourlyRate: true,
                    },
                },
            },
        });
        const matchingPreferences = [];
        for (const pref of allPreferences) {
            const timeSlots = JSON.parse(pref.requestedDates);
            const shiftDayOfWeek = shift.startTime.getDay();
            const matchingSlots = timeSlots.filter(slot => slot.dayOfWeek === shiftDayOfWeek);
            if (matchingSlots.length > 0) {
                const kpi = await this.getEmployeeKpi(pref.workerId);
                matchingPreferences.push({
                    id: pref.id,
                    workerId: pref.workerId,
                    workerName: `${pref.worker.firstName} ${pref.worker.lastName}`,
                    timeSlots: matchingSlots,
                    totalHours: matchingSlots.reduce((sum, slot) => sum + (slot.estimatedHours || 0), 0),
                    status: pref.status.toLowerCase(),
                    createdAt: pref.createdAt.toISOString(),
                    weekStartDate: pref.requestedDates.substring(0, 10),
                    employeeKpi: kpi,
                });
            }
        }
        return matchingPreferences;
    }
    async getEmployeeKpi(employeeId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                payrollItems: {
                    where: {
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        },
                    },
                },
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        },
                    },
                },
            },
        });
        const totalHoursThisMonth = employee?.payrollItems.reduce((sum, item) => sum + (item.total / employee.hourlyRate), 0) || 0;
        const absences = employee?.attendances.filter(a => a.status === 'absent').length || 0;
        const totalDaysWorked = employee?.attendances.length || 1;
        const absenceRate = (absences / totalDaysWorked) * 100;
        return {
            totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
            absenceRate: Math.round(absenceRate * 10) / 10,
            performanceScore: 100 - absenceRate,
        };
    }
    getOvertimeWarnings(preferences) {
        const warnings = new Map();
        for (const pref of preferences) {
            if (pref.employeeKpi && pref.employeeKpi.totalHoursThisMonth > 40) {
                warnings.set(pref.workerId, `⚠️ Уже работает ${pref.employeeKpi.totalHoursThisMonth}ч. Риск переработки`);
            }
        }
        return warnings;
    }
    async approvePreference(preferenceId, userRole) {
        if (userRole !== client_1.Role.Admin && userRole !== client_1.Role.HR) {
            throw new common_1.ForbiddenException('Только админ и HR могут одобрять пожелания');
        }
        return this.prisma.shiftPreference.update({
            where: { id: preferenceId },
            data: { status: 'Approved' },
        });
    }
    async rejectPreference(preferenceId, userRole, reason) {
        if (userRole !== client_1.Role.Admin && userRole !== client_1.Role.HR) {
            throw new common_1.ForbiddenException('Только админ и HR могут отклонять пожелания');
        }
        return this.prisma.shiftPreference.update({
            where: { id: preferenceId },
            data: { status: 'Rejected' },
        });
    }
    async getWeeklyPreferencesOverview(weekStartDate, departmentId, userRole) {
        if (userRole !== client_1.Role.Admin && userRole !== client_1.Role.HR) {
            throw new common_1.ForbiddenException('Только админ и HR могут видеть пожелания');
        }
        const preferences = await this.prisma.shiftPreference.findMany({
            where: {
                requestedDates: {
                    contains: weekStartDate,
                },
                worker: departmentId
                    ? {
                        departmentId,
                    }
                    : undefined,
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        departmentId: true,
                    },
                },
            },
        });
        const grouped = {};
        for (const pref of preferences) {
            const timeSlots = JSON.parse(pref.requestedDates);
            for (const slot of timeSlots) {
                const dayKey = `day_${slot.dayOfWeek}`;
                const shiftKey = slot.shiftType;
                if (!grouped[dayKey]) {
                    grouped[dayKey] = {};
                }
                if (!grouped[dayKey][shiftKey]) {
                    grouped[dayKey][shiftKey] = [];
                }
                grouped[dayKey][shiftKey].push({
                    preferenceId: pref.id,
                    workerId: pref.workerId,
                    workerName: `${pref.worker.firstName} ${pref.worker.lastName}`,
                    status: pref.status,
                    hours: slot.estimatedHours || 0,
                });
            }
        }
        return grouped;
    }
    async findScheduleGaps(weekStartDate, requiredShifts, departmentId) {
        const overview = await this.getWeeklyPreferencesOverview(weekStartDate, departmentId, client_1.Role.Admin);
        const gaps = [];
        for (const required of requiredShifts) {
            const dayKey = `day_${required.dayOfWeek}`;
            const available = overview[dayKey]?.[required.shiftType]?.length || 0;
            const gap = Math.max(0, required.requiredCount - available);
            if (gap > 0) {
                gaps.push({
                    day: required.dayOfWeek,
                    shift: required.shiftType,
                    required: required.requiredCount,
                    available,
                    gap,
                });
            }
        }
        return gaps;
    }
};
exports.ShiftPreferencesManagementService = ShiftPreferencesManagementService;
exports.ShiftPreferencesManagementService = ShiftPreferencesManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftPreferencesManagementService);
//# sourceMappingURL=shift-preferences-management.service.js.map