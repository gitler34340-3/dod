import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateStoryDto } from './dto/create-story.dto';
export declare class StoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
