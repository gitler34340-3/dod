import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { RequestCredentialChangeDto } from './dto/request-credential-change.dto';
import { ReviewCredentialChangeDto } from './dto/review-credential-change.dto';
import { UpdateUserCredentialsDto } from './dto/update-user-credentials.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Создать пользователя (логин/пароль для рабочего)' })
  create(@Body() dto: CreateUserDto, @CurrentUser('role') role: Role) {
    return this.users.create(dto, role);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Список пользователей' })
  findAll(@CurrentUser('role') role: Role) {
    return this.users.findAll(role);
  }

  @Post('me/credential-change-request')
  @ApiOperation({ summary: 'Запросить смену логина/пароля у менеджера' })
  requestCredentialChange(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestCredentialChangeDto,
  ) {
    return this.users.requestCredentialChange(userId, dto);
  }

  @Get('me/credential-change-request')
  @ApiOperation({ summary: 'Мои заявки на смену логина/пароля' })
  getMyCredentialRequests(@CurrentUser('id') userId: string) {
    return this.users.getMyCredentialRequests(userId);
  }

  @Get('credential-change-requests/all')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Все заявки на смену логина/пароля' })
  getCredentialRequests(@CurrentUser('role') role: Role) {
    return this.users.getCredentialRequests(role);
  }

  @Patch('credential-change-requests/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Одобрить или отклонить заявку на смену логина/пароля' })
  reviewCredentialRequest(
    @Param('id') id: string,
    @Body() dto: ReviewCredentialChangeDto,
    @CurrentUser('id') reviewerId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.users.reviewCredentialRequest(
      id,
      dto.status,
      reviewerId,
      role,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Пользователь по ID' })
  findOne(@Param('id') id: string, @CurrentUser('role') role: Role) {
    return this.users.findOne(id, role);
  }

  @Patch(':id/credentials')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR, Role.Manager)
  @ApiOperation({ summary: 'Изменить логин и/или пароль пользователя' })
  updateCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateUserCredentialsDto,
    @CurrentUser('role') role: Role,
  ) {
    return this.users.updateCredentials(id, dto, role);
  }
}
