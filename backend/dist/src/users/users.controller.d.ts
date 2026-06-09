import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';
import { RequestCredentialChangeDto } from './dto/request-credential-change.dto';
import { ReviewCredentialChangeDto } from './dto/review-credential-change.dto';
import { UpdateUserCredentialsDto } from './dto/update-user-credentials.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    create(dto: CreateUserDto, role: Role): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    findAll(role: Role): Promise<{
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
    requestCredentialChange(userId: string, dto: RequestCredentialChangeDto): Promise<{
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
    getCredentialRequests(role: Role): Promise<({
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
    reviewCredentialRequest(id: string, dto: ReviewCredentialChangeDto, reviewerId: string, role: Role): Promise<{
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
    findOne(id: string, role: Role): Promise<{
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
    updateCredentials(id: string, dto: UpdateUserCredentialsDto, role: Role): Promise<{
        id: string;
        email: string;
        employeeId: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
}
