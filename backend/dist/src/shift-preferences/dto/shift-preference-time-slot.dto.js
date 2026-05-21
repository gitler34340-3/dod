"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftPreferenceDetailDto = exports.SubmitShiftPreferencesDto = exports.ShiftPreferenceTimeSlotDto = void 0;
class ShiftPreferenceTimeSlotDto {
    dayOfWeek;
    shiftType;
    startHour;
    endHour;
    estimatedHours;
}
exports.ShiftPreferenceTimeSlotDto = ShiftPreferenceTimeSlotDto;
class SubmitShiftPreferencesDto {
    timeSlots;
    weekStartDate;
    comment;
}
exports.SubmitShiftPreferencesDto = SubmitShiftPreferencesDto;
class ShiftPreferenceDetailDto {
    id;
    workerId;
    workerName;
    timeSlots;
    totalHours;
    status;
    createdAt;
    comment;
    weekStartDate;
    employeeKpi;
}
exports.ShiftPreferenceDetailDto = ShiftPreferenceDetailDto;
//# sourceMappingURL=shift-preference-time-slot.dto.js.map