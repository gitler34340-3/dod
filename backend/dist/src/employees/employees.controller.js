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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const terminate_employee_dto_1 = require("./dto/terminate-employee.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let EmployeesController = class EmployeesController {
    employees;
    constructor(employees) {
        this.employees = employees;
    }
    create(dto, role) {
        return this.employees.create(dto, role);
    }
    findAll(role) {
        return this.employees.findAll(role);
    }
    getEmployeeOfMonth() {
        return this.employees.getEmployeeOfMonth();
    }
    setEmployeeOfMonth(dto, role, selectedByEmployeeId) {
        return this.employees.setEmployeeOfMonth(dto.employeeId, dto, role, selectedByEmployeeId ?? null);
    }
    findOne(id) {
        return this.employees.findOne(id);
    }
    update(id, dto, role) {
        return this.employees.update(id, dto, role);
    }
    updateMyProfile(dto, employeeId) {
        if (!employeeId) {
            throw new common_1.ForbiddenException('Профиль сотрудника не найден');
        }
        return this.employees.updateMyProfile(employeeId, dto);
    }
    updateMyAvatar(dto, employeeId) {
        if (!employeeId) {
            throw new common_1.ForbiddenException('Профиль сотрудника не найден');
        }
        return this.employees.updateMyAvatar(employeeId, dto);
    }
    getAvatar(id) {
        return this.employees.getEmployeeAvatar(id);
    }
    remove(id, role) {
        return this.employees.remove(id, role);
    }
    terminate(id, dto, role, userId) {
        return this.employees.terminate(id, dto, role, userId);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.Admin, client_1.Role.HR, client_1.Role.Manager),
    (0, swagger_1.ApiOperation)({ summary: 'Создать сотрудника' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_dto_1.CreateEmployeeDto, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список сотрудников' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('employee-of-month/current'),
    (0, swagger_1.ApiOperation)({ summary: 'Текущий работник месяца' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getEmployeeOfMonth", null);
__decorate([
    (0, common_1.Post)('employee-of-month'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.Admin, client_1.Role.HR, client_1.Role.Manager),
    (0, swagger_1.ApiOperation)({ summary: 'Назначить работника месяца' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "setEmployeeOfMonth", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Сотрудник по ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.Admin, client_1.Role.HR),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить сотрудника' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_dto_1.UpdateEmployeeDto, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('me/profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить свой профиль сотрудника' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_employee_dto_1.UpdateEmployeeDto, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Patch)('me/avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить аватар своего профиля' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "updateMyAvatar", null);
__decorate([
    (0, common_1.Get)(':id/avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить аватар сотрудника' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getAvatar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.Admin, client_1.Role.HR),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить сотрудника' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/terminate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.Admin, client_1.Role.HR, client_1.Role.Manager),
    (0, swagger_1.ApiOperation)({ summary: 'Уволить сотрудника (создаёт документ) ' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, terminate_employee_dto_1.TerminateEmployeeDto, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "terminate", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map