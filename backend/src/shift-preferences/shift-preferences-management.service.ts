import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { SubmitShiftPreferencesDto, ShiftPreferenceDetailDto, ShiftPreferenceTimeSlotDto } from './dto/shift-preference-time-slot.dto';

@Injectable()
export class ShiftPreferencesManagementService {
  // Дедлайн для подачи пожеланий: пятница 18:00
  private readonly SUBMISSION_DEADLINE_DAY = 5; // Пятница (0=пн, 5=пт)
  private readonly SUBMISSION_DEADLINE_HOUR = 18;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить дедлайн для подачи пожеланий на конкретную неделю
   */
  getSubmissionDeadline(weekStartDate: Date): Date {
    const deadline = new Date(weekStartDate);
    // Найти пятницу на этой неделе
    const daysUntilFriday = (5 - deadline.getDay() + 7) % 7;
    deadline.setDate(deadline.getDate() + daysUntilFriday);
    deadline.setHours(this.SUBMISSION_DEADLINE_HOUR, 0, 0, 0);
    return deadline;
  }

  /**
   * Проверить, открыта ли подача пожеланий на эту неделю
   */
  isSubmissionOpen(weekStartDate: Date): boolean {
    const deadline = this.getSubmissionDeadline(weekStartDate);
    const now = new Date();
    return now < deadline;
  }

  /**
   * Рабочий подает пожелания на неделю
   */
  async submitWeeklyPreferences(employeeId: string, dto: SubmitShiftPreferencesDto) {
    const weekStart = new Date(dto.weekStartDate);
    const deadline = this.getSubmissionDeadline(weekStart);
    const now = new Date();

    // Проверка дедлайна
    if (now > deadline) {
      throw new BadRequestException(
        `Дедлайн для подачи пожеланий на неделю ${dto.weekStartDate} прошел (${deadline.toLocaleString()})`,
      );
    }

    // Проверка, что рабочий уже не подавал пожелания на эту неделю
    const existingPreferences = await this.prisma.shiftPreference.findFirst({
      where: {
        workerId: employeeId,
        requestedDates: {
          contains: dto.weekStartDate,
        },
      },
    });

    if (existingPreferences) {
      throw new BadRequestException('Вы уже подали пожелания на эту неделю');
    }

    // Рассчитать общее количество часов
    const totalHours = dto.timeSlots.reduce((sum, slot) => sum + (slot.estimatedHours || 0), 0);

    // Проверка на переработку (максимум 60 часов в неделю)
    if (totalHours > 60) {
      throw new BadRequestException(
        `Вы подали пожелания на ${totalHours} часов, что превышает максимум (60 часов/неделю)`,
      );
    }

    // Сохранить пожелания
    return this.prisma.shiftPreference.create({
      data: {
        workerId: employeeId,
        requestedDates: JSON.stringify(dto.timeSlots),
        shiftType: dto.timeSlots.length > 0 ? 'Flexible' : 'Morning',
        status: 'Pending',
        // Используем поле для хранения доп данных (нужно добавить в схему)
      },
    });
  }

