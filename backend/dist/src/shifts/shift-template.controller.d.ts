import { ShiftTemplateService } from './shift-template.service';
import { Role } from '@prisma/client';
interface CurrentUserWithId {
    id: string;
    email: string;
    role: Role;
    employee?: {
        id: string;
        departmentId: string;
    };
}
export declare class ShiftTemplateController {
    private readonly templateService;
    constructor(templateService: ShiftTemplateService);
    getPredefinedTemplates(): {
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
    saveTemplate(dto: {
        departmentId: string;
        name: string;
        pattern: string;
    }, user: CurrentUserWithId): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        departmentId: string;
        pattern: string;
        managerId: string;
    }>;
    applyTemplateToMonth(templateId: string, year: string, month: string, departmentId: string, user: CurrentUserWithId): Promise<{
        message: string;
        shiftsCreated: number;
    }>;
}
export {};
