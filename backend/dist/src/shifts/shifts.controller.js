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
exports.ShiftsController = void 0;
const common_1 = require("@nestjs/common");
const shifts_service_1 = require("./shifts.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const create_shift_dto_1 = require("./dto/create-shift.dto");
const update_shift_dto_1 = require("./dto/update-shift.dto");
let ShiftsController = class ShiftsController {
    shiftsService;
    constructor(shiftsService) {
        this.shiftsService = shiftsService;
    }
    async list(user, employeeId, status) {
        if (user.role === 'Employee') {
            if (!user.employee?.id) {
                return this.shiftsService.getShifts({ employeeId: undefined, status: status });
            }
            const employee = await this.shiftsService.getEmployeeWithDepartment(user.employee.id);
            const departmentId = employee.departmentId;
            return this.shiftsService.getShiftsForEmployee(user.employee.id, departmentId, {
                status: status,
            });
        }
        if (user.role === 'Admin' || user.role === 'HR') {
            return this.shiftsService.getShifts({
                employeeId: employeeId || undefined,
                status: status,
            });
        }
        throw new common_1.ForbiddenException('Нет доступа к сменам');
    }
    async create(user, dto) {
        if (user.role === 'Employee' && !user.employee?.id) {
            throw new common_1.ForbiddenException('Не удалось определить сотрудника');
        }
        return this.shiftsService.createShift(dto, user.id, user.role, user.employee?.id);
    }
    async updateStatus(id, dto, user) {
        if (!dto.status) {
            throw new common_1.ForbiddenException('Статус должен быть указан');
        }
        if (user.role === 'Employee') {
            if (!user.employee?.id) {
                throw new common_1.ForbiddenException('Не удалось определить сотрудника');
            }
            const shift = await this.shiftsService.getShiftById(id);
            if (shift.employeeId !== user.employee.id) {
                throw new common_1.ForbiddenException('Вы не можете изменить статус чужой смены');
            }
            if (shift.status !== 'Pending') {
                throw new common_1.ForbiddenException('Смену можно изменить только в статусе "На рассмотрении"');
            }
            return this.shiftsService.updateShiftStatus(id, dto.status, user.employee.id, user.role);
        }
        if (user.role === 'HR' || user.role === 'Admin') {
            return this.shiftsService.updateShiftStatus(id, dto.status, '', user.role);
        }
        throw new common_1.ForbiddenException('У вас нет прав для изменения статуса смены');
    }
    async approveShift(id, user) {
        if (user.role !== 'Admin' && user.role !== 'HR') {
            throw new common_1.ForbiddenException('Только администратор может одобрять предложенные смены');
        }
        return this.shiftsService.approveShift(id, user.id);
    }
    async rejectShift(id, user) {
        if (user.role !== 'Admin' && user.role !== 'HR') {
            throw new common_1.ForbiddenException('Только администратор может отклонять предложенные смены');
        }
        return this.shiftsService.rejectShift(id, user.id);
    }
    async requestExchange(id, dto, user) {
        if (user.role !== 'Employee') {
            throw new common_1.ForbiddenException('Только сотрудник может предложить обмен');
        }
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Не удалось определить сотрудника');
        }
        return this.shiftsService.requestExchange(id, user.id, user.employee.id, dto.targetEmployeeId);
    }
    async acceptExchange(id, user) {
        if (user.role !== 'Employee') {
            throw new common_1.ForbiddenException('Только сотрудник может принять обмен');
        }
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Не удалось определить сотрудника');
        }
        return this.shiftsService.acceptExchange(id, user.employee.id);
    }
    async declineExchange(id, user) {
        if (user.role !== 'Employee') {
            throw new common_1.ForbiddenException('Только сотрудник может отклонить обмен');
        }
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Не удалось определить сотрудника');
        }
        return this.shiftsService.declineExchange(id, user.employee.id);
    }
    async getAcceptedExchanges(user) {
        if (!user.id) {
            throw new common_1.ForbiddenException('Не удалось определить пользователя');
        }
        return this.shiftsService.getAcceptedExchanges(user.id);
    }
    async declineShift(id, user) {
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Не удалось определить сотрудника');
        }
        return this.shiftsService.declineShift(id, user.employee.id);
    }
    async acceptShift(id, user) {
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Не удалось определить сотрудника');
        }
        return this.shiftsService.acceptShift(id, user.employee.id);
    }
    async updateShift(id, dto, user) {
        return this.shiftsService.updateShift(id, dto, user.role, user.employee?.id);
    }
    async deleteShift(id, user) {
        return this.shiftsService.deleteShift(id, user.role);
    }
    async createPayrollDraft(id, user) {
        if (user.role !== 'Admin' && user.role !== 'HR' && user.role !== 'Manager') {
            throw new common_1.ForbiddenException('Только HR, менеджер или админ может создавать черновик зарплаты');
        }
        return this.shiftsService.createPayrollDraftFromShift(id);
    }
    async publishFromPreferences(user, weekStart) {
        if (user.role !== 'Admin' && user.role !== 'HR') {
            throw new common_1.ForbiddenException('Только администратор может публиковать графики');
        }
        return this.shiftsService.publishScheduleFromPreferences(weekStart, user.id);
    }
    getAvailableRoles() {
        return this.shiftsService.getAvailableRoles();
    }
};
exports.ShiftsController = ShiftsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_shift_dto_1.CreateShiftDto]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_shift_dto_1.UpdateShiftDto, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "approveShift", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "rejectShift", null);
__decorate([
    (0, common_1.Patch)(':id/exchange-request'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "requestExchange", null);
__decorate([
    (0, common_1.Patch)(':id/exchange-accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "acceptExchange", null);
__decorate([
    (0, common_1.Patch)(':id/exchange-decline'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "declineExchange", null);
__decorate([
    (0, common_1.Get)('exchange/accepted'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "getAcceptedExchanges", null);
__decorate([
    (0, common_1.Patch)(':id/decline'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "declineShift", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "acceptShift", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_shift_dto_1.UpdateShiftDto, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "updateShift", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "deleteShift", null);
__decorate([
    (0, common_1.Post)(':id/payroll-draft'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "createPayrollDraft", null);
__decorate([
    (0, common_1.Post)('publish-from-preferences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('weekStart')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "publishFromPreferences", null);
__decorate([
    (0, common_1.Get)('available-roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "getAvailableRoles", null);
exports.ShiftsController = ShiftsController = __decorate([
    (0, common_1.Controller)('shifts'),
    __metadata("design:paramtypes", [shifts_service_1.ShiftsService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map