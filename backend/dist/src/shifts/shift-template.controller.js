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
exports.ShiftTemplateController = void 0;
const common_1 = require("@nestjs/common");
const shift_template_service_1 = require("./shift-template.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const manager_guard_1 = require("../common/guards/manager.guard");
let ShiftTemplateController = class ShiftTemplateController {
    templateService;
    constructor(templateService) {
        this.templateService = templateService;
    }
    getPredefinedTemplates() {
        return this.templateService.getAvailableTemplates();
    }
    async getTemplatesForDepartment(departmentId) {
        return this.templateService.getTemplatesForDepartment(departmentId);
    }
    async saveTemplate(dto, user) {
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Менеджер не найден');
        }
        return this.templateService.saveTemplate(dto.departmentId, user.employee.id, dto.name, dto.pattern, user.role);
    }
    async applyTemplateToMonth(templateId, year, month, departmentId, user) {
        if (!user.employee?.id) {
            throw new common_1.ForbiddenException('Менеджер не найден');
        }
        return this.templateService.applyTemplateToMonth(departmentId, user.employee.id, templateId, parseInt(year, 10), parseInt(month, 10), user.role);
    }
};
exports.ShiftTemplateController = ShiftTemplateController;
__decorate([
    (0, common_1.Get)('predefined'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ShiftTemplateController.prototype, "getPredefinedTemplates", null);
__decorate([
    (0, common_1.Get)('department/:departmentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, manager_guard_1.ManagerGuard),
    __param(0, (0, common_1.Param)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "getTemplatesForDepartment", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, manager_guard_1.ManagerGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "saveTemplate", null);
__decorate([
    (0, common_1.Post)(':templateId/apply-month'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, manager_guard_1.ManagerGuard),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Query)('departmentId')),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ShiftTemplateController.prototype, "applyTemplateToMonth", null);
exports.ShiftTemplateController = ShiftTemplateController = __decorate([
    (0, common_1.Controller)('shift-templates'),
    __metadata("design:paramtypes", [shift_template_service_1.ShiftTemplateService])
], ShiftTemplateController);
//# sourceMappingURL=shift-template.controller.js.map