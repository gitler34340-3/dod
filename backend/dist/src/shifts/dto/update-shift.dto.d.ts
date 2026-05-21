import { ShiftStatus, ShiftType, EmployeeRole } from '@prisma/client';
export declare class UpdateShiftDto {
    status?: ShiftStatus;
    startTime?: string;
    endTime?: string;
    role?: EmployeeRole;
    type?: ShiftType;
    canDecline?: boolean;
    comment?: string;
    maxParticipants?: number;
}
