import { AuthService, Tokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { User } from '@prisma/client';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            employeeId: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    refresh(dto: {
        refreshToken: string;
    }): Promise<Tokens>;
    logout(user: User): Promise<{
        message: string;
    }>;
}
