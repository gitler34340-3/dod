import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JobApplicationService } from './job-application.service';
import type { CreateJobApplicationDto, ReviewJobApplicationDto } from './job-application.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../domain/entities';

@Controller('job-applications')
export class JobApplicationController {
  constructor(private readonly jobApplicationService: JobApplicationService) {}

  // Создать заявку на работу (публичный эндпоинт)
  @Post()
  async createApplication(@Body() dto: CreateJobApplicationDto) {
    return this.jobApplicationService.createApplication(dto);
  }

  // Получить все заявки (только для администратора)
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllApplications(@CurrentUser() user: User) {
    if (!['Admin', 'HR'].includes(user.role)) {
      throw new ForbiddenException('Только админ может просматривать заявки');
    }
    return this.jobApplicationService.getAllApplications();
  }

  // Получить заявку по ID (только для администратора)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getApplicationById(@Param('id') id: string, @CurrentUser() user: User) {
    if (!['Admin', 'HR'].includes(user.role)) {
      throw new ForbiddenException('Только админ может просматривать заявки');
    }
    return this.jobApplicationService.getApplicationById(id);
  }

  // Рассмотреть заявку (только для администратора)
  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  async reviewApplication(
    @Param('id') id: string,
    @Body() dto: ReviewJobApplicationDto,
    @CurrentUser() user: User,
  ) {
    if (!['Admin', 'HR'].includes(user.role)) {
      throw new ForbiddenException('Только админ может рассматривать заявки');
    }
    return this.jobApplicationService.reviewApplication(id, dto, user.id);
  }

  // Удалить заявку (только для администратора)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteApplication(@Param('id') id: string, @CurrentUser() user: User) {
    if (!['Admin', 'HR'].includes(user.role)) {
      throw new ForbiddenException('Только админ может удалять заявки');
    }
    return this.jobApplicationService.deleteApplication(id);
  }
}
