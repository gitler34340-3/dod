import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto, requesterRole: Role): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    findAll(requesterRole: Role): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            firstName: string;
            lastName: string;
        } | null;
    }[]>;
    findOne(id: string, requesterRole: Role): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
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
        } | null;
    }>;
    updateCredentials(id: string, dto: {
        email?: string;
        password?: string;
    }, requesterRole: Role): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    requestCredentialChange(userId: string, dto: {
        requestedEmail?: string;
        requestedPassword?: string;
        comment?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        comment: string | null;
        requestedEmail: string | null;
    }>;
    getMyCredentialRequests(userId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        comment: string | null;
        reviewedAt: Date | null;
        requestedEmail: string | null;
        reviewer: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
    }[]>;
    getCredentialRequests(requesterRole: Role): Promise<({
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            employee: {
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
        };
        reviewer: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        userId: string;
        comment: string | null;
        reviewedAt: Date | null;
        requestedEmail: string | null;
        requestedPasswordHash: string | null;
        reviewerId: string | null;
    })[]>;
    reviewCredentialRequest(requestId: string, status: 'Approved' | 'Rejected', reviewerId: string, requesterRole: Role): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            employee: {
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
        };
        reviewer: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequestStatus;
        userId: string;
        comment: string | null;
        reviewedAt: Date | null;
        requestedEmail: string | null;
        requestedPasswordHash: string | null;
        reviewerId: string | null;
    }>;
    private requireAdminOrHr;
    private requireAdminOrHrOrManager;
}
