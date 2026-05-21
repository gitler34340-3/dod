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
exports.JobApplicationController = void 0;
const common_1 = require("@nestjs/common");
const job_application_service_1 = require("./job-application.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let JobApplicationController = class JobApplicationController {
    jobApplicationService;
    constructor(jobApplicationService) {
        this.jobApplicationService = jobApplicationService;
    }
    async createApplication(dto) {
        return this.jobApplicationService.createApplication(dto);
    }
    async getAllApplications(user) {
        if (!['Admin', 'HR'].includes(user.role)) {
            throw new common_1.ForbiddenException('Только админ может просматривать заявки');
        }
        return this.jobApplicationService.getAllApplications();
    }
    async getApplicationById(id, user) {
        if (!['Admin', 'HR'].includes(user.role)) {
            throw new common_1.ForbiddenException('Только админ может просматривать заявки');
        }
        return this.jobApplicationService.getApplicationById(id);
    }
    async reviewApplication(id, dto, user) {
        if (!['Admin', 'HR'].includes(user.role)) {
            throw new common_1.ForbiddenException('Только админ может рассматривать заявки');
        }
        return this.jobApplicationService.reviewApplication(id, dto, user.id);
    }
    async deleteApplication(id, user) {
        if (!['Admin', 'HR'].includes(user.role)) {
            throw new common_1.ForbiddenException('Только админ может удалять заявки');
        }
        return this.jobApplicationService.deleteApplication(id);
    }
};
exports.JobApplicationController = JobApplicationController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "createApplication", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "getAllApplications", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "getApplicationById", null);
__decorate([
    (0, common_1.Put)(':id/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "reviewApplication", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JobApplicationController.prototype, "deleteApplication", null);
exports.JobApplicationController = JobApplicationController = __decorate([
    (0, common_1.Controller)('job-applications'),
    __metadata("design:paramtypes", [job_application_service_1.JobApplicationService])
], JobApplicationController);
//# sourceMappingURL=job-application.controller.js.map