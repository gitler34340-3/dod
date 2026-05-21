import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { SalaryCalculationService } from './salary-calculation.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';

interface CurrentUserWithId {
  id: string;
  email: string;
  role: Role;
  employee?: { id: string };
}

@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryCalculationService) {}

  /**
   * Get salary for current week (for logged-in employee)
   */
  @Get('week/current')
  @UseGuards(JwtAuthGuard)
  async getSalaryForCurrentWeek(@CurrentUser() user: CurrentUserWithId) {
    if (!user.employee?.id) {
      throw new ForbiddenException('Сотрудник не привязан к учетной записи');
    }

    return this.salaryService.getSalaryForCurrentWeek(user.employee.id);
  }

  /**
   * Get salary for current month (for logged-in employee)
   */
  @Get('month/current')
  @UseGuards(JwtAuthGuard)
  async getSalaryForCurrentMonth(@CurrentUser() user: CurrentUserWithId) {
    if (!user.employee?.id) {
      throw new ForbiddenException('Сотрудник не привязан к учетной записи');
    }

    return this.salaryService.getSalaryForCurrentMonth(user.employee.id);
  }

  /**
   * Get salary for custom period
   * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
   * Can be used by managers to check employee salary
   */
  @Get(':employeeId/period')
  @UseGuards(JwtAuthGuard)
  async getSalaryForPeriod(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    // Only allow access to own salary or manager access
    if (user.employee?.id !== employeeId && user.role !== 'Manager' && user.role !== 'Admin' && user.role !== 'HR') {
      throw new ForbiddenException('Доступ запрещён');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.salaryService.calculateSalary(employeeId, start, end);
  }

  /**
   * Get salary for employee in current week (manager view)
   */
  @Get(':employeeId/week/current')
  @UseGuards(JwtAuthGuard)
  async getEmployeeSalaryForCurrentWeek(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    // Only managers can view other employees' salary
    if (user.employee?.id !== employeeId && user.role !== 'Manager' && user.role !== 'Admin' && user.role !== 'HR') {
      throw new ForbiddenException('Доступ запрещён');
    }

    return this.salaryService.getSalaryForCurrentWeek(employeeId);
  }

  /**
   * Get salary for employee in current month (manager view)
   */
  @Get(':employeeId/month/current')
  @UseGuards(JwtAuthGuard)
  async getEmployeeSalaryForCurrentMonth(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    // Only managers can view other employees' salary
    if (user.employee?.id !== employeeId && user.role !== 'Manager' && user.role !== 'Admin' && user.role !== 'HR') {
      throw new ForbiddenException('Доступ запрещён');
    }

    return this.salaryService.getSalaryForCurrentMonth(employeeId);
  }
}
