import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Создать расчёт зарплаты' })
  create(@Body() dto: CreatePayrollDto, @CurrentUser('role') role: Role) {
    return this.payroll.create(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'Список расчётов (фильтры: employeeId, departmentId, status)' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.payroll.findAll({ employeeId, departmentId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Расчёт по ID' })
  findOne(@Param('id') id: string) {
    return this.payroll.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Утвердить расчёт' })
  approve(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.payroll.approve(id, role);
  }

  @Patch(':id/paid')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Отметить как выплачено' })
  markPaid(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.payroll.markPaid(id, role);
  }
}
