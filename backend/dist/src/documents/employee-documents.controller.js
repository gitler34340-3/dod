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
exports.EmployeeDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const document_template_service_1 = require("./document-template.service");
const employee_document_service_1 = require("./employee-document.service");
const employment_contract_service_1 = require("./employment-contract.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const index_1 = require("./dto/index");
let EmployeeDocumentsController = class EmployeeDocumentsController {
    templateService;
    documentService;
    contractService;
    prisma;
    constructor(templateService, documentService, contractService, prisma) {
        this.templateService = templateService;
        this.documentService = documentService;
        this.contractService = contractService;
        this.prisma = prisma;
    }
    async getAllTemplates() {
        return this.templateService.getAllTemplates();
    }
    async getMyTemplates(user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            return [];
        }
        const employee = await this.prisma.employee.findUnique({
            where: { id: userWithEmployee.employeeId },
            select: { departmentId: true },
        });
        if (!employee?.departmentId) {
            return [];
        }
        return this.templateService.getTemplatesForDepartment(employee.departmentId);
    }
    async getTemplate(id) {
        return this.templateService.getTemplateById(id);
    }
    async createTemplate(dto, user) {
        return this.templateService.createTemplate(dto, user.role);
    }
    async updateTemplate(id, dto, user) {
        return this.templateService.updateTemplate(id, dto, user.role);
    }
    async deleteTemplate(id, user) {
        return this.templateService.deleteTemplate(id, user.role);
    }
    async getRequiredDocuments(user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            return [];
        }
        return this.documentService.getRequiredDocumentsForEmployee(userWithEmployee.employeeId);
    }
    async getMyDocuments(user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            return [];
        }
        return this.documentService.getEmployeeDocuments(userWithEmployee.employeeId);
    }
    async uploadDocument(templateId, dto, user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            throw new common_1.ForbiddenException('Employee not found');
        }
        return this.documentService.uploadDocument(userWithEmployee.employeeId, templateId, dto);
    }
    async respondToDocument(id, dto, user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            throw new common_1.ForbiddenException('Employee not found');
        }
        return this.documentService.respondToDocument(id, userWithEmployee.employeeId, dto);
    }
    async assignDocumentToEmployee(dto, user) {
        return this.documentService.assignDocumentToEmployee(dto, user.role);
    }
    async getDocument(id, user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            throw new common_1.ForbiddenException('Employee not found');
        }
        return this.documentService.getEmployeeDocument(id, userWithEmployee.employeeId, user.role);
    }
    async deleteDocument(id, user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            throw new common_1.ForbiddenException('Employee not found');
        }
        return this.documentService.deleteEmployeeDocument(id, userWithEmployee.employeeId, user.role);
    }
    async getAllDocuments(templateId, status, employeeId) {
        return this.documentService.getAllEmployeeDocuments(templateId, status, employeeId);
    }
    async reviewDocument(id, dto, user) {
        return this.documentService.reviewDocument(id, dto, user.role);
    }
    async getMyContract(user) {
        const userWithEmployee = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { employeeId: true },
        });
        if (!userWithEmployee?.employeeId) {
            return null;
        }
        return this.contractService.getContractByEmployeeId(userWithEmployee.employeeId, user.id, user.role);
    }
    async getEmployeeContract(employeeId, user) {
        return this.contractService.getContractByEmployeeId(employeeId, user.id, user.role);
    }
    async getAllContracts(user) {
        if (!['Admin', 'HR'].includes(user.role)) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.contractService.getAllContracts();
    }
    async updateContract(id, dto, user) {
        return this.contractService.updateContract(id, dto, user.role);
    }
    async deleteContract(id, user) {
        return this.contractService.deleteContract(id, user.role);
    }
};
exports.EmployeeDocumentsController = EmployeeDocumentsController;
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getAllTemplates", null);
__decorate([
    (0, common_1.Get)('templates/department/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getMyTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_1.CreateDocumentTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.UpdateDocumentTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('required'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getRequiredDocuments", null);
__decorate([
    (0, common_1.Get)('my-uploads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getMyDocuments", null);
__decorate([
    (0, common_1.Post)('upload/:templateId'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.UploadDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Put)('document/:id/respond'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.RespondEmployeeDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "respondToDocument", null);
__decorate([
    (0, common_1.Post)('admin/assign'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [index_1.AssignEmployeeDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "assignDocumentToEmployee", null);
__decorate([
    (0, common_1.Get)('document/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Delete)('document/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    __param(0, (0, common_1.Query)('templateId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getAllDocuments", null);
__decorate([
    (0, common_1.Put)('admin/review/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.ReviewDocumentDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "reviewDocument", null);
__decorate([
    (0, common_1.Get)('contract/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getMyContract", null);
__decorate([
    (0, common_1.Get)('contract/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getEmployeeContract", null);
__decorate([
    (0, common_1.Get)('contracts/admin/all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "getAllContracts", null);
__decorate([
    (0, common_1.Put)('contract/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, index_1.UpdateEmploymentContractDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "updateContract", null);
__decorate([
    (0, common_1.Delete)('contract/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeDocumentsController.prototype, "deleteContract", null);
exports.EmployeeDocumentsController = EmployeeDocumentsController = __decorate([
    (0, common_1.Controller)('employee-documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [document_template_service_1.DocumentTemplateService,
        employee_document_service_1.EmployeeDocumentService,
        employment_contract_service_1.EmploymentContractService,
        prisma_service_1.PrismaService])
], EmployeeDocumentsController);
//# sourceMappingURL=employee-documents.controller.js.map