import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ShiftTemplateService } from './shift-template.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ManagerGuard } from '../common/guards/manager.guard';
import { Role } from '@prisma/client';

interface CurrentUserWithId {
  id: string;
  email: string;
  role: Role;
  employee?: { id: string; departmentId: string };
}

@Controller('shift-templates')
export class ShiftTemplateController {
  constructor(private readonly templateService: ShiftTemplateService) {}

  /**
   * Get available predefined templates
   */
  @Get('predefined')
  @UseGuards(JwtAuthGuard)
  getPredefinedTemplates() {
    return this.templateService.getAvailableTemplates();
  }

  /**
   * Get custom templates for department
   */
  @Get('department/:departmentId')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async getTemplatesForDepartment(@Param('departmentId') departmentId: string) {
    return this.templateService.getTemplatesForDepartment(departmentId);
  }

  /**
   * Save custom template
   */
  @Post()
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async saveTemplate(
    @Body()
    dto: {
      departmentId: string;
      name: string;
      pattern: string;
    },
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (!user.employee?.id) {
      throw new ForbiddenException('Менеджер не найден');
    }

    return this.templateService.saveTemplate(
      dto.departmentId,
      user.employee.id,
      dto.name,
      dto.pattern,
      user.role,
    );
  }

  /**
   * Apply template to fill month with shifts
   * Query params: year (number), month (0-11)
   */
  @Post(':templateId/apply-month')
  @UseGuards(JwtAuthGuard, ManagerGuard)
  async applyTemplateToMonth(
    @Param('templateId') templateId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('departmentId') departmentId: string,
    @CurrentUser() user: CurrentUserWithId,
  ) {
    if (!user.employee?.id) {
      throw new ForbiddenException('Менеджер не найден');
    }

    return this.templateService.applyTemplateToMonth(
      departmentId,
      user.employee.id,
      templateId,
      parseInt(year, 10),
      parseInt(month, 10),
      user.role,
    );
  }
}
