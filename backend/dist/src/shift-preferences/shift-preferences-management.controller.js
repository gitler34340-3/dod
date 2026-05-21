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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftPreferencesManagementController = void 0;
const common_1 = require("@nestjs/common");
const shift_preferences_management_service_1 = require("./shift-preferences-management.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const shift_preference_time_slot_dto_1 = require("./dto/shift-preference-time-slot.dto");
let ShiftPreferencesManagementController = class ShiftPreferencesManagementController {
    service;
    constructor(service) {
        this.service = service;
    }
    getDeadline(weekStart) {
        const weekStartDate = weekStart ? new Date(weekStart) : this.getNextMonday();
        const deadline = this.service.getSubmissionDeadline(weekStartDate);
        const isOpen = this.service.isSubmissionOpen(weekStartDate);
        return {
            weekStartDate: weekStartDate.toISOString().split('T')[0],
            deadline: deadline.toISOString(),
            isOpen,
            daysUntilDeadline: this.getDaysUntil(deadline),
        };
    }
    async submitPreferences(user, dto) {
        if (!user.employeeId) {
            throw new common_1.ForbiddenException('Вы не привязаны к сотруднику');
        }
        if (user.role !== client_1.Role.Employee) {
            throw new common_1.ForbiddenException('Только рабочие могут подавать пожелания');
        }
        const result = await this.service.submitWeeklyPreferences(user.employeeId, dto);
        return {
            message: 'Пожелания отправлены на рассмотрение',
            preferenceId: result.id,
        };
    }
    async getShiftApplicants(user, shiftId, departmentId) {
        const applicants = await this.service.getPreferencesForShift(shiftId, departmentId || 'default', user.role);
        const overtimeWarnings = this.service.getOvertimeWarnings(applicants);
        const applicantsWithWarnings = applicants.map(app => ({
            ...app,
            overtimeWarning: overtimeWarnings.get(app.workerId),
        }));
        return {
            shift: shiftId,
            applicants: applicantsWithWarnings,
            totalApplicants: applicants.length,
        };
    }
    async getWeeklyOverview(user, weekStart, departmentId) {
        if (!weekStart) {
            throw new common_1.BadRequestException('weekStart обязателен');
        }
        const overview = await this.service.getWeeklyPreferencesOverview(weekStart, departmentId, user.role);
        return {
            weekStart,
            overview,
        };
    }
    async findGaps(user, weekStart, departmentId, requiredShifts) {
        if (!weekStart || !departmentId) {
            throw new common_1.BadRequestException('weekStart и departmentId обязательны');
        }
        const defaultRequiredShifts = [
            { dayOfWeek: 0, shiftType: 'morning', requiredCount: 2 },
            { dayOfWeek: 0, shiftType: 'day', requiredCount: 2 },
            { dayOfWeek: 0, shiftType: 'evening', requiredCount: 2 },
        ];
        const gaps = await this.service.findScheduleGaps(weekStart, requiredShifts || defaultRequiredShifts, departmentId);
        return {
            weekStart,
            departmentId,
            gaps,
            hasGaps: gaps.length > 0,
        };
    }
    async approvePreference(user, preferenceId) {
        await this.service.approvePreference(preferenceId, user.role);
        return {
            message: 'Пожелание одобрено',
            preferenceId,
        };
    }
    async rejectPreference(user, preferenceId, reason) {
        await this.service.rejectPreference(preferenceId, user.role, reason);
        return {
            message: 'Пожелание отклонено',
            preferenceId,
            reason,
        };
    }
    getNextMonday() {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    }
    getDaysUntil(date) {
        const now = new Date();
        const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    }
};
exports.ShiftPreferencesManagementController = ShiftPreferencesManagementController;
__decorate([
    (0, common_1.Get)('deadline'),
    __param(0, (0, common_1.Query)('weekStart')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftPreferencesManagementController.prototype, "getDeadline", null);
__decorate([
    (0, common_1.Post)('submit-preferences'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shift_preference_time_slot_dto_1.SubmitShiftPreferencesDto]),
    __metadata("design:returntype", Promise)
], ShiftPreferencesManagementController.prototype, "submitPreferences", null);
__decorate([
    (0, common_1.Get)('shift/:shiftId/applicants'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shiftId')),
    __param(2, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ShiftPreferencesManagementController.prototype, "getShiftApplicants", null);
__decorate([
    (0, common_1.Get)('week-overview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('weekStart')),
    __param(2, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ShiftPreferencesManagementController.prototype, "getWeeklyOverview", null);
__decorate([
    (0, common_1.Get)('gaps'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('weekStart')),
    __param(2, (0, common_1.Query)('departmentId')),
    __param(3, (0, common_1.Body)('requiredShifts')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Array]),
    __metadata("design:returntype", Promise)
], ShiftPreferencesManagementController.prototype, "findGaps", null);
__decorate([
    (0, common_1.Patch)(':preferenceId/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('preferenceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ShiftPreferencesManagementController.prototype, "approvePreference", null);
__decorate([
    (0, common_1.Patch)(':preferenceId/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('preferenceId')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ShiftPreferencesManagementController.prototype, "rejectPreference", null);
exports.ShiftPreferencesManagementController = ShiftPreferencesManagementController = __decorate([
    (0, common_1.Controller)('shift-preferences-management'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [shift_preferences_management_service_1.ShiftPreferencesManagementService])
], ShiftPreferencesManagementController);
//# sourceMappingURL=shift-preferences-management.controller.js.map