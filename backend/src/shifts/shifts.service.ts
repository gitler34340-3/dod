import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ShiftStatus, ShiftType, EmployeeRole } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { SalaryCalculationService } from '../payroll/salary-calculation.service';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';

@Injectable()
export class ShiftsService {
  private static readonly EXCHANGE_DECLINED_MARKER = '[exchange_declined]';

  constructor(
    private prisma: PrismaService,
    private salaryCalculationService: SalaryCalculationService,
    private adminNotifications: AdminNotificationsService,
  ) {}

  /**
   * Создать новую смену
   * Сотрудники создают смены со статусом Pending (на одобрение менеджера)
   * Менеджеры создают смены со статусом Confirmed
   * HR/Admin могут создавать открытые смены без привязки к конкретному сотруднику
   */
  async createShift(dto: CreateShiftDto, userId: string, userRole: Role, userEmployeeId?: string) {
    let departmentId: string;
    let employeeId: string | undefined = dto.employeeId;

    if (dto.employeeId) {
      // Смена для конкретного сотрудника
      const employee = await this.prisma.employee.findUniqueOrThrow({
        where: { id: dto.employeeId },
        select: { departmentId: true },
      });
      
      // Если сотрудник не привязан к отделу, используем отдел админа/менеджера
      if (!employee.departmentId) {
        if (userEmployeeId) {
          // Используем отдел текущего пользователя
          const currentUser = await this.prisma.employee.findUniqueOrThrow({
            where: { id: userEmployeeId },
            select: { departmentId: true },
          });
          departmentId = currentUser.departmentId || (await this.getFirstDepartmentId());
        } else {
          // Используем первый доступный отдел
          departmentId = await this.getFirstDepartmentId();
        }
      } else {
        departmentId = employee.departmentId;
      }
    } else if (dto.departmentId) {
      // Смена для конкретного отдела (обычно для открытых смен)
      departmentId = dto.departmentId;
    } else if (userEmployeeId) {
      // Смена от сотрудника или менеджера - используем его отдел
      const employee = await this.prisma.employee.findUniqueOrThrow({
        where: { id: userEmployeeId },
        select: { departmentId: true },
      });
      if (!employee.departmentId) {
        // Если сотрудник не привязан к отделу, используем первый доступный
        departmentId = await this.getFirstDepartmentId();
      } else {
        departmentId = employee.departmentId;
      }
      if (userRole === 'Employee') {
        employeeId = userEmployeeId; // Сотрудник предлагает смену для себя
      }
    } else if (userRole === 'HR' || userRole === 'Admin') {
      // HR/Admin без departmentId - используем первый доступный отдел
      departmentId = await this.getFirstDepartmentId();
    } else {
      // Не можем определить отдел для обычного сотрудника
      throw new BadRequestException('Не удалось определить отдел для смены. Укажите departmentId.');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('Время окончания должно быть позже времени начала');
    }

    // Определяем статус и тип смены
    let status: ShiftStatus = ShiftStatus.Pending;
    let type: ShiftType = ShiftType.Optional;

    if (userRole === 'HR' || userRole === 'Admin') {
      // Админ/HR могут создавать обязательные и необязательные смены
      type = dto.type || ShiftType.Mandatory;
      status = (type === ShiftType.Mandatory) ? ShiftStatus.Confirmed : ShiftStatus.Pending;
    } else if (userRole === 'Employee') {
      // Сотрудник может только предложить смену (Pending)
      status = ShiftStatus.Pending;
      type = ShiftType.Requested;
    }

    const createdShift = await this.prisma.shift.create({
      data: {
        employeeId,
        departmentId,
        startTime,
        endTime,
        role: dto.role,
        status,
        type,
        canDecline: (userRole === 'HR' || userRole === 'Admin') ? (dto.canDecline ?? true) : true,
        createdBy: userId,
        comment: dto.comment,
        maxParticipants: dto.maxParticipants,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    this.adminNotifications.emitOrderCreated({
      id: createdShift.id,
      source: 'shift.request',
      createdAt: createdShift.createdAt.toISOString(),
    });

    return createdShift;
  }

  /**
   * Получить все смены для отдела / пользователя
   */
  async getShifts(filters: {
    employeeId?: string;
    departmentId?: string;
    status?: ShiftStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) (where.startTime as any).gte = filters.startDate;
      if (filters.endDate) (where.startTime as any).lte = filters.endDate;
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Получить сотрудника с departmentId
   */
  async getEmployeeWithDepartment(employeeId: string) {
    return this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: { id: true, departmentId: true },
    });
  }

  /**
   * Получить смену по ID
   */
  async getShiftById(shiftId: string) {
    return this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });
  }

