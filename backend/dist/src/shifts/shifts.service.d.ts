import { PrismaService } from '../prisma/prisma.service';
import { Role, ShiftStatus, EmployeeRole } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { SalaryCalculationService } from '../payroll/salary-calculation.service';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';
export declare class ShiftsService {
    private prisma;
    private salaryCalculationService;
    private adminNotifications;
    private static readonly EXCHANGE_DECLINED_MARKER;
    constructor(prisma: PrismaService, salaryCalculationService: SalaryCalculationService, adminNotifications: AdminNotificationsService);
    createShift(dto: CreateShiftDto, userId: string, userRole: Role, userEmployeeId?: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    getShifts(filters: {
        employeeId?: string;
        departmentId?: string;
        status?: ShiftStatus;
        startDate?: Date;
        endDate?: Date;
    }): Promise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    })[]>;
    getEmployeeWithDepartment(employeeId: string): Promise<{
        id: string;
        departmentId: string | null;
    }>;
    getShiftById(shiftId: string): Promise<{
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    getShiftsForEmployee(employeeId: string, departmentId: string | null, filters: {
        status?: ShiftStatus;
    }): Promise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    })[]>;
    updateShiftStatus(shiftId: string, newStatus: ShiftStatus, userId: string, userRole: Role): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    declineShift(shiftId: string, employeeId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    acceptShift(shiftId: string, employeeId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    requestExchange(shiftId: string, userId: string, userEmployeeId: string, targetEmployeeId?: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    acceptExchange(shiftId: string, employeeId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    declineExchange(shiftId: string, employeeId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    getAcceptedExchanges(requestorId: string): Promise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    })[]>;
    approveShift(shiftId: string, adminId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    createPayrollDraftFromShift(shiftId: string): Promise<{
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
    rejectShift(shiftId: string, adminId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    getAvailableRoles(): EmployeeRole[];
    private getFirstDepartmentId;
    updateShift(shiftId: string, dto: any, userRole: Role, userEmployeeId?: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    deleteShift(shiftId: string, userRole: Role): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ShiftStatus;
        departmentId: string;
        comment: string | null;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
    }>;
    private stripExchangeDeclinedMarker;
    private appendExchangeDeclinedMarker;
    publishScheduleFromPreferences(weekStart: string, adminId: string): Promise<{
        message: string;
        shiftsCreated: number;
        weekStart: string;
    }>;
}
