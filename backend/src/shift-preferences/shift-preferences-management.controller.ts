import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ShiftPreferencesManagementService } from './shift-preferences-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { SubmitShiftPreferencesDto } from './dto/shift-preference-time-slot.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  employeeId?: string;
}

@Controller('shift-preferences-management')
@UseGuards(JwtAuthGuard)
export class ShiftPreferencesManagementController {
  constructor(private readonly service: ShiftPreferencesManagementService) {}

  /**
   * Получить информацию о дедлайне для текущей недели
   */
  @Get('deadline')
  getDeadline(@Query('weekStart') weekStart?: string) {
    const weekStartDate = weekStart ? new Date(weekStart) : this.getNextMonday();
    const deadline = this.service.getSubmissionDeadline(weekStartDate);
    const isOpen = this.service.isSubmissionOpen(weekStartDate);

    return {
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      deadline: deadline.toISOString(),
      isOpen,
      daysUntilDeadline: this.getDaysUntil(deadline),
    };
  }

  /**
   * Рабочий подает пожелания на неделю
   */
  @Post('submit-preferences')
  async submitPreferences(@CurrentUser() user: JwtPayload, @Body() dto: SubmitShiftPreferencesDto) {
    if (!user.employeeId) {
      throw new ForbiddenException('Вы не привязаны к сотруднику');
    }

    if (user.role !== Role.Employee) {
      throw new ForbiddenException('Только рабочие могут подавать пожелания');
    }

    const result = await this.service.submitWeeklyPreferences(user.employeeId, dto);

    return {
      message: 'Пожелания отправлены на рассмотрение',
      preferenceId: result.preferenceIds[0] || null,
      preferenceIds: result.preferenceIds,
      createdPreferences: result.createdPreferences,
    };
  }

  /**
   * Получить пожелания для конкретной смены (админ видит, кто может работать)
   */
  @Get('shift/:shiftId/applicants')
  async getShiftApplicants(
    @CurrentUser() user: JwtPayload,
    @Param('shiftId') shiftId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const applicants = await this.service.getPreferencesForShift(
      shiftId,
      departmentId || 'default',
      user.role,
    );

    // Добавить предупреждения о переработках
    const overtimeWarnings = this.service.getOvertimeWarnings(applicants);
    const applicantsWithWarnings = applicants.map(app => ({
      ...app,
      overtimeWarning: overtimeWarnings.get(app.workerId),
    }));

    return {
      shift: shiftId,
      applicants: applicantsWithWarnings,
      totalApplicants: applicants.length,
    };
  }

  /**
   * Получить обзор всех пожеланий на неделю (группировка по дням и смены)
   */
  @Get('week-overview')
  async getWeeklyOverview(
    @CurrentUser() user: JwtPayload,
    @Query('weekStart') weekStart: string,
    @Query('departmentId') departmentId?: string,
  ) {
    if (!weekStart) {
      throw new BadRequestException('weekStart обязателен');
    }

    const overview = await this.service.getWeeklyPreferencesOverview(
      weekStart,
      departmentId,
      user.role,
    );

    return {
      weekStart,
      overview,
    };
  }

  /**
   * Найти дырки в графике (где нужны люди, но никто не подал заявку)
   */
  @Get('gaps')
  async findGaps(
    @CurrentUser() user: JwtPayload,
    @Query('weekStart') weekStart: string,
    @Query('departmentId') departmentId: string,
    @Body('requiredShifts')
    requiredShifts?: Array<{ dayOfWeek: number; shiftType: string; requiredCount: number }>,
  ) {
    if (!weekStart || !departmentId) {
      throw new BadRequestException('weekStart и departmentId обязательны');
    }

    const defaultRequiredShifts = [
      { dayOfWeek: 0, shiftType: 'morning', requiredCount: 2 },
      { dayOfWeek: 0, shiftType: 'day', requiredCount: 2 },
      { dayOfWeek: 0, shiftType: 'evening', requiredCount: 2 },
      // ... и т.д. для остальных дней
    ];

    const gaps = await this.service.findScheduleGaps(
      weekStart,
      requiredShifts || defaultRequiredShifts,
      departmentId,
    );

    return {
      weekStart,
      departmentId,
      gaps,
      hasGaps: gaps.length > 0,
    };
  }

  /**
   * Одобрить пожелание (администратор)
   */
  @Patch(':preferenceId/approve')
  async approvePreference(@CurrentUser() user: JwtPayload, @Param('preferenceId') preferenceId: string) {
    await this.service.approvePreference(preferenceId, user.role);

    return {
      message: 'Пожелание одобрено',
      preferenceId,
    };
  }

  /**
   * Отклонить пожелание (администратор)
   */
  @Patch(':preferenceId/reject')
  async rejectPreference(
    @CurrentUser() user: JwtPayload,
    @Param('preferenceId') preferenceId: string,
    @Body('reason') reason?: string,
  ) {
    await this.service.rejectPreference(preferenceId, user.role, reason);

    return {
      message: 'Пожелание отклонено',
      preferenceId,
      reason,
    };
  }

  /**
   * Вспомогательный метод для получения следующего понедельника
   */
  private getNextMonday(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(today.setDate(diff));
  }

  private getDaysUntil(date: Date): number {
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }
}
