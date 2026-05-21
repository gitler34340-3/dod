import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { AssignAchievementDto } from './dto/assign-achievement.dto';
export declare class AchievementsHrService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly automaticAchievements;
    createAchievement(dto: CreateAchievementDto, requesterRole: Role): Promise<{
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
    assignToEmployee(dto: AssignAchievementDto, requesterRole: Role): Promise<{
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
    awardAutomaticForEmployee(employeeId: string): Promise<{
        id: string;
        employeeId: string;
        achievementId: string;
        earnedAt: Date;
        notes: string | null;
    }[]>;
    private requireCanManage;
}
