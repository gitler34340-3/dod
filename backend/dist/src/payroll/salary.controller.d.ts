import { SalaryCalculationService } from './salary-calculation.service';
import { Role } from '@prisma/client';
interface CurrentUserWithId {
    id: string;
    email: string;
    role: Role;
    employee?: {
        id: string;
    };
}
export declare class SalaryController {
    private readonly salaryService;
    constructor(salaryService: SalaryCalculationService);
    getSalaryForCurrentWeek(user: CurrentUserWithId): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    getSalaryForCurrentMonth(user: CurrentUserWithId): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    getSalaryForPeriod(employeeId: string, startDate: string, endDate: string, user: CurrentUserWithId): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    getEmployeeSalaryForCurrentWeek(employeeId: string, user: CurrentUserWithId): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
    getEmployeeSalaryForCurrentMonth(employeeId: string, user: CurrentUserWithId): Promise<{
        employeeId: string;
        totalHours: number;
        hourlyRate: number;
        grossSalary: number;
        period: {
            start: string;
            end: string;
        };
    }>;
}
export {};
