import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

export interface ShiftTemplatePattern {
  name: string;
  workDays: number;
  restDays: number;
  workHoursPerDay: number;
  shifts: Array<{ dayOfWeek: number; startHour: number; endHour: number }>;
}

@Injectable()
export class ShiftTemplateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Predefined templates: 2/2, 5/2 morning, 5/2 evening
   */
  private readonly templates: Record<string, ShiftTemplatePattern> = {
    '2/2': {
      name: '2/2 (два дня работы, два дня отдыха)',
      workDays: 2,
      restDays: 2,
      workHoursPerDay: 8,
      shifts: [
        { dayOfWeek: 0, startHour: 8, endHour: 16 },
        { dayOfWeek: 1, startHour: 8, endHour: 16 },
      ],
    },
    '5/2-morning': {
      name: '5/2 утро (5 дней работы 08:00-16:00, 2 дня отдыха)',
      workDays: 5,
      restDays: 2,
      workHoursPerDay: 8,
      shifts: [
        { dayOfWeek: 0, startHour: 8, endHour: 16 },
        { dayOfWeek: 1, startHour: 8, endHour: 16 },
        { dayOfWeek: 2, startHour: 8, endHour: 16 },
        { dayOfWeek: 3, startHour: 8, endHour: 16 },
        { dayOfWeek: 4, startHour: 8, endHour: 16 },
      ],
    },
    '5/2-evening': {
      name: '5/2 вечер (5 дней работы 16:00-00:00, 2 дня отдыха)',
      workDays: 5,
      restDays: 2,
      workHoursPerDay: 8,
      shifts: [
        { dayOfWeek: 0, startHour: 16, endHour: 0 },
        { dayOfWeek: 1, startHour: 16, endHour: 0 },
        { dayOfWeek: 2, startHour: 16, endHour: 0 },
        { dayOfWeek: 3, startHour: 16, endHour: 0 },
        { dayOfWeek: 4, startHour: 16, endHour: 0 },
      ],
    },
  };

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Object.entries(this.templates).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  }

  /**
   * Save a custom template
   */
  async saveTemplate(
    departmentId: string,
    managerId: string,
    name: string,
    pattern: string,
    userRole: Role,
  ) {
    if (userRole !== 'Manager' && userRole !== 'Admin' && userRole !== 'HR') {
      throw new ForbiddenException('Недостаточно прав для создания шаблона');
    }

    return this.prisma.shiftTemplate.create({
      data: {
        name,
        pattern,
        departmentId,
        managerId,
        description: `Custom template: ${name}`,
      },
    });
  }

  /**
   * Get templates for department
   */
  async getTemplatesForDepartment(departmentId: string) {
    return this.prisma.shiftTemplate.findMany({
      where: { departmentId },
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Apply template to fill month with shifts
   * This generates shifts based on the pattern
   */
  async applyTemplateToMonth(
    departmentId: string,
    managerId: string,
    templateId: string,
    year: number,
    month: number,
    userRole: Role,
  ) {
    if (userRole !== 'Manager' && userRole !== 'Admin' && userRole !== 'HR') {
      throw new ForbiddenException('Недостаточно прав');
    }

    const template = this.templates[templateId];
    if (!template) {
      throw new BadRequestException('Шаблон не найден');
    }

    // Verify manager exists and belongs to department
    const manager = await this.prisma.employee.findUniqueOrThrow({
      where: { id: managerId },
    });

    if (manager.departmentId !== departmentId) {
      throw new ForbiddenException(
        'Менеджер не принадлежит этому отделу',
      );
    }

    // Generate shifts for the month
    const shiftsToCreate: Prisma.ShiftCreateManyInput[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();

      const shiftData = template.shifts.find((s) => s.dayOfWeek === dayOfWeek);
      if (shiftData) {
        const startTime = new Date(year, month, day, shiftData.startHour, 0, 0);
        let endTime = new Date(year, month, day, shiftData.endHour, 0, 0);

        // Handle overnight shifts (next day)
        if (shiftData.endHour < shiftData.startHour) {
          endTime = new Date(year, month, day + 1, shiftData.endHour, 0, 0);
        }

        shiftsToCreate.push({
          employeeId: managerId,
          departmentId,
          startTime,
          endTime,
          role: 'Manager' as const,
          status: 'Confirmed' as const,
          type: 'Mandatory' as const,
          canDecline: false,
          createdBy: managerId,
        });
      }
    }

    // Bulk create shifts
    const result = await this.prisma.shift.createMany({
      data: shiftsToCreate,
    });

    return {
      message: 'Шаблон успешно применен к месяцу',
      shiftsCreated: result.count,
    };
  }
}
