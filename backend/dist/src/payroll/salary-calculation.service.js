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
exports.SalaryCalculationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SalaryCalculationService = class SalaryCalculationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateSalary(employeeId, startDate, endDate) {
        const employee = await this.prisma.employee.findUniqueOrThrow({
            where: { id: employeeId },
            select: { id: true, hourlyRate: true, firstName: true, lastName: true },
        });
        const now = new Date();
        const shifts = await this.prisma.shift.findMany({
            where: {
                employeeId,
                status: 'Confirmed',
                startTime: {
                    gte: startDate,
                    lte: endDate,
                },
                endTime: {
                    lte: now,
                },
            },
        });
        const attendances = await this.prisma.attendance.findMany({
            where: {
                employeeId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        let totalHours = 0;
        const processedShifts = new Set();
        for (const attendance of attendances) {
            if (attendance.checkIn && attendance.checkOut) {
                const hours = (new Date(attendance.checkOut).getTime() -
                    new Date(attendance.checkIn).getTime()) /
                    (1000 * 60 * 60);
                totalHours += Math.max(0, hours);
                processedShifts.add(attendance.date.toISOString().split('T')[0]);
            }
        }
        for (const shift of shifts) {
            const shiftDate = shift.startTime.toISOString().split('T')[0];
            if (!processedShifts.has(shiftDate)) {
                const hours = (new Date(shift.endTime).getTime() -
                    new Date(shift.startTime).getTime()) /
                    (1000 * 60 * 60);
                totalHours += Math.max(0, hours);
            }
        }
        const grossSalary = employee.hourlyRate * totalHours;
        return {
            employeeId: employee.id,
            totalHours: Math.round(totalHours * 100) / 100,
            hourlyRate: employee.hourlyRate,
            grossSalary: Math.round(grossSalary * 100) / 100,
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
        };
    }
    async getSalaryForCurrentWeek(employeeId) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return this.calculateSalary(employeeId, weekStart, weekEnd);
    }
    async getSalaryForCurrentMonth(employeeId) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return this.calculateSalary(employeeId, monthStart, monthEnd);
    }
    async createPayrollItem(employeeId, startDate, endDate) {
        const employee = await this.prisma.employee.findUniqueOrThrow({
            where: { id: employeeId },
            select: { departmentId: true },
        });
        const salary = await this.calculateSalary(employeeId, startDate, endDate);
        return this.prisma.payrollItem.create({
            data: {
                employeeId,
                departmentId: employee.departmentId,
                periodStart: startDate,
                periodEnd: endDate,
                baseSalary: salary.grossSalary,
                bonuses: 0,
                deductions: 0,
                total: salary.grossSalary,
                status: 'draft',
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
            },
        });
    }
};
exports.SalaryCalculationService = SalaryCalculationService;
exports.SalaryCalculationService = SalaryCalculationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalaryCalculationService);
//# sourceMappingURL=salary-calculation.service.js.map