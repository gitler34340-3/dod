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
var ShiftsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const salary_calculation_service_1 = require("../payroll/salary-calculation.service");
const admin_notifications_service_1 = require("../notifications/admin-notifications.service");
let ShiftsService = class ShiftsService {
    static { ShiftsService_1 = this; }
    prisma;
    salaryCalculationService;
    adminNotifications;
    static EXCHANGE_DECLINED_MARKER = '[exchange_declined]';
    constructor(prisma, salaryCalculationService, adminNotifications) {
        this.prisma = prisma;
        this.salaryCalculationService = salaryCalculationService;
        this.adminNotifications = adminNotifications;
    }
    async createShift(dto, userId, userRole, userEmployeeId) {
        let departmentId;
        let employeeId = dto.employeeId;
        if (dto.employeeId) {
            const employee = await this.prisma.employee.findUniqueOrThrow({
                where: { id: dto.employeeId },
                select: { departmentId: true },
            });
            if (!employee.departmentId) {
                if (userEmployeeId) {
                    const currentUser = await this.prisma.employee.findUniqueOrThrow({
                        where: { id: userEmployeeId },
                        select: { departmentId: true },
                    });
                    departmentId = currentUser.departmentId || (await this.getFirstDepartmentId());
                }
                else {
                    departmentId = await this.getFirstDepartmentId();
                }
            }
            else {
                departmentId = employee.departmentId;
            }
        }
        else if (dto.departmentId) {
            departmentId = dto.departmentId;
        }
        else if (userEmployeeId) {
            const employee = await this.prisma.employee.findUniqueOrThrow({
                where: { id: userEmployeeId },
                select: { departmentId: true },
            });
            if (!employee.departmentId) {
                departmentId = await this.getFirstDepartmentId();
            }
            else {
                departmentId = employee.departmentId;
            }
            if (userRole === 'Employee') {
                employeeId = userEmployeeId;
            }
        }
        else if (userRole === 'HR' || userRole === 'Admin') {
            departmentId = await this.getFirstDepartmentId();
        }
        else {
            throw new common_1.BadRequestException('Не удалось определить отдел для смены. Укажите departmentId.');
        }
        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);
        if (endTime <= startTime) {
            throw new common_1.BadRequestException('Время окончания должно быть позже времени начала');
        }
        let status = client_1.ShiftStatus.Pending;
        let type = client_1.ShiftType.Optional;
        if (userRole === 'HR' || userRole === 'Admin') {
            type = dto.type || client_1.ShiftType.Mandatory;
            status = (type === client_1.ShiftType.Mandatory) ? client_1.ShiftStatus.Confirmed : client_1.ShiftStatus.Pending;
        }
        else if (userRole === 'Employee') {
            status = client_1.ShiftStatus.Pending;
            type = client_1.ShiftType.Requested;
        }
        const createdShift = await this.prisma.shift.create({
            data: {
                employeeId,
                departmentId,
                startTime,
                endTime,
                role: dto.role,
                status,
                type,
                canDecline: (userRole === 'HR' || userRole === 'Admin') ? (dto.canDecline ?? true) : true,
                createdBy: userId,
                comment: dto.comment,
                maxParticipants: dto.maxParticipants,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
        this.adminNotifications.emitOrderCreated({
            id: createdShift.id,
            source: 'shift.request',
            createdAt: createdShift.createdAt.toISOString(),
        });
        return createdShift;
    }
    async getShifts(filters) {
        const where = {};
        if (filters.employeeId)
            where.employeeId = filters.employeeId;
        if (filters.departmentId)
            where.departmentId = filters.departmentId;
        if (filters.status)
            where.status = filters.status;
        if (filters.startDate || filters.endDate) {
            where.startTime = {};
            if (filters.startDate)
                where.startTime.gte = filters.startDate;
            if (filters.endDate)
                where.startTime.lte = filters.endDate;
        }
        return this.prisma.shift.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
            orderBy: { startTime: 'asc' },
        });
    }
    async getEmployeeWithDepartment(employeeId) {
        return this.prisma.employee.findUniqueOrThrow({
            where: { id: employeeId },
            select: { id: true, departmentId: true },
        });
    }
    async getShiftById(shiftId) {
        return this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
    }
    async getShiftsForEmployee(employeeId, departmentId, filters) {
        const currentUser = await this.prisma.user.findFirst({
            where: { employeeId },
            select: { id: true },
        });
        const employeeShifts = await this.prisma.shift.findMany({
            where: { employeeId },
        });
        const employeeShiftTimes = employeeShifts.map(s => ({
            start: s.startTime.toISOString(),
            end: s.endTime.toISOString(),
        }));
        let openShifts = await this.prisma.shift.findMany({
            where: {
                employeeId: null,
                OR: [
                    {
                        ...(departmentId ? { departmentId } : {}),
                        exchangeTargetEmployeeId: null,
                    },
                    { exchangeTargetEmployeeId: employeeId },
                ],
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
        openShifts = openShifts.filter(openShift => {
            return !employeeShiftTimes.some(time => time.start === openShift.startTime.toISOString() &&
                time.end === openShift.endTime.toISOString());
        });
        let ownShifts = await this.prisma.shift.findMany({
            where: {
                OR: [
                    { employeeId },
                    ...(currentUser?.id ? [{ createdBy: currentUser.id, type: client_1.ShiftType.Requested }] : []),
                ],
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
        if (filters.status) {
            ownShifts = ownShifts.filter(s => s.status === filters.status);
            openShifts = openShifts.filter(s => s.status === filters.status);
        }
        const allShifts = [...ownShifts, ...openShifts].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        return allShifts;
    }
    async updateShiftStatus(shiftId, newStatus, userId, userRole) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
            include: { department: true },
        });
        if (userRole === 'Employee') {
            if (shift.employeeId !== userId) {
                throw new common_1.ForbiddenException('Вы не можете изменить статус чужой смены');
            }
            if (shift.status !== client_1.ShiftStatus.Pending) {
                throw new common_1.ForbiddenException('Смену можно изменить только в статусе "На рассмотрении"');
            }
            if (shift.type === client_1.ShiftType.Requested) {
                throw new common_1.ForbiddenException('Вы не можете утверждать собственную предложенную смену. Одобрение смены может сделать только администратор');
            }
        }
        else if (userRole === 'HR' || userRole === 'Admin') {
        }
        else {
            throw new common_1.ForbiddenException('У вас нет прав для изменения статуса смены');
        }
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: { status: newStatus },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async declineShift(shiftId, employeeId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
        if (shift.employeeId !== employeeId) {
            throw new common_1.ForbiddenException('Вы не можете отклонить чужую смену');
        }
        if (!shift.canDecline) {
            throw new common_1.BadRequestException('Эта смена обязательна и не может быть отклонена');
        }
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: { status: client_1.ShiftStatus.Rejected },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async acceptShift(shiftId, employeeId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
        if (shift.type === client_1.ShiftType.Requested) {
            throw new common_1.ForbiddenException('Для обмена используйте отдельный метод /shifts/:id/exchange-accept');
        }
        if (shift.employeeId !== null) {
            throw new common_1.BadRequestException('Эта смена уже назначена');
        }
        if (shift.maxParticipants && shift.currentParticipants >= shift.maxParticipants) {
            throw new common_1.BadRequestException('Все места заняты');
        }
        const existingAcceptance = await this.prisma.shift.findFirst({
            where: {
                id: shiftId,
                employeeId,
            },
        });
        if (existingAcceptance) {
            throw new common_1.BadRequestException('Вы уже приняли эту смену');
        }
        const conflictingShift = await this.prisma.shift.findFirst({
            where: {
                employeeId,
                status: { in: [client_1.ShiftStatus.Confirmed, client_1.ShiftStatus.Pending] },
                OR: [
                    { startTime: { lte: shift.startTime }, endTime: { gt: shift.startTime } },
                    { startTime: { lt: shift.endTime }, endTime: { gte: shift.endTime } },
                    { startTime: { gte: shift.startTime }, endTime: { lte: shift.endTime } },
                ],
            },
        });
        if (conflictingShift) {
            throw new common_1.BadRequestException('У вас уже есть смена в это время. Разрешены только непересекающиеся смены.');
        }
        const newShift = await this.prisma.shift.create({
            data: {
                employeeId,
                departmentId: shift.departmentId,
                startTime: shift.startTime,
                endTime: shift.endTime,
                role: shift.role,
                status: client_1.ShiftStatus.Confirmed,
                type: shift.type,
                canDecline: shift.canDecline,
                createdBy: shift.createdBy,
                comment: shift.comment,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
        await this.prisma.shift.update({
            where: { id: shiftId },
            data: { currentParticipants: { increment: 1 } },
        });
        if (shift.maxParticipants && shift.currentParticipants + 1 >= shift.maxParticipants) {
            await this.prisma.shift.delete({
                where: { id: shiftId },
            });
        }
        return newShift;
    }
    async requestExchange(shiftId, userId, userEmployeeId, targetEmployeeId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });
        if (shift.employeeId !== userEmployeeId) {
            throw new common_1.ForbiddenException('Вы можете обменять только свою смену');
        }
        if (shift.status !== client_1.ShiftStatus.Confirmed) {
            throw new common_1.BadRequestException('Для обмена должна быть подтвержденная смена');
        }
        if (!targetEmployeeId) {
            throw new common_1.BadRequestException('Выберите сотрудника, которому хотите предложить смену');
        }
        if (targetEmployeeId === userEmployeeId) {
            throw new common_1.BadRequestException('Нельзя предложить обмен самому себе');
        }
        await this.prisma.employee.findUniqueOrThrow({ where: { id: targetEmployeeId } });
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: {
                employeeId: null,
                exchangeTargetEmployeeId: targetEmployeeId,
                status: client_1.ShiftStatus.Pending,
                type: client_1.ShiftType.Requested,
                createdBy: userId,
                comment: this.stripExchangeDeclinedMarker(shift.comment),
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async acceptExchange(shiftId, employeeId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });
        if (shift.type !== client_1.ShiftType.Requested || shift.status !== client_1.ShiftStatus.Pending || shift.employeeId !== null) {
            throw new common_1.BadRequestException('Эта смена не доступна для обмена');
        }
        if (!shift.createdBy) {
            throw new common_1.BadRequestException('Невозможно принять эту смену');
        }
        const requestorUser = await this.prisma.user.findUnique({
            where: { id: shift.createdBy },
            select: { employeeId: true },
        });
        if (requestorUser?.employeeId && requestorUser.employeeId === employeeId) {
            throw new common_1.ForbiddenException('Вы не можете принять собственную предложенную смену');
        }
        if (shift.exchangeTargetEmployeeId && shift.exchangeTargetEmployeeId !== employeeId) {
            throw new common_1.ForbiddenException('Эта смена предложена другому сотруднику');
        }
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: {
                employeeId,
                exchangeTargetEmployeeId: null,
                status: client_1.ShiftStatus.Confirmed,
                type: client_1.ShiftType.Mandatory,
                comment: this.stripExchangeDeclinedMarker(shift.comment),
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async declineExchange(shiftId, employeeId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });
        if (shift.type !== client_1.ShiftType.Requested || shift.status !== client_1.ShiftStatus.Pending || shift.employeeId !== null) {
            throw new common_1.BadRequestException('Эта смена не ожидает решения по обмену');
        }
        if (shift.exchangeTargetEmployeeId !== employeeId) {
            throw new common_1.ForbiddenException('Вы не можете отклонить чужой запрос на обмен');
        }
        if (!shift.createdBy) {
            throw new common_1.BadRequestException('Не удалось определить инициатора обмена');
        }
        const requestorUser = await this.prisma.user.findUnique({
            where: { id: shift.createdBy },
            select: { employeeId: true },
        });
        if (!requestorUser?.employeeId) {
            throw new common_1.BadRequestException('Не удалось вернуть смену исходному сотруднику');
        }
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: {
                employeeId: requestorUser.employeeId,
                exchangeTargetEmployeeId: null,
                status: client_1.ShiftStatus.Confirmed,
                type: client_1.ShiftType.Mandatory,
                comment: this.appendExchangeDeclinedMarker(shift.comment),
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async getAcceptedExchanges(requestorId) {
        return this.prisma.shift.findMany({
            where: {
                createdBy: requestorId,
                status: client_1.ShiftStatus.Confirmed,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async approveShift(shiftId, adminId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
        if (shift.type !== client_1.ShiftType.Requested) {
            throw new common_1.BadRequestException('Можно одобрить только смены типа "Запрос"');
        }
        if (shift.status === client_1.ShiftStatus.Confirmed) {
            throw new common_1.BadRequestException('Эта смена уже одобрена');
        }
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: {
                status: client_1.ShiftStatus.Confirmed,
                type: client_1.ShiftType.Mandatory,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async createPayrollDraftFromShift(shiftId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
        if (shift.status !== client_1.ShiftStatus.Confirmed) {
            throw new common_1.BadRequestException('Только подтверждённая смена может переводиться в расчет зарплаты');
        }
        if (!shift.employeeId) {
            throw new common_1.BadRequestException('Смена должна быть назначена сотруднику для расчета зарплаты');
        }
        if (shift.endTime > new Date()) {
            throw new common_1.BadRequestException('Зарплата формируется только за прошедшие смены');
        }
        const existing = await this.prisma.payrollItem.findFirst({
            where: {
                employeeId: shift.employeeId,
                periodStart: shift.startTime,
                periodEnd: shift.endTime,
            },
        });
        if (existing) {
            return existing;
        }
        return this.salaryCalculationService.createPayrollItem(shift.employeeId, shift.startTime, shift.endTime);
    }
    async rejectShift(shiftId, adminId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
        if (shift.type !== client_1.ShiftType.Requested) {
            throw new common_1.BadRequestException('Можно отклонить только смены типа "Запрос"');
        }
        if (shift.status === client_1.ShiftStatus.Rejected) {
            throw new common_1.BadRequestException('Эта смена уже отклонена');
        }
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: { status: client_1.ShiftStatus.Rejected },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    getAvailableRoles() {
        return Object.values(client_1.EmployeeRole);
    }
    async getFirstDepartmentId() {
        const dept = await this.prisma.department.findFirst({
            select: { id: true },
        });
        if (!dept) {
            throw new common_1.BadRequestException('В системе нет ни одного отдела');
        }
        return dept.id;
    }
    async updateShift(shiftId, dto, userRole, userEmployeeId) {
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
            include: { employee: true },
        });
        if (dto.startTime && dto.endTime) {
            const startTime = new Date(dto.startTime);
            const endTime = new Date(dto.endTime);
            if (endTime <= startTime) {
                throw new common_1.BadRequestException('Время окончания должно быть позже времени начала');
            }
        }
        const updateData = {};
        if (dto.status)
            updateData.status = dto.status;
        if (dto.role)
            updateData.role = dto.role;
        if (dto.startTime)
            updateData.startTime = new Date(dto.startTime);
        if (dto.endTime)
            updateData.endTime = new Date(dto.endTime);
        if (dto.type)
            updateData.type = dto.type;
        if (typeof dto.canDecline === 'boolean')
            updateData.canDecline = dto.canDecline;
        if (dto.comment !== undefined)
            updateData.comment = dto.comment;
        if (dto.maxParticipants)
            updateData.maxParticipants = dto.maxParticipants;
        return this.prisma.shift.update({
            where: { id: shiftId },
            data: updateData,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async deleteShift(shiftId, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Удалять смены может только администратор или HR');
        }
        const shift = await this.prisma.shift.findUniqueOrThrow({
            where: { id: shiftId },
        });
        return this.prisma.shift.delete({
            where: { id: shiftId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    stripExchangeDeclinedMarker(comment) {
        return (comment || '')
            .replace(ShiftsService_1.EXCHANGE_DECLINED_MARKER, '')
            .trim() || null;
    }
    appendExchangeDeclinedMarker(comment) {
        const cleaned = this.stripExchangeDeclinedMarker(comment);
        return [cleaned, ShiftsService_1.EXCHANGE_DECLINED_MARKER].filter(Boolean).join('\n');
    }
    async publishScheduleFromPreferences(weekStart, adminId) {
        const weekStartDate = new Date(weekStart);
        const approvedPreferences = await this.prisma.shiftPreference.findMany({
            where: {
                requestedDates: {
                    contains: weekStart,
                },
                status: 'Approved',
            },
            include: {
                worker: {
                    select: { id: true, firstName: true, lastName: true, departmentId: true },
                },
            },
        });
        if (approvedPreferences.length === 0) {
            throw new common_1.BadRequestException('Нет одобренных пожеланий для публикации');
        }
        const createdShifts = [];
        for (const pref of approvedPreferences) {
            const timeSlots = JSON.parse(pref.requestedDates);
            for (const slot of timeSlots) {
                const shiftDate = new Date(weekStartDate);
                shiftDate.setDate(shiftDate.getDate() + slot.dayOfWeek);
                let startHour = 6;
                let endHour = 14;
                if (slot.shiftType === 'day') {
                    startHour = 14;
                    endHour = 22;
                }
                else if (slot.shiftType === 'evening') {
                    startHour = 22;
                    endHour = 6;
                }
                else if (slot.shiftType === 'night') {
                    startHour = 0;
                    endHour = 8;
                }
                const startTime = new Date(shiftDate);
                startTime.setHours(startHour, 0, 0, 0);
                const endTime = new Date(shiftDate);
                if (endHour < startHour) {
                    endTime.setDate(endTime.getDate() + 1);
                }
                endTime.setHours(endHour, 0, 0, 0);
                const shift = await this.prisma.shift.create({
                    data: {
                        employeeId: pref.workerId,
                        departmentId: pref.worker.departmentId || (await this.getFirstDepartmentId()),
                        startTime,
                        endTime,
                        status: client_1.ShiftStatus.Confirmed,
                        type: client_1.ShiftType.Optional,
                        role: client_1.EmployeeRole.Cashier,
                        createdBy: adminId,
                    },
                });
                createdShifts.push(shift);
            }
        }
        return {
            message: `✓ График опубликован! Создано ${createdShifts.length} смен`,
            shiftsCreated: createdShifts.length,
            weekStart: weekStart,
        };
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = ShiftsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        salary_calculation_service_1.SalaryCalculationService,
        admin_notifications_service_1.AdminNotificationsService])
], ShiftsService);
//# sourceMappingURL=shifts.service.js.map