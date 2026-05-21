import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';

@ApiTags('stories')
@ApiBearerAuth()
@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Лента сторис (активные 24ч)' })
  feed() {
    return this.stories.feed();
  }

  @Post()
  @ApiOperation({ summary: 'Опубликовать сторис' })
  create(
    @Body() dto: CreateStoryDto,
    @CurrentUser('role') role: Role,
    @CurrentUser('employeeId') employeeId?: string,
  ) {
    return this.stories.create(dto, role, employeeId ?? null);
  }
}

