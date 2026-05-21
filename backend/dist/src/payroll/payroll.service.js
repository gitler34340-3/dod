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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const salary_calculation_service_1 = require("./salary-calculation.service");
let PayrollService = class PayrollService {
    prisma;
    salaryCalcService;
    constructor(prisma, salaryCalcService) {
        this.prisma = prisma;
        this.salaryCalcService = salaryCalcService;
    }
    async create(dto, requesterRole) {
        this.requireCanManagePayroll(requesterRole);
        const employee = await this.prisma.employee.findUniqueOrThrow({
            where: { id: dto.employeeId },
            select: { departmentId: true },
        });
        const periodStart = new Date(dto.periodStart);
        const periodEnd = new Date(dto.periodEnd);
        const salary = await this.salaryCalcService.calculateSalary(dto.employeeId, periodStart, periodEnd);
        const bonuses = dto.bonuses ?? 0;
        const deductions = dto.deductions ?? 0;
        const total = salary.grossSalary + bonuses - deductions;
        return this.prisma.payrollItem.create({
            data: {
                employeeId: dto.employeeId,
                departmentId: dto.departmentId ?? employee.departmentId,
                periodStart,
                periodEnd,
                baseSalary: salary.grossSalary,
                bonuses,
                deductions,
                total,
                status: 'draft',
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, hourlyRate: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.employeeId)
            where.employeeId = filters.employeeId;
        if (filters.departmentId)
            where.departmentId = filters.departmentId;
        if (filters.status)
            where.status = filters.status;
        return this.prisma.payrollItem.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
            orderBy: [{ periodEnd: 'desc' }],
        });
    }
    async findOne(id) {
        return this.prisma.payrollItem.findUniqueOrThrow({
            where: { id },
            include: { employee: true, department: true },
        });
    }
    async approve(id, requesterRole) {
        this.requireCanManagePayroll(requesterRole);
        return this.prisma.payrollItem.update({
            where: { id },
            data: { status: 'approved' },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    async markPaid(id, requesterRole) {
        this.requireCanManagePayroll(requesterRole);
        return this.prisma.payrollItem.update({
            where: { id },
            data: { status: 'paid', paidAt: new Date() },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
    requireCanManagePayroll(role) {
        if (!['Admin', 'HR', 'Manager'].includes(role)) {
            throw new common_1.ForbiddenException('Недостаточно прав');
        }
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        salary_calculation_service_1.SalaryCalculationService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map