import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Создать запись посещаемости' })
  create(@Body() dto: CreateAttendanceDto, @CurrentUser('role') role: Role) {
    return this.attendance.create(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'Список посещаемости (фильтры: employeeId, from, to)' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendance.findAll({ employeeId, from, to });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Запись по ID' })
  findOne(@Param('id') id: string) {
    return this.attendance.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Обновить запись' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser('role') role: Role,
  ) {
    return this.attendance.update(id, dto, role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Удалить запись' })
  remove(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.attendance.remove(id, role);
  }
}
