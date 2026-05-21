import { CanActivate, ExecutionContext } from '@nestjs/common';
import { DataService } from '../../data/data.service';
export declare class AuthGuard implements CanActivate {
    private readonly data;
    constructor(data: DataService);
    canActivate(context: ExecutionContext): boolean;
}
