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
    create(user: CurrentUserWithId, dto: CreateShiftDto): Promise<{
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
    updateStatus(id: string, dto: UpdateShiftDto, user: CurrentUserWithId): Promise<{
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
    approveShift(id: string, user: CurrentUserWithId): Promise<{
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
    rejectShift(id: string, user: CurrentUserWithId): Promise<{
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
    requestExchange(id: string, dto: {
        targetEmployeeId?: string;
    }, user: CurrentUserWithId): Promise<{
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
    acceptExchange(id: string, user: CurrentUserWithId): Promise<{
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
    declineExchange(id: string, user: CurrentUserWithId): Promise<{
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
    getAcceptedExchanges(user: CurrentUserWithId): Promise<({
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
    declineShift(id: string, user: CurrentUserWithId): Promise<{
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
    acceptShift(id: string, user: CurrentUserWithId): Promise<{
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
    updateShift(id: string, dto: UpdateShiftDto, user: CurrentUserWithId): Promise<{
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
    deleteShift(id: string, user: CurrentUserWithId): Promise<{
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
    createPayrollDraft(id: string, user: CurrentUserWithId): Promise<{
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
    publishFromPreferences(user: CurrentUserWithId, weekStart: string): Promise<{
        message: string;
        shiftsCreated: number;
        weekStart: string;
    }>;
    getAvailableRoles(): import("@prisma/client").$Enums.EmployeeRole[];
}
export {};
