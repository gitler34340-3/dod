import { PrismaService } from '../prisma/prisma.service';
export declare class SalaryCalculationService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateSalary(employeeId: string, startDate: Date, endDate: Date): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    getSalaryForCurrentWeek(employeeId: string): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    getSalaryForCurrentMonth(employeeId: string): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    createPayrollItem(employeeId: string, startDate: Date, endDate: Date): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        departmentId: string | null;
        periodStart: Date;
        periodEnd: Date;
        baseSalary: number;
        bonuses: number;
        deductions: number;
        total: number;
        paidAt: Date | null;
    }>;
}
