import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalaryCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate salary based on worked hours and hourly rate
   * Takes into account confirmed shifts and actual attendance/check-in/check-out time
   */
  async calculateSalary(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    employeeId: string;
    totalHours: number;
    hourlyRate: number;
    grossSalary: number;
    period: { start: string; end: string };
  }> {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: { id: true, hourlyRate: true, firstName: true, lastName: true },
    });

    const now = new Date();

    // Get confirmed shifts in the period that have already passed (endTime in the past)
    const shifts = await this.prisma.shift.findMany({
      where: {
        employeeId,
        status: 'Confirmed',
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        endTime: {
          lte: now, // Only include shifts that have already ended
        },
      },
    });

    // Get attendance records with actual check-in/check-out times
    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate total worked hours
    let totalHours = 0;

    /**
     * Priority: Use actual check-in/check-out times (from attendance records)
     * Fallback: Use shift duration if no attendance record
     */
    const processedShifts = new Set<string>();

    for (const attendance of attendances) {
      if (attendance.checkIn && attendance.checkOut) {
        const hours =
          (new Date(attendance.checkOut).getTime() -
            new Date(attendance.checkIn).getTime()) /
          (1000 * 60 * 60);
        totalHours += Math.max(0, hours);
        processedShifts.add(attendance.date.toISOString().split('T')[0]);
      }
    }

    // Add shifts that don't have attendance records
    for (const shift of shifts) {
      const shiftDate = shift.startTime.toISOString().split('T')[0];
      if (!processedShifts.has(shiftDate)) {
        const hours =
          (new Date(shift.endTime).getTime() -
            new Date(shift.startTime).getTime()) /
          (1000 * 60 * 60);
        totalHours += Math.max(0, hours);
      }
    }

    // Calculate gross salary = hourlyRate * totalHours
    const grossSalary = employee.hourlyRate * totalHours;

    return {
      employeeId: employee.id,
      totalHours: Math.round(totalHours * 100) / 100,
      hourlyRate: employee.hourlyRate,
      grossSalary: Math.round(grossSalary * 100) / 100,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Calculate salary for current week
   */
  async getSalaryForCurrentWeek(employeeId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return this.calculateSalary(employeeId, weekStart, weekEnd);
  }

  /**
   * Calculate salary for current month
   */
  async getSalaryForCurrentMonth(employeeId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return this.calculateSalary(employeeId, monthStart, monthEnd);
  }

  /**
   * Create a payroll item based on calculated salary
   */
  async createPayrollItem(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: { departmentId: true },
    });

    const salary = await this.calculateSalary(employeeId, startDate, endDate);

    return this.prisma.payrollItem.create({
      data: {
        employeeId,
        departmentId: employee.departmentId!,
        periodStart: startDate,
        periodEnd: endDate,
        baseSalary: salary.grossSalary,
        bonuses: 0,
        deductions: 0,
        total: salary.grossSalary,
        status: 'draft',
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }
}
