import { PrismaService } from '../prisma/prisma.service';
import { EmploymentContractService } from '../documents/employment-contract.service';
import { Role } from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AchievementsHrService } from '../achievements-hr/achievements-hr.service';
export declare class EmployeesService {
    private prisma;
    private contractService;
    private readonly achievementsService;
    private readonly avatarTemplateName;
    private getAvatarMap;
    constructor(prisma: PrismaService, contractService: EmploymentContractService, achievementsService: AchievementsHrService);
    create(dto: CreateEmployeeDto, requesterRole: Role): Promise<{
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
    findAll(requesterRole: Role): Promise<{
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
    update(id: string, dto: UpdateEmployeeDto, requesterRole: Role): Promise<{
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
    updateMyProfile(employeeId: string, dto: UpdateEmployeeDto): Promise<{
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
    updateMyAvatar(employeeId: string, payload: {
        fileUrl: string;
        fileName?: string;
        zoom?: number;
        offsetX?: number;
        offsetY?: number;
    }): Promise<{
        employeeId: string;
        fileUrl: string | null;
        fileName: string | null;
        notes: string | null;
    }>;
    getEmployeeAvatar(employeeId: string): Promise<{
        fileUrl?: string | null;
        fileName?: string | null;
        notes?: string | null;
    } | null>;
    remove(id: string, requesterRole: Role): Promise<{
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
    setEmployeeOfMonth(employeeId: string, payload: {
        month: number;
        year: number;
        title?: string;
        message?: string;
    }, requesterRole: Role, selectedByEmployeeId?: string | null): Promise<{
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
    terminate(id: string, dto: {
        reason: string;
    }, requesterRole: Role, performedByUserId: string): Promise<{
        success: boolean;
    }>;
    private requireCanManageEmployees;
}
