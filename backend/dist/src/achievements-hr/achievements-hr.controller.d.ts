import { AchievementsHrService } from './achievements-hr.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { AssignAchievementDto } from './dto/assign-achievement.dto';
import { Role } from '@prisma/client';
export declare class AchievementsHrController {
    private readonly achievements;
    constructor(achievements: AchievementsHrService);
    createAchievement(dto: CreateAchievementDto, role: Role): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        icon: string | null;
        points: number;
    }>;
    findAllAchievements(): Promise<({
        _count: {
            employeeAchievements: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        icon: string | null;
        points: number;
    })[]>;
    getEmployeeAchievements(employeeId: string): Promise<({
        achievement: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            icon: string | null;
            points: number;
        };
    } & {
        id: string;
        employeeId: string;
        notes: string | null;
        achievementId: string;
        earnedAt: Date;
    })[]>;
    getAllEmployeeAchievements(): Promise<({
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
        };
        achievement: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            icon: string | null;
            points: number;
        };
    } & {
        id: string;
        employeeId: string;
        notes: string | null;
        achievementId: string;
        earnedAt: Date;
    })[]>;
    findOneAchievement(id: string): Promise<{
        employeeAchievements: ({
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
            };
        } & {
            id: string;
            employeeId: string;
            notes: string | null;
            achievementId: string;
            earnedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        icon: string | null;
        points: number;
    }>;
    assign(dto: AssignAchievementDto, role: Role): Promise<{
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
        };
        achievement: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            icon: string | null;
            points: number;
        };
    } & {
        id: string;
        employeeId: string;
        notes: string | null;
        achievementId: string;
        earnedAt: Date;
    }>;
}
