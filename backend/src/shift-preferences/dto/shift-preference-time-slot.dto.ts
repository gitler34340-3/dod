export class ShiftPreferenceTimeSlotDto {
  // День недели (0-6 где 0 = понедельник)
  dayOfWeek: number;
  
  // Тип смены: 'morning' (утро), 'day' (день), 'evening' (вечер), 'night' (ночь), 'flexible' (гибкий)
  shiftType: 'morning' | 'day' | 'evening' | 'night' | 'flexible';
  
  // Предполагаемые часы (опционально, если рабочий указал точное время)
  startHour?: number;
  endHour?: number;
  
  // Примерные часы для этой смены
  estimatedHours?: number;
}

export class SubmitShiftPreferencesDto {
  // Массив временных слотов на неделю
  timeSlots: ShiftPreferenceTimeSlotDto[];
  
  // Неделя (дата начала недели, e.g., 2025-05-19)
  weekStartDate: string;
  
  // Опциональный комментарий
  comment?: string;
}

export class ShiftPreferenceDetailDto {
  id: string;
  workerId: string;
  workerName: string;
  timeSlots: ShiftPreferenceTimeSlotDto[];
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  comment?: string;
  weekStartDate: string;
  // KPI для админа
  employeeKpi?: {
    totalHoursThisMonth: number;
    absenceRate: number;
    performanceScore: number;
  };
}
