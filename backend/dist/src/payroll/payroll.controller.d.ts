import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { Role } from '@prisma/client';
export declare class PayrollController {
    private readonly payroll;
    constructor(payroll: PayrollService);
    create(dto: CreatePayrollDto, role: Role): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            hourlyRate: number;
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
    findAll(employeeId?: string, departmentId?: string, status?: string): Promise<({
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
    })[]>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            hireDate: Date;
            hourlyRate: number;
            departmentId: string | null;
            canPublishStories: boolean;
        };
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
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
    approve(id: string, role: Role): Promise<{
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
    markPaid(id: string, role: Role): Promise<{
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
