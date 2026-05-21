import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Создать отдел' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список отделов' })
  findAll() {
    return this.departments.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отдел по ID' })
  findOne(@Param('id') id: string) {
    return this.departments.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Обновить отдел' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departments.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Удалить отдел' })
  remove(@Param('id') id: string) {
    return this.departments.remove(id);
  }
}
