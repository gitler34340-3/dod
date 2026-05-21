import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export interface ShiftTemplatePattern {
    name: string;
    workDays: number;
    restDays: number;
    workHoursPerDay: number;
    shifts: Array<{
        dayOfWeek: number;
        startHour: number;
        endHour: number;
    }>;
}
export declare class ShiftTemplateService {
    private prisma;
    constructor(prisma: PrismaService);
    private readonly templates;
    getAvailableTemplates(): {
        name: string;
        workDays: number;
        restDays: number;
        workHoursPerDay: number;
        shifts: Array<{
            dayOfWeek: number;
            startHour: number;
            endHour: number;
        }>;
        id: string;
    }[];
    saveTemplate(departmentId: string, managerId: string, name: string, pattern: string, userRole: Role): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        departmentId: string;
        pattern: string;
        managerId: string;
    }>;
    getTemplatesForDepartment(departmentId: string): Promise<({
        department: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        departmentId: string;
        pattern: string;
        managerId: string;
    })[]>;
    applyTemplateToMonth(departmentId: string, managerId: string, templateId: string, year: number, month: number, userRole: Role): Promise<{
        message: string;
        shiftsCreated: number;
    }>;
}
