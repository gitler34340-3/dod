import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import type { User } from '@prisma/client';

export type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Пользователь с таким email уже существует');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hash,
        role: dto.role ?? 'Employee',
        employeeId: dto.employeeId ?? undefined,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    const tokens = await this.issueTokens(user as User & { id: string; email: string; role: string });
    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, role: true, employeeId: true, passwordHash: true, refreshToken: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const tokens = await this.issueTokens(user as User);
    const { passwordHash: _, refreshToken: __, ...safe } = user;
    return { user: safe, ...tokens };
  }

  private getJwtAccessSecret(): string {
    return this.config.get<string>('JWT_ACCESS_SECRET') || 'dev-secret-change-in-production-min-32-chars';
  }

  private getJwtRefreshSecret(): string {
    return this.config.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret-change-in-prod-min-32';
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.getJwtRefreshSecret(),
      }) as { sub: string };
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Недействительный refresh токен');
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Недействительный refresh токен');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Выход выполнен' };
  }

  private async issueTokens(user: User): Promise<Tokens> {
    const payload = { sub: user.id, email: user.email, type: 'access' as const };
    const accessToken = this.jwt.sign(payload, {
      secret: this.getJwtAccessSecret(),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
    const refreshToken = this.jwt.sign(
      { sub: user.id },
      {
        secret: this.getJwtRefreshSecret(),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    const expiresIn = 900; // 15 min in seconds, or parse from JWT_ACCESS_EXPIRES_IN
    return { accessToken, refreshToken, expiresIn };
  }
}
