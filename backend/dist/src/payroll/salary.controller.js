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
exports.SalaryController = void 0;
const common_1 = require("@nestjs/common");
const salary_calculation_service_1 = require("./salary-calculation.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let SalaryController = class SalaryController {
    salaryService;
    constructor(salaryService) {
        this.salaryService = salaryService;
    }
    async getSalaryForCurrentWeek(user) {
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Сотрудник не привязан к учетной записи');
        }
        return this.salaryService.getSalaryForCurrentWeek(user.employee.id);
    }
    async getSalaryForCurrentMonth(user) {
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Сотрудник не привязан к учетной записи');
        }
        return this.salaryService.getSalaryForCurrentMonth(user.employee.id);
    }
    async getSalaryForPeriod(employeeId, startDate, endDate, user) {
        if (user.employee?.id !== employeeId && user.role !== 'Manager' && user.role !== 'Admin' && user.role !== 'HR') {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        return this.salaryService.calculateSalary(employeeId, start, end);
    }
    async getEmployeeSalaryForCurrentWeek(employeeId, user) {
        if (user.employee?.id !== employeeId && user.role !== 'Manager' && user.role !== 'Admin' && user.role !== 'HR') {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        return this.salaryService.getSalaryForCurrentWeek(employeeId);
    }
    async getEmployeeSalaryForCurrentMonth(employeeId, user) {
        if (user.employee?.id !== employeeId && user.role !== 'Manager' && user.role !== 'Admin' && user.role !== 'HR') {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        return this.salaryService.getSalaryForCurrentMonth(employeeId);
    }
};
exports.SalaryController = SalaryController;
__decorate([
    (0, common_1.Get)('week/current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SalaryController.prototype, "getSalaryForCurrentWeek", null);
__decorate([
    (0, common_1.Get)('month/current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SalaryController.prototype, "getSalaryForCurrentMonth", null);
__decorate([
    (0, common_1.Get)(':employeeId/period'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SalaryController.prototype, "getSalaryForPeriod", null);
__decorate([
    (0, common_1.Get)(':employeeId/week/current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalaryController.prototype, "getEmployeeSalaryForCurrentWeek", null);
__decorate([
    (0, common_1.Get)(':employeeId/month/current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalaryController.prototype, "getEmployeeSalaryForCurrentMonth", null);
exports.SalaryController = SalaryController = __decorate([
    (0, common_1.Controller)('salary'),
    __metadata("design:paramtypes", [salary_calculation_service_1.SalaryCalculationService])
], SalaryController);
//# sourceMappingURL=salary.controller.js.map