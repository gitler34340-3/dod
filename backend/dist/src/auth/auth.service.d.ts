import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
export type Tokens = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
};
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
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
    login(email: string, password: string): Promise<{
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
    private getJwtAccessSecret;
    private getJwtRefreshSecret;
    refresh(refreshToken: string): Promise<Tokens>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    private issueTokens;
}
