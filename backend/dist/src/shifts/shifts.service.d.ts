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
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    getShifts(filters: {
        employeeId?: string;
        departmentId?: string;
        status?: ShiftStatus;
        startDate?: Date;
        endDate?: Date;
    }): Promise<({
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    })[]>;
    getEmployeeWithDepartment(employeeId: string): Promise<{
        id: string;
        departmentId: string | null;
    }>;
    getShiftById(shiftId: string): Promise<{
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    getShiftsForEmployee(employeeId: string, departmentId: string | null, filters: {
        status?: ShiftStatus;
    }): Promise<({
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    })[]>;
    updateShiftStatus(shiftId: string, newStatus: ShiftStatus, userId: string, userRole: Role): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    declineShift(shiftId: string, employeeId: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    acceptShift(shiftId: string, employeeId: string): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    requestExchange(shiftId: string, userId: string, userEmployeeId: string, targetEmployeeId?: string): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    acceptExchange(shiftId: string, employeeId: string): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    declineExchange(shiftId: string, employeeId: string): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    getAcceptedExchanges(requestorId: string): Promise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    })[]>;
    approveShift(shiftId: string, adminId: string): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    createPayrollDraftFromShift(shiftId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
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
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    getAvailableRoles(): EmployeeRole[];
    private getFirstDepartmentId;
    updateShift(shiftId: string, dto: any, userRole: Role, userEmployeeId?: string): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    deleteShift(shiftId: string, userRole: Role): Promise<{
        department: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        exchangeTargetEmployeeId: string | null;
        startTime: Date;
        endTime: Date;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.ShiftStatus;
        type: import("@prisma/client").$Enums.ShiftType;
        canDecline: boolean;
        createdBy: string | null;
        comment: string | null;
        maxParticipants: number | null;
        currentParticipants: number;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string | null;
        departmentId: string;
    }>;
    private stripExchangeDeclinedMarker;
    private appendExchangeDeclinedMarker;
    publishScheduleFromPreferences(weekStart: string, adminId: string): Promise<{
        message: string;
        shiftsCreated: number;
        weekStart: string;
    }>;
}
