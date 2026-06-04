import { ShiftPreferencesManagementService } from './shift-preferences-management.service';
import { Role } from '@prisma/client';
import { SubmitShiftPreferencesDto } from './dto/shift-preference-time-slot.dto';
interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    employeeId?: string;
}
export declare class ShiftPreferencesManagementController {
    private readonly service;
    constructor(service: ShiftPreferencesManagementService);
    getDeadline(weekStart?: string): {
        weekStartDate: string;
        deadline: string;
        isOpen: boolean;
        daysUntilDeadline: number;
    };
    submitPreferences(user: JwtPayload, dto: SubmitShiftPreferencesDto): Promise<{
        message: string;
        preferenceId: string | null;
        preferenceIds: string[];
        createdPreferences: number;
    }>;
    getShiftApplicants(user: JwtPayload, shiftId: string, departmentId?: string): Promise<{
        shift: string;
        applicants: {
            overtimeWarning: string | undefined;
            id: string;
            workerId: string;
            workerName: string;
            timeSlots: import("./dto/shift-preference-time-slot.dto").ShiftPreferenceTimeSlotDto[];
            totalHours: number;
            status: "pending" | "approved" | "rejected";
            createdAt: string;
            comment?: string;
            weekStartDate: string;
            employeeKpi?: {
                totalHoursThisMonth: number;
                absenceRate: number;
                performanceScore: number;
            };
        }[];
        totalApplicants: number;
    }>;
    getWeeklyOverview(user: JwtPayload, weekStart: string, departmentId?: string): Promise<{
        weekStart: string;
        overview: Record<string, Record<string, any[]>>;
    }>;
    findGaps(user: JwtPayload, weekStart: string, departmentId: string, requiredShifts?: Array<{
        dayOfWeek: number;
        shiftType: string;
        requiredCount: number;
    }>): Promise<{
        weekStart: string;
        departmentId: string;
        gaps: {
            day: number;
            shift: string;
            required: number;
            available: number;
            gap: number;
        }[];
        hasGaps: boolean;
    }>;
    approvePreference(user: JwtPayload, preferenceId: string): Promise<{
        message: string;
        preferenceId: string;
    }>;
    rejectPreference(user: JwtPayload, preferenceId: string, reason?: string): Promise<{
        message: string;
        preferenceId: string;
        reason: string | undefined;
    }>;
    private getNextMonday;
    private getDaysUntil;
}
export {};
