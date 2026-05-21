export declare class CreatePayrollDto {
    employeeId: string;
    departmentId?: string;
    periodStart: string;
    periodEnd: string;
    baseSalary: number;
    bonuses?: number;
    deductions?: number;
}
