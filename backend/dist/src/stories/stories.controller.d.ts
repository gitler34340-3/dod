import { Role } from '@prisma/client';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesController {
    private readonly stories;
    constructor(stories: StoriesService);
    feed(): Promise<({
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
    })[]>;
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
}