  /**
   * Получить смены для сотрудника: свои + открытые отдела (которые он не принял)
   */
  async getShiftsForEmployee(employeeId: string, departmentId: string | null, filters: { status?: ShiftStatus }) {
    const currentUser = await this.prisma.user.findFirst({
      where: { employeeId },
      select: { id: true },
    });

    // Получить все смены сотрудника (его принятые и назначенные)
    const employeeShifts = await this.prisma.shift.findMany({
      where: { employeeId },
    });

    // Список времени когда уже есть смены у сотрудника
    const employeeShiftTimes = employeeShifts.map(s => ({
      start: s.startTime.toISOString(),
      end: s.endTime.toISOString(),
    }));

    // Получить открытые смены отдела
    let openShifts = await this.prisma.shift.findMany({
      where: {
        employeeId: null,
        OR: [
          {
            ...(departmentId ? { departmentId } : {}),
            exchangeTargetEmployeeId: null,
          },
          { exchangeTargetEmployeeId: employeeId },
        ],
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Отфильтровать открытые смены - убрать те, на которые сотрудник уже откликнулся
    openShifts = openShifts.filter(openShift => {
      return !employeeShiftTimes.some(time => 
        time.start === openShift.startTime.toISOString() && 
        time.end === openShift.endTime.toISOString()
      );
    });

    // Получить все личные смены с дополнительными полями
    let ownShifts = await this.prisma.shift.findMany({
      where: {
        OR: [
          { employeeId },
          ...(currentUser?.id ? [{ createdBy: currentUser.id, type: ShiftType.Requested }] : []),
        ],
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Применить фильтры по статусу если нужны
    if (filters.status) {
      ownShifts = ownShifts.filter(s => s.status === filters.status);
      openShifts = openShifts.filter(s => s.status === filters.status);
    }

    // Объединить и отсортировать
    const allShifts = [...ownShifts, ...openShifts].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    return allShifts;
  }

  /**
   * Обновить статус смены
   * Для сотрудника - только свои смены в статусе Pending, которые не типа Requested (т.е. назначенные админом)
   * Для менеджера/админа - все смены в своем отделе
   */
  async updateShiftStatus(
    shiftId: string,
    newStatus: ShiftStatus,
    userId: string,
    userRole: Role,
  ) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
      include: { department: true },
    });

    // Для сотрудника - только свои смены в статусе Pending, которые НЕ типа Requested
    if (userRole === 'Employee') {
      if (shift.employeeId !== userId) {
        throw new ForbiddenException('Вы не можете изменить статус чужой смены');
      }
      if (shift.status !== ShiftStatus.Pending) {
        throw new ForbiddenException('Смену можно изменить только в статусе "На рассмотрении"');
      }
      // Сотрудник не может утверждать собственную предложенную смену (type: Requested)
      if (shift.type === ShiftType.Requested) {
        throw new ForbiddenException('Вы не можете утверждать собственную предложенную смену. Одобрение смены может сделать только администратор');
      }
    } else if (userRole === 'HR' || userRole === 'Admin') {
      // HR и Admin могут управлять всеми сменами
    } else {
      throw new ForbiddenException('У вас нет прав для изменения статуса смены');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { status: newStatus },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Сотрудник может отклонить опциональную смену
   */
  async declineShift(shiftId: string, employeeId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });

    if (shift.employeeId !== employeeId) {
      throw new ForbiddenException('Вы не можете отклонить чужую смену');
    }

    if (!shift.canDecline) {
      throw new BadRequestException('Эта смена обязательна и не может быть отклонена');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { status: ShiftStatus.Rejected },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Сотрудник может принять открытую смену, созданную админом/HR
   * Сотрудник НЕ может принять смену типа Requested (которую предложил другой сотрудник)
   */
  async acceptShift(shiftId: string, employeeId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });

    // Проверить, что это не смена, которую предложил другой сотрудник (обмен)
    if (shift.type === ShiftType.Requested) {
      throw new ForbiddenException('Для обмена используйте отдельный метод /shifts/:id/exchange-accept');
    }

    if (shift.employeeId !== null) {
      throw new BadRequestException('Эта смена уже назначена');
    }

    if (shift.maxParticipants && shift.currentParticipants >= shift.maxParticipants) {
      throw new BadRequestException('Все места заняты');
    }

    // Проверить, не принял ли уже этот сотрудник эту смену
    const existingAcceptance = await this.prisma.shift.findFirst({
      where: { 
        id: shiftId, 
        employeeId,
      },
    });

    if (existingAcceptance) {
      throw new BadRequestException('Вы уже приняли эту смену');
    }

    // Проверить, нет ли временных конфликтов с другими сменами сотрудника
    const conflictingShift = await this.prisma.shift.findFirst({
      where: {
        employeeId,
        status: { in: [ShiftStatus.Confirmed, ShiftStatus.Pending] }, // Активные смены
        OR: [
          // Начало новой смены внутри существующей
          { startTime: { lte: shift.startTime }, endTime: { gt: shift.startTime } },
          // Конец новой смены внутри существующей
          { startTime: { lt: shift.endTime }, endTime: { gte: shift.endTime } },
          // Новая смена полностью покрывает существующую
          { startTime: { gte: shift.startTime }, endTime: { lte: shift.endTime } },
        ],
      },
    });

    if (conflictingShift) {
      throw new BadRequestException(
        'У вас уже есть смена в это время. Разрешены только непересекающиеся смены.'
      );
    }

    // Создать новую запись для принявшего сотрудника
    const newShift = await this.prisma.shift.create({
      data: {
        employeeId,
        departmentId: shift.departmentId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        role: shift.role,
        status: ShiftStatus.Confirmed,
        type: shift.type,
        canDecline: shift.canDecline,
        createdBy: shift.createdBy,
        comment: shift.comment,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Увеличить счетчик участников
    await this.prisma.shift.update({
      where: { id: shiftId },
      data: { currentParticipants: { increment: 1 } },
    });

    // Если все места заняты, удалить открытую смену
    if (shift.maxParticipants && shift.currentParticipants + 1 >= shift.maxParticipants) {
      await this.prisma.shift.delete({
        where: { id: shiftId },
      });
    }

    return newShift;
  }

  /**
   * Сотрудник может отправить запрос обмена своей сменой
   */
  async requestExchange(
    shiftId: string,
    userId: string,
    userEmployeeId: string,
    targetEmployeeId?: string,
  ) {
    const shift = await this.prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });

    if (shift.employeeId !== userEmployeeId) {
      throw new ForbiddenException('Вы можете обменять только свою смену');
    }
    if (shift.status !== ShiftStatus.Confirmed) {
      throw new BadRequestException('Для обмена должна быть подтвержденная смена');
    }
    if (!targetEmployeeId) {
      throw new BadRequestException('Выберите сотрудника, которому хотите предложить смену');
    }
    if (targetEmployeeId === userEmployeeId) {
      throw new BadRequestException('Нельзя предложить обмен самому себе');
    }

    await this.prisma.employee.findUniqueOrThrow({ where: { id: targetEmployeeId } });

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId: null,
        exchangeTargetEmployeeId: targetEmployeeId,
        status: ShiftStatus.Pending,
        type: ShiftType.Requested,
        createdBy: userId,
        comment: this.stripExchangeDeclinedMarker(shift.comment),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Сотрудник может принять обменную смену
   */
  async acceptExchange(shiftId: string, employeeId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });

    if (shift.type !== ShiftType.Requested || shift.status !== ShiftStatus.Pending || shift.employeeId !== null) {
      throw new BadRequestException('Эта смена не доступна для обмена');
    }

    if (!shift.createdBy) {
      throw new BadRequestException('Невозможно принять эту смену');
    }

    const requestorUser = await this.prisma.user.findUnique({
      where: { id: shift.createdBy },
      select: { employeeId: true },
    });

    if (requestorUser?.employeeId && requestorUser.employeeId === employeeId) {
      throw new ForbiddenException('Вы не можете принять собственную предложенную смену');
    }
    if (shift.exchangeTargetEmployeeId && shift.exchangeTargetEmployeeId !== employeeId) {
      throw new ForbiddenException('Эта смена предложена другому сотруднику');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId,
        exchangeTargetEmployeeId: null,
        status: ShiftStatus.Confirmed,
        type: ShiftType.Mandatory,
        comment: this.stripExchangeDeclinedMarker(shift.comment),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async declineExchange(shiftId: string, employeeId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({ where: { id: shiftId } });

    if (shift.type !== ShiftType.Requested || shift.status !== ShiftStatus.Pending || shift.employeeId !== null) {
      throw new BadRequestException('Эта смена не ожидает решения по обмену');
    }
    if (shift.exchangeTargetEmployeeId !== employeeId) {
      throw new ForbiddenException('Вы не можете отклонить чужой запрос на обмен');
    }
    if (!shift.createdBy) {
      throw new BadRequestException('Не удалось определить инициатора обмена');
    }

    const requestorUser = await this.prisma.user.findUnique({
      where: { id: shift.createdBy },
      select: { employeeId: true },
    });

    if (!requestorUser?.employeeId) {
      throw new BadRequestException('Не удалось вернуть смену исходному сотруднику');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId: requestorUser.employeeId,
        exchangeTargetEmployeeId: null,
        status: ShiftStatus.Confirmed,
        type: ShiftType.Mandatory,
        comment: this.appendExchangeDeclinedMarker(shift.comment),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Получить принятые обмены для текущего запросившего сотрудника
   */
  async getAcceptedExchanges(requestorId: string) {
    return this.prisma.shift.findMany({
      where: {
        createdBy: requestorId,
        status: ShiftStatus.Confirmed,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Админ/HR может одобрить смену типа Requested (предложенную сотрудником)
   * После одобрения смена становится Confirmed
   */
  async approveShift(shiftId: string, adminId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });

    if (shift.type !== ShiftType.Requested) {
      throw new BadRequestException('Можно одобрить только смены типа "Запрос"');
    }

    if (shift.status === ShiftStatus.Confirmed) {
      throw new BadRequestException('Эта смена уже одобрена');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { 
        status: ShiftStatus.Confirmed,
        type: ShiftType.Mandatory, // После одобрения админом это обязательная смена
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  async createPayrollDraftFromShift(shiftId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });

    if (shift.status !== ShiftStatus.Confirmed) {
      throw new BadRequestException('Только подтверждённая смена может переводиться в расчет зарплаты');
    }

    if (!shift.employeeId) {
      throw new BadRequestException('Смена должна быть назначена сотруднику для расчета зарплаты');
    }

    if (shift.endTime > new Date()) {
      throw new BadRequestException('Зарплата формируется только за прошедшие смены');
    }

    const existing = await this.prisma.payrollItem.findFirst({
      where: {
        employeeId: shift.employeeId,
        periodStart: shift.startTime,
        periodEnd: shift.endTime,
      },
    });

    if (existing) {
      return existing;
    }

    return this.salaryCalculationService.createPayrollItem(
      shift.employeeId,
      shift.startTime,
      shift.endTime,
    );
  }

  /**
   * Админ/HR может отклонить смену типа Requested (предложенную сотрудником)
   */
  async rejectShift(shiftId: string, adminId: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });

    if (shift.type !== ShiftType.Requested) {
      throw new BadRequestException('Можно отклонить только смены типа "Запрос"');
    }

    if (shift.status === ShiftStatus.Rejected) {
      throw new BadRequestException('Эта смена уже отклонена');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: { status: ShiftStatus.Rejected },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Получить доступные роли для выбора при создании смены
   */
  getAvailableRoles(): EmployeeRole[] {
    return Object.values(EmployeeRole);
  }

  /**
   * Получить первый доступный отдел (хелпер)
   */
  private async getFirstDepartmentId(): Promise<string> {
    const dept = await this.prisma.department.findFirst({
      select: { id: true },
    });
    if (!dept) {
      throw new BadRequestException('В системе нет ни одного отдела');
    }
    return dept.id;
  }

  /**
   * Обновить смену
   */
  async updateShift(shiftId: string, dto: any, userRole: Role, userEmployeeId?: string) {
    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
      include: { employee: true },
    });

    // Валидация времени, если обновляем
    if (dto.startTime && dto.endTime) {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);
      if (endTime <= startTime) {
        throw new BadRequestException('Время окончания должно быть позже времени начала');
      }
    }

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.role) updateData.role = dto.role;
    if (dto.startTime) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime) updateData.endTime = new Date(dto.endTime);
    if (dto.type) updateData.type = dto.type;
    if (typeof dto.canDecline === 'boolean') updateData.canDecline = dto.canDecline;
    if (dto.comment !== undefined) updateData.comment = dto.comment;
    if (dto.maxParticipants) updateData.maxParticipants = dto.maxParticipants;

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Удалить смену
   */
  async deleteShift(shiftId: string, userRole: Role) {
    if (!['Admin', 'HR'].includes(userRole)) {
      throw new ForbiddenException('Удалять смены может только администратор или HR');
    }

    const shift = await this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });

    return this.prisma.shift.delete({
      where: { id: shiftId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  private stripExchangeDeclinedMarker(comment?: string | null) {
    return (comment || '')
      .replace(ShiftsService.EXCHANGE_DECLINED_MARKER, '')
      .trim() || null;
  }

  private appendExchangeDeclinedMarker(comment?: string | null) {
    const cleaned = this.stripExchangeDeclinedMarker(comment);
    return [cleaned, ShiftsService.EXCHANGE_DECLINED_MARKER].filter(Boolean).join('\n');
  }

  /**
   * Опубликовать график на основе одобренных пожеланий
   * Создает смены для всех одобренных пожеланий
   */
  async publishScheduleFromPreferences(weekStart: string, adminId: string) {
    const weekStartDate = new Date(weekStart);

    // Получить все одобренные пожелания на эту неделю
    const approvedPreferences = await this.prisma.shiftPreference.findMany({
      where: {
        requestedDates: {
          contains: weekStart,
        },
        status: 'Approved',
      },
      include: {
        worker: {
          select: { id: true, firstName: true, lastName: true, departmentId: true },
        },
      },
    });

    if (approvedPreferences.length === 0) {
      throw new BadRequestException('Нет одобренных пожеланий для публикации');
    }

    const createdShifts: any[] = [];

    // Создать смену для каждого одобренного пожелания
    for (const pref of approvedPreferences) {
      const timeSlots = JSON.parse(pref.requestedDates);

      for (const slot of timeSlots) {
        const shiftDate = new Date(weekStartDate);
        shiftDate.setDate(shiftDate.getDate() + slot.dayOfWeek);

        // Определить время смены
        let startHour = 6;
        let endHour = 14;

        if (slot.shiftType === 'day') {
          startHour = 14;
          endHour = 22;
        } else if (slot.shiftType === 'evening') {
          startHour = 22;
          endHour = 6; // Ночная смена переходит на следующий день
        } else if (slot.shiftType === 'night') {
          startHour = 0;
          endHour = 8;
        }

        const startTime = new Date(shiftDate);
        startTime.setHours(startHour, 0, 0, 0);

        const endTime = new Date(shiftDate);
        if (endHour < startHour) {
          endTime.setDate(endTime.getDate() + 1);
        }
        endTime.setHours(endHour, 0, 0, 0);

        // Создать смену
        const shift = await this.prisma.shift.create({
          data: {
            employeeId: pref.workerId,
            departmentId: pref.worker.departmentId || (await this.getFirstDepartmentId()),
            startTime,
            endTime,
            status: ShiftStatus.Confirmed,
            type: ShiftType.Optional,
            role: EmployeeRole.Cashier,
            createdBy: adminId,
          },
        });

        createdShifts.push(shift);
      }
    }

    return {
      message: `✓ График опубликован! Создано ${createdShifts.length} смен`,
      shiftsCreated: createdShifts.length,
      weekStart: weekStart,
    };
  }
}
