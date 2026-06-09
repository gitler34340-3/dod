import { Role } from '@prisma/client';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesController {
    private readonly stories;
    constructor(stories: StoriesService);
    feed(role: Role, employeeId?: string): Promise<{
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
    create(dto: CreateStoryDto, role: Role, employeeId?: string): Promise<{
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
    setPublishPermission(employeeId: string, dto: {
        canPublishStories: boolean;
    }, role: Role): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        canPublishStories: boolean;
    }>;
    markViewed(storyId: string, employeeId?: string): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
    setReaction(storyId: string, dto: {
        emoji: string;
    }, employeeId?: string): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
}
