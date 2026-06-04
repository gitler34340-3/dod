import { PrismaService } from '../prisma/prisma.service';
export interface CreateJobApplicationDto {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    experience?: string;
}
export interface ReviewJobApplicationDto {
    status: 'approved' | 'rejected';
    notes?: string;
    password?: string;
}
export declare class JobApplicationService {
    private prisma;
    constructor(prisma: PrismaService);
    createApplication(dto: CreateJobApplicationDto): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        position: string;
        firstName: string;
        lastName: string;
        phone: string;
        experience: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }>;
    getAllApplications(): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        position: string;
        firstName: string;
        lastName: string;
        phone: string;
        experience: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }[]>;
    getApplicationById(id: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        position: string;
        firstName: string;
        lastName: string;
        phone: string;
        experience: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }>;
    reviewApplication(id: string, dto: ReviewJobApplicationDto, reviewedBy: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        position: string;
        firstName: string;
        lastName: string;
        phone: string;
        experience: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }>;
    deleteApplication(id: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        position: string;
        firstName: string;
        lastName: string;
        phone: string;
        experience: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }>;
}
