import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Создать сотрудника' })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser('role') role: Role) {
    return this.employees.create(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'Список сотрудников' })
  findAll(@CurrentUser('role') role: Role) {
    return this.employees.findAll(role);
  }

  @Get('employee-of-month/current')
  @ApiOperation({ summary: 'Текущий работник месяца' })
  getEmployeeOfMonth() {
    return this.employees.getEmployeeOfMonth();
  }

  @Post('employee-of-month')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Назначить работника месяца' })
  setEmployeeOfMonth(
    @Body() dto: { employeeId: string; month: number; year: number; title?: string; message?: string },
    @CurrentUser('role') role: Role,
    @CurrentUser('employeeId') selectedByEmployeeId?: string,
  ) {
    return this.employees.setEmployeeOfMonth(dto.employeeId, dto, role, selectedByEmployeeId ?? null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Сотрудник по ID' })
  findOne(@Param('id') id: string) {
    return this.employees.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Обновить сотрудника' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser('role') role: Role,
  ) {
    return this.employees.update(id, dto, role);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Обновить свой профиль сотрудника' })
  updateMyProfile(
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser('employeeId') employeeId?: string,
  ) {
    if (!employeeId) {
      throw new ForbiddenException('Профиль сотрудника не найден');
    }
    return this.employees.updateMyProfile(employeeId, dto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Обновить аватар своего профиля' })
  updateMyAvatar(
    @Body() dto: { fileUrl: string; fileName?: string; zoom?: number; offsetX?: number; offsetY?: number },
    @CurrentUser('employeeId') employeeId?: string,
  ) {
    if (!employeeId) {
      throw new ForbiddenException('Профиль сотрудника не найден');
    }
    return this.employees.updateMyAvatar(employeeId, dto);
  }

  @Get(':id/avatar')
  @ApiOperation({ summary: 'Получить аватар сотрудника' })
  getAvatar(@Param('id') id: string) {
    return this.employees.getEmployeeAvatar(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Удалить сотрудника' })
  remove(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.employees.remove(id, role);
  }

  @Post(':id/terminate')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Уволить сотрудника (создаёт документ) ' })
  terminate(
    @Param('id') id: string,
    @Body() dto: TerminateEmployeeDto,
    @CurrentUser('role') role: Role,
    @CurrentUser('id') userId: string,
  ) {
    return this.employees.terminate(id, dto, role, userId);
  }
}
