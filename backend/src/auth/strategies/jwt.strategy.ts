import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '@prisma/client';

export type JwtPayload = { sub: string; email: string; type: 'access' };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    const key = secret || 'dev-secret-change-in-production-min-32-chars';
    if (!secret && process.env.NODE_ENV !== 'test') {
      console.warn('JWT_ACCESS_SECRET не задан в .env, используется dev-ключ. В проде обязательно задайте JWT_ACCESS_SECRET.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: key,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { employee: true },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return user;
  }
}
