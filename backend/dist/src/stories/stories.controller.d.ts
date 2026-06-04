import { Role } from '@prisma/client';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesController {
    private readonly stories;
    constructor(stories: StoriesService);
    feed(role: Role, employeeId?: string): Promise<{
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
