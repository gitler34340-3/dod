export declare class ShiftPreferenceTimeSlotDto {
    dayOfWeek: number;
    shiftType: 'morning' | 'day' | 'evening' | 'night' | 'flexible';
    startHour?: number;
    endHour?: number;
    estimatedHours?: number;
}
export declare class SubmitShiftPreferencesDto {
    timeSlots: ShiftPreferenceTimeSlotDto[];
    weekStartDate: string;
    comment?: string;
}
export declare class ShiftPreferenceDetailDto {
    id: string;
    workerId: string;
    workerName: string;
    timeSlots: ShiftPreferenceTimeSlotDto[];
    totalHours: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    comment?: string;
    weekStartDate: string;
    employeeKpi?: {
        totalHoursThisMonth: number;
        absenceRate: number;
        performanceScore: number;
    };
}
