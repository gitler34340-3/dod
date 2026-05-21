import { ShiftsService } from './shifts.service';
import { Role } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
interface CurrentUserWithId {
    id: string;
    email: string;
    role: Role;
    employee?: {
        id: string;
    };
}
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    list(user: CurrentUserWithId, employeeId?: string, status?: string): Promise<({
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
    create(user: CurrentUserWithId, dto: CreateShiftDto): Promise<{
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
    updateStatus(id: string, dto: UpdateShiftDto, user: CurrentUserWithId): Promise<{
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
    approveShift(id: string, user: CurrentUserWithId): Promise<{
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
    rejectShift(id: string, user: CurrentUserWithId): Promise<{
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
    requestExchange(id: string, dto: {
        targetEmployeeId?: string;
    }, user: CurrentUserWithId): Promise<{
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
    acceptExchange(id: string, user: CurrentUserWithId): Promise<{
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
    declineExchange(id: string, user: CurrentUserWithId): Promise<{
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
    getAcceptedExchanges(user: CurrentUserWithId): Promise<({
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
    declineShift(id: string, user: CurrentUserWithId): Promise<{
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
    acceptShift(id: string, user: CurrentUserWithId): Promise<{
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
    updateShift(id: string, dto: UpdateShiftDto, user: CurrentUserWithId): Promise<{
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
    deleteShift(id: string, user: CurrentUserWithId): Promise<{
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
    createPayrollDraft(id: string, user: CurrentUserWithId): Promise<{
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
    publishFromPreferences(user: CurrentUserWithId, weekStart: string): Promise<{
        message: string;
        shiftsCreated: number;
        weekStart: string;
    }>;
    getAvailableRoles(): import("@prisma/client").$Enums.EmployeeRole[];
}
export {};
