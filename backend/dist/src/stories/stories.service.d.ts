import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    feed(role: Role, employeeId?: string | null): Promise<{
        views: undefined;
        reactions: undefined;
        viewsCount: any;
        reactionsCount: any;
        viewers: any;
        reactionDetails: any;
        viewedByMe: any;
        myReaction: any;
        id: string;
        employeeId: string | null;
        createdAt: Date;
        title: string | null;
        mediaUrl: string;
        caption: string | null;
        expiresAt: Date;
    }[]>;
    create(dto: CreateStoryDto, role: Role, employeeId?: string | null): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        employeeId: string | null;
        createdAt: Date;
        title: string | null;
        mediaUrl: string;
        caption: string | null;
        expiresAt: Date;
    }>;
    setPublishPermission(role: Role, employeeId: string, canPublish: boolean): Promise<{
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
    }>;
    markViewed(storyId: string, employeeId: string): Promise<{
        success: boolean;
    }>;
    setReaction(storyId: string, employeeId: string, emoji: string): Promise<{
        success: boolean;
    }>;
}
