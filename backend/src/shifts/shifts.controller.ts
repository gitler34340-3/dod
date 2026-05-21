import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

interface CurrentUserWithId {
  id: string;
  email: string;
  role: Role;
  employee?: { id: string };
}

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  /**
   * Получить смены
   * Для сотрудников - показываются свои смены + открытые смены отдела
   * Для менеджера - показываются все смены отдела
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: CurrentUserWithId,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    if (user.role === 'Employee') {
      if (!user.employee?.id) {
        // if no linked employee, still show open shifts
        return this.shiftsService.getShifts({ employeeId: undefined, status: status as any });
      }
      const employee = await this.shiftsService.getEmployeeWithDepartment(user.employee.id);
      const departmentId = employee.departmentId!;
      // Сотрудник видит свои смены + открытые смены отдела
      return this.shiftsService.getShiftsForEmployee(user.employee.id, departmentId, {
        status: status as any,
      });
    }

    // Admin and HR can see all shifts or filtered by employee
    if (user.role === 'Admin' || user.role === 'HR') {
      return this.shiftsService.getShifts({
        employeeId: employeeId || undefined,
        status: status as any,
      });
    }

    throw new ForbiddenException('Нет доступа к сменам');
  }

  /**
   * Создать новую смену
   * Сотрудник создает предложенные смены (Requested)
   * Admin/HR создают назначенные смены (Mandatory/Optional)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: CurrentUserWithId,
    @Body() dto: CreateShiftDto,
  ) {
    if (user.role === 'Employee' && !user.employee?.id) {
      throw new ForbiddenException('Не удалось определить сотрудника');
    }

    return this.shiftsService.createShift(dto, user.id, user.role, user.employee?.id);
  }

  /**
   * Сотрудник может утвердить только смены, назначенные админом (Mandatory/Optional)
   * Админ может принять/отклонить Requested смены через /approve и /reject
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (!dto.status) {
      throw new ForbiddenException('Статус должен быть указан');
    }

    // Для сотрудников - только свои смены в статусе pending
    if (user.role === 'Employee') {
      if (!user.employee?.id) {
        throw new ForbiddenException('Не удалось определить сотрудника');
      }
      
      const shift = await this.shiftsService.getShiftById(id);
      if (shift.employeeId !== user.employee.id) {
        throw new ForbiddenException('Вы не можете изменить статус чужой смены');
      }
      if (shift.status !== 'Pending') {
        throw new ForbiddenException('Смену можно изменить только в статусе "На рассмотрении"');
      }

      return this.shiftsService.updateShiftStatus(id, dto.status, user.employee.id, user.role);
    }

    // Для администраторов
    if (user.role === 'HR' || user.role === 'Admin') {
      return this.shiftsService.updateShiftStatus(id, dto.status, '', user.role);
    }

    throw new ForbiddenException('У вас нет прав для изменения статуса смены');
  }

  /**
   * Администратор может одобрить смену типа Requested (предложенную сотрудником)
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approveShift(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (user.role !== 'Admin' && user.role !== 'HR') {
      throw new ForbiddenException('Только администратор может одобрять предложенные смены');
    }

    return this.shiftsService.approveShift(id, user.id);
  }

  /**
   * Администратор может отклонить смену типа Requested (предложенную сотрудником)
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectShift(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (user.role !== 'Admin' && user.role !== 'HR') {
      throw new ForbiddenException('Только администратор может отклонять предложенные смены');
    }

    return this.shiftsService.rejectShift(id, user.id);
  }

  /**
   * Сотрудник отправляет запрос на обмен сменой
   */
  @Patch(':id/exchange-request')
  @UseGuards(JwtAuthGuard)
  async requestExchange(
    @Param('id') id: string,
    @Body() dto: { targetEmployeeId?: string },
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (user.role !== 'Employee') {
      throw new ForbiddenException('Только сотрудник может предложить обмен');
    }
    if (!user.employee?.id) {
      throw new ForbiddenException('Не удалось определить сотрудника');
    }

    return this.shiftsService.requestExchange(id, user.id, user.employee.id, dto.targetEmployeeId);
  }

  /**
   * Сотрудник принимает обменную смену
   */
  @Patch(':id/exchange-accept')
  @UseGuards(JwtAuthGuard)
  async acceptExchange(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (user.role !== 'Employee') {
      throw new ForbiddenException('Только сотрудник может принять обмен');
    }
    if (!user.employee?.id) {
      throw new ForbiddenException('Не удалось определить сотрудника');
    }

    return this.shiftsService.acceptExchange(id, user.employee.id);
  }

  @Patch(':id/exchange-decline')
  @UseGuards(JwtAuthGuard)
  async declineExchange(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (user.role !== 'Employee') {
      throw new ForbiddenException('Только сотрудник может отклонить обмен');
    }
    if (!user.employee?.id) {
      throw new ForbiddenException('Не удалось определить сотрудника');
    }

    return this.shiftsService.declineExchange(id, user.employee.id);
  }

  /**
   * Получить обмены, которые были приняты по вашему запросу
   */
  @Get('exchange/accepted')
  @UseGuards(JwtAuthGuard)
  async getAcceptedExchanges(@CurrentUser() user: CurrentUserWithId) {
    if (!user.id) {
      throw new ForbiddenException('Не удалось определить пользователя');
    }
    return this.shiftsService.getAcceptedExchanges(user.id);
  }

  /**
   * Сотрудник может отклонить опциональную смену
   */
  @Patch(':id/decline')
  @UseGuards(JwtAuthGuard)
  async declineShift(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (!user.employee?.id) {
      throw new ForbiddenException('Не удалось определить сотрудника');
    }

    return this.shiftsService.declineShift(id, user.employee.id);
  }

  /**
   * Сотрудник может принять только открытую смену, созданную админом/HR
   * Сотрудник НЕ может принять смену типа Requested (которую предложил другой сотрудник)
   */
  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptShift(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (!user.employee?.id) {
      throw new ForbiddenException('Не удалось определить сотрудника');
    }

    return this.shiftsService.acceptShift(id, user.employee.id);
  }

  /**
   * Обновить смену (только для менеджера/админа)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateShift(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    return this.shiftsService.updateShift(id, dto, user.role, user.employee?.id);
  }

  /**
   * Удалить смену (только для менеджера/админа)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteShift(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    return this.shiftsService.deleteShift(id, user.role);
  }

  /**
   * Получить доступные роли для выбора
   */
  @Post(':id/payroll-draft')
  @UseGuards(JwtAuthGuard)
  async createPayrollDraft(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (user.role !== 'Admin' && user.role !== 'HR' && user.role !== 'Manager') {
      throw new ForbiddenException('Только HR, менеджер или админ может создавать черновик зарплаты');
    }
    return this.shiftsService.createPayrollDraftFromShift(id);
  }

  /**
   * Опубликовать график на основе одобренных пожеланий (администратор)
   */
  @Post('publish-from-preferences')
  @UseGuards(JwtAuthGuard)
  async publishFromPreferences(
    @CurrentUser() user: CurrentUserWithId,
    @Body('weekStart') weekStart: string,
  ) {
    if (user.role !== 'Admin' && user.role !== 'HR') {
      throw new ForbiddenException('Только администратор может публиковать графики');
    }

    return this.shiftsService.publishScheduleFromPreferences(weekStart, user.id);
  }

  @Get('available-roles')
  getAvailableRoles() {
    return this.shiftsService.getAvailableRoles();
  }
}