import { DataService } from '../data/data.service';
import type { User } from '../domain/entities';
export declare class AchievementsController {
    private readonly data;
    constructor(data: DataService);
    list(user: User): import("../domain/entities").Achievement[];
}
