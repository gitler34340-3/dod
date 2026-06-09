import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { Role } from '@prisma/client';
export declare class EmployeesController {
    private readonly employees;
    constructor(employees: EmployeesService);
    create(dto: CreateEmployeeDto, role: Role): Promise<{
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
    }>;
    findAll(role: Role): Promise<{
        avatar: {
            fileUrl?: string | null;
            fileName?: string | null;
            notes?: string | null;
        } | null;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
        } | null;
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
    }[]>;
    getEmployeeOfMonth(): Promise<({
        employee: {
            user: {
                id: string;
                email: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
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
        selectedBy: {
            id: string;
            department: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                description: string | null;
            } | null;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        message: string | null;
        selectedByEmployeeId: string | null;
        month: number;
        year: number;
    }) | null>;
    setEmployeeOfMonth(dto: {
        employeeId: string;
        month: number;
        year: number;
        title?: string;
        message?: string;
    }, role: Role, selectedByEmployeeId?: string): Promise<{
        employee: {
            user: {
                id: string;
                email: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
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
        selectedBy: {
            id: string;
            department: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                description: string | null;
            } | null;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        message: string | null;
        selectedByEmployeeId: string | null;
        month: number;
        year: number;
    }>;
    findOne(id: string): Promise<{
        avatar: {
            fileUrl?: string | null;
            fileName?: string | null;
            notes?: string | null;
        } | null;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
        } | null;
        minHoursQuota: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            managerId: string;
            minimumHoursPerWeek: number;
            minimumHoursPerMonth: number;
            currentWeekHours: number;
            currentMonthHours: number;
        } | null;
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
    }>;
    update(id: string, dto: UpdateEmployeeDto, role: Role): Promise<{
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
    }>;
    updateMyProfile(dto: UpdateEmployeeDto, employeeId?: string): Promise<{
        avatar: {
            fileUrl?: string | null;
            fileName?: string | null;
            notes?: string | null;
        } | null;
        department: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            description: string | null;
        } | null;
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
    }>;
    updateMyAvatar(dto: {
        fileUrl: string;
        fileName?: string;
        zoom?: number;
        offsetX?: number;
        offsetY?: number;
    }, employeeId?: string): Promise<{
        employeeId: string;
        fileUrl: string | null;
        fileName: string | null;
        notes: string | null;
    }>;
    getAvatar(id: string): Promise<{
        fileUrl?: string | null;
        fileName?: string | null;
        notes?: string | null;
    } | null>;
    remove(id: string, role: Role): Promise<{
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
    }>;
    terminate(id: string, dto: TerminateEmployeeDto, role: Role, userId: string): Promise<{
        success: boolean;
    }>;
}
