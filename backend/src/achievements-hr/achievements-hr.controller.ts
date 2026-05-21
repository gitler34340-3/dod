import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsHrService } from './achievements-hr.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { AssignAchievementDto } from './dto/assign-achievement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('achievements')
@ApiBearerAuth()
@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsHrController {
  constructor(private readonly achievements: AchievementsHrService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Создать тип достижения' })
  createAchievement(@Body() dto: CreateAchievementDto, @CurrentUser('role') role: Role) {
    return this.achievements.createAchievement(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'Список типов достижений' })
  findAllAchievements() {
    return this.achievements.findAllAchievements();
  }

  @Get('by-employee/:employeeId')
  @ApiOperation({ summary: 'Достижения сотрудника' })
  getEmployeeAchievements(@Param('employeeId') employeeId: string) {
    return this.achievements.getEmployeeAchievements(employeeId);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Все назначения достижений сотрудникам' })
  getAllEmployeeAchievements() {
    return this.achievements.getAllEmployeeAchievements();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Тип достижения по ID' })
  findOneAchievement(@Param('id') id: string) {
    return this.achievements.findOneAchievement(id);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Назначить достижение сотруднику' })
  assign(@Body() dto: AssignAchievementDto, @CurrentUser('role') role: Role) {
    return this.achievements.assignToEmployee(dto, role);
  }
}
