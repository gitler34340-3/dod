"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const common_module_1 = require("../common/common.module");
const documents_controller_1 = require("./documents.controller");
const documents_service_1 = require("./documents.service");
const employee_documents_controller_1 = require("./employee-documents.controller");
const document_template_service_1 = require("./document-template.service");
const employee_document_service_1 = require("./employee-document.service");
const employment_contract_service_1 = require("./employment-contract.service");
const prisma_service_1 = require("../prisma/prisma.service");
const achievements_hr_module_1 = require("../achievements-hr/achievements-hr.module");
let DocumentsModule = class DocumentsModule {
};
exports.DocumentsModule = DocumentsModule;
exports.DocumentsModule = DocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [common_module_1.CommonModule, achievements_hr_module_1.AchievementsHrModule],
        controllers: [documents_controller_1.DocumentsController, employee_documents_controller_1.EmployeeDocumentsController],
        providers: [
            documents_service_1.DocumentsService,
            document_template_service_1.DocumentTemplateService,
            employee_document_service_1.EmployeeDocumentService,
            employment_contract_service_1.EmploymentContractService,
            prisma_service_1.PrismaService,
        ],
        exports: [
            documents_service_1.DocumentsService,
            document_template_service_1.DocumentTemplateService,
            employee_document_service_1.EmployeeDocumentService,
            employment_contract_service_1.EmploymentContractService,
        ],
    })
], DocumentsModule);
//# sourceMappingURL=documents.module.js.map