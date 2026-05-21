import { ShiftType, EmployeeRole } from '@prisma/client';
export declare class CreateShiftDto {
    employeeId?: string;
    departmentId?: string;
    startTime: string;
    endTime: string;
    role: EmployeeRole;
    comment?: string;
    type?: ShiftType;
    canDecline?: boolean;
    maxParticipants?: number;
}
