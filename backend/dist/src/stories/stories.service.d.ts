import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    feed(role: Role, employeeId?: string | null): Promise<{
        views: undefined;
        reactions: undefined;
        viewsCount: number;
        reactionsCount: number;
        viewers: {
            employeeId: string;
            firstName: string;
            lastName: string;
            viewedAt: Date;
        }[];
        reactionDetails: {
            employeeId: string;
            firstName: string;
            lastName: string;
            emoji: string;
            createdAt: Date;
        }[];
        viewedByMe: boolean;
        myReaction: string | null;
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
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
        firstName: string;
        lastName: string;
        canPublishStories: boolean;
    }>;
    markViewed(storyId: string, employeeId: string): Promise<{
        success: boolean;
    }>;
    setReaction(storyId: string, employeeId: string, emoji: string): Promise<{
        success: boolean;
    }>;
}
