import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { DataService } from '../../data/data.service';
import type { User } from '../../domain/entities';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly data: DataService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpException(
        'Необходим заголовок Authorization: Bearer <token>',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring('Bearer '.length);
    const user = this.data.findUserById(token);

    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED);
    }

    request.user = user as User;
    return true;
  }
}
