import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { SubmitShiftPreferencesDto, ShiftPreferenceDetailDto } from './dto/shift-preference-time-slot.dto';
export declare class ShiftPreferencesManagementService {
    private readonly prisma;
    private readonly SUBMISSION_DEADLINE_DAY;
    private readonly SUBMISSION_DEADLINE_HOUR;
    constructor(prisma: PrismaService);
    getSubmissionDeadline(weekStartDate: Date): Date;
    isSubmissionOpen(weekStartDate: Date): boolean;
    submitWeeklyPreferences(employeeId: string, dto: SubmitShiftPreferencesDto): Promise<{
        message: string;
        createdPreferences: number;
        preferenceIds: string[];
    }>;
    getPreferencesForShift(shiftId: string, departmentId: string, userRole: Role): Promise<ShiftPreferenceDetailDto[]>;
    private getEmployeeKpi;
    getOvertimeWarnings(preferences: ShiftPreferenceDetailDto[]): Map<string, string>;
    approvePreference(preferenceId: string, userRole: Role): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        priority: number | null;
        shiftId: string;
        preferenceType: string;
    }>;
    rejectPreference(preferenceId: string, userRole: Role, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        userId: string;
        priority: number | null;
        shiftId: string;
        preferenceType: string;
    }>;
    getWeeklyPreferencesOverview(weekStartDate: string, departmentId?: string, userRole?: Role): Promise<Record<string, Record<string, any[]>>>;
    findScheduleGaps(weekStartDate: string, requiredShifts: Array<{
        dayOfWeek: number;
        shiftType: string;
        requiredCount: number;
    }>, departmentId: string): Promise<{
        day: number;
        shift: string;
        required: number;
        available: number;
        gap: number;
    }[]>;
    private getShiftTypeFromHours;
}
