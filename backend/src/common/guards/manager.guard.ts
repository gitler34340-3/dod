import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { User } from '../../domain/entities';

@Injectable()
export class ManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User | undefined;

    if (!user) {
      throw new HttpException('Не авторизован', HttpStatus.UNAUTHORIZED);
    }

    if (user.role !== 'manager') {
      throw new HttpException(
        'Доступ только для главного менеджера',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