  /**
   * Получить все пожелания для конкретной смены (для админа)
   */
  async getPreferencesForShift(
    shiftId: string,
    departmentId: string,
    userRole: Role,
  ): Promise<ShiftPreferenceDetailDto[]> {
    if (userRole !== Role.Admin && userRole !== Role.HR) {
      throw new ForbiddenException('Только админ и HR могут видеть пожелания');
    }

    // Получить информацию о смене
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
      include: { department: true },
    });

    // Получить все пожелания рабочих на это время
    const allPreferences = await this.prisma.shiftPreference.findMany({
      where: {
        worker: {
          departmentId: shift.departmentId,
        },
        status: 'Pending',
      },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hourlyRate: true,
          },
        },
      },
    });

    // Отфильтровать пожелания, подходящие для этой смены
    const matchingPreferences: ShiftPreferenceDetailDto[] = [];

    for (const pref of allPreferences) {
      const timeSlots: ShiftPreferenceTimeSlotDto[] = JSON.parse(pref.requestedDates);
      const shiftDayOfWeek = shift.startTime.getDay();

      const matchingSlots = timeSlots.filter(slot => slot.dayOfWeek === shiftDayOfWeek);

      if (matchingSlots.length > 0) {
        const kpi = await this.getEmployeeKpi(pref.workerId);
        matchingPreferences.push({
          id: pref.id,
          workerId: pref.workerId,
          workerName: `${pref.worker.firstName} ${pref.worker.lastName}`,
          timeSlots: matchingSlots,
          totalHours: matchingSlots.reduce((sum, slot) => sum + (slot.estimatedHours || 0), 0),
          status: pref.status.toLowerCase() as any,
          createdAt: pref.createdAt.toISOString(),
          weekStartDate: pref.requestedDates.substring(0, 10),
          employeeKpi: kpi,
        });
      }
    }

    return matchingPreferences;
  }

  /**
   * Получить KPI рабочего для админа (для принятия решений)
   */
  private async getEmployeeKpi(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        payrollItems: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    });

    const totalHoursThisMonth = employee?.payrollItems.reduce((sum, item) => sum + (item.total / employee.hourlyRate), 0) || 0;
    const absences = employee?.attendances.filter(a => a.status === 'absent').length || 0;
    const totalDaysWorked = employee?.attendances.length || 1;
    const absenceRate = (absences / totalDaysWorked) * 100;

    return {
      totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
      absenceRate: Math.round(absenceRate * 10) / 10,
      performanceScore: 100 - absenceRate, // Упрощенная метрика
    };
  }

  /**
   * Проверить, есть ли переработки среди выбранных рабочих
   */
  getOvertimeWarnings(preferences: ShiftPreferenceDetailDto[]): Map<string, string> {
    const warnings = new Map<string, string>();

    for (const pref of preferences) {
      if (pref.employeeKpi && pref.employeeKpi.totalHoursThisMonth > 40) {
        warnings.set(
          pref.workerId,
          `⚠️ Уже работает ${pref.employeeKpi.totalHoursThisMonth}ч. Риск переработки`,
        );
      }
    }

    return warnings;
  }

  /**
   * Одобрить пожелание (администратор)
   */
  async approvePreference(preferenceId: string, userRole: Role) {
    if (userRole !== Role.Admin && userRole !== Role.HR) {
      throw new ForbiddenException('Только админ и HR могут одобрять пожелания');
    }

    return this.prisma.shiftPreference.update({
      where: { id: preferenceId },
      data: { status: 'Approved' },
    });
  }

  /**
   * Отклонить пожелание (администратор)
   */
  async rejectPreference(preferenceId: string, userRole: Role, reason?: string) {
    if (userRole !== Role.Admin && userRole !== Role.HR) {
      throw new ForbiddenException('Только админ и HR могут отклонять пожелания');
    }

    return this.prisma.shiftPreference.update({
      where: { id: preferenceId },
      data: { status: 'Rejected' },
    });
  }

  /**
   * Получить все пожелания на конкретную неделю (для админа)
   */
  async getWeeklyPreferencesOverview(weekStartDate: string, departmentId?: string, userRole?: Role) {
    if (userRole !== Role.Admin && userRole !== Role.HR) {
      throw new ForbiddenException('Только админ и HR могут видеть пожелания');
    }

    const preferences = await this.prisma.shiftPreference.findMany({
      where: {
        requestedDates: {
          contains: weekStartDate,
        },
        worker: departmentId
          ? {
              departmentId,
            }
          : undefined,
      },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    // Сгруппировать по дню и смене
    const grouped: Record<string, Record<string, any[]>> = {};

    for (const pref of preferences) {
      const timeSlots: ShiftPreferenceTimeSlotDto[] = JSON.parse(pref.requestedDates);

      for (const slot of timeSlots) {
        const dayKey = `day_${slot.dayOfWeek}`;
        const shiftKey = slot.shiftType;

        if (!grouped[dayKey]) {
          grouped[dayKey] = {};
        }
        if (!grouped[dayKey][shiftKey]) {
          grouped[dayKey][shiftKey] = [];
        }

        grouped[dayKey][shiftKey].push({
          preferenceId: pref.id,
          workerId: pref.workerId,
          workerName: `${pref.worker.firstName} ${pref.worker.lastName}`,
          status: pref.status,
          hours: slot.estimatedHours || 0,
        });
      }
    }

    return grouped;
  }

  /**
   * Найти дырки в графике (где никто не подал заявку)
   */
  async findScheduleGaps(
    weekStartDate: string,
    requiredShifts: Array<{ dayOfWeek: number; shiftType: string; requiredCount: number }>,
    departmentId: string,
  ) {
    const overview = await this.getWeeklyPreferencesOverview(weekStartDate, departmentId, Role.Admin);
    const gaps: Array<{ day: number; shift: string; required: number; available: number; gap: number }> = [];

    for (const required of requiredShifts) {
      const dayKey = `day_${required.dayOfWeek}`;
      const available = overview[dayKey]?.[required.shiftType]?.length || 0;
      const gap = Math.max(0, required.requiredCount - available);

      if (gap > 0) {
        gaps.push({
          day: required.dayOfWeek,
          shift: required.shiftType,
          required: required.requiredCount,
          available,
          gap,
        });
      }
    }

    return gaps;
  }
}
