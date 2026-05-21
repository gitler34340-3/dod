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
exports.EmploymentContractService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmploymentContractService = class EmploymentContractService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getContractByEmployeeId(employeeId, currentUserId, userRole) {
        const db = this.prisma;
        const contract = await db.employmentContract.findUnique({
            where: { employeeId },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        hireDate: true,
                        hourlyRate: true,
                        department: { select: { name: true } },
                    },
                },
            },
        });
        if (!contract) {
            throw new common_1.NotFoundException('Трудовой договор не найден');
        }
        if (contract.employeeId !== employeeId && !['Admin', 'HR'].includes(userRole || '')) {
            throw new common_1.ForbiddenException('Доступ запрещён');
        }
        return contract;
    }
    async getAllContracts() {
        const db = this.prisma;
        return db.employmentContract.findMany({
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createContractForEmployee(employeeId, dto) {
        const employee = await this.prisma.employee.findUniqueOrThrow({
            where: { id: employeeId },
            select: {
                firstName: true,
                lastName: true,
                hireDate: true,
                hourlyRate: true,
                departmentId: true,
            },
        });
        let departmentName = 'Основное отделение';
        if (employee.departmentId) {
            const dept = await this.prisma.department.findUnique({
                where: { id: employee.departmentId },
                select: { name: true },
            });
            departmentName = dept?.name ?? 'Основное отделение';
        }
        const contractNumber = `НД-${new Date().getFullYear()}-${Date.now()}`;
        const db = this.prisma;
        return db.employmentContract.create({
            data: {
                employeeId,
                contractNumber,
                startDate: employee.hireDate,
                endDate: dto?.endDate || null,
                position: dto?.position || 'Сотрудник',
                department: departmentName,
                salary: employee.hourlyRate,
                content: dto?.content ||
                    this.generateDefaultContent(`${employee.firstName} ${employee.lastName}`, departmentName, employee.hireDate),
                fileName: dto?.fileName,
                fileUrl: dto?.fileUrl,
            },
        });
    }
    async updateContract(contractId, dto, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только админ может обновлять договоры');
        }
        const db = this.prisma;
        const contract = await db.employmentContract.findUniqueOrThrow({
            where: { id: contractId },
        });
        return db.employmentContract.update({
            where: { id: contractId },
            data: {
                position: dto.position ?? contract.position,
                endDate: dto.endDate ?? contract.endDate,
                content: dto.content ?? contract.content,
                salary: dto.salary ?? contract.salary,
                fileName: dto.fileName ?? contract.fileName,
                fileUrl: dto.fileUrl ?? contract.fileUrl,
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        hireDate: true,
                    },
                },
            },
        });
    }
    async deleteContract(contractId, userRole) {
        if (!['Admin', 'HR'].includes(userRole)) {
            throw new common_1.ForbiddenException('Только админ может удалять договоры');
        }
        const db = this.prisma;
        return db.employmentContract.delete({ where: { id: contractId } });
    }
    generateDefaultContent(name, department, hireDate) {
        return `
ТРУДОВОЙ ДОГОВОР

Между работодателем и работником ${name}

Отделение: ${department}
Дата начала: ${hireDate.toLocaleDateString('ru-RU')}

Данный трудовой договор заключен в соответствии с законодательством 
и регулирует трудовые отношения между сторонами.

Условия:
- Работник принимает на себя обязательства по выполнению работ
- Работодатель гарантирует своевременную оплату труда
- Рабочее время и отпуск регулируются внутренними регламентами

Подписи сторон подтверждают согласие с условиями договора.
    `;
    }
};
exports.EmploymentContractService = EmploymentContractService;
exports.EmploymentContractService = EmploymentContractService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmploymentContractService);
//# sourceMappingURL=employment-contract.service.js.map