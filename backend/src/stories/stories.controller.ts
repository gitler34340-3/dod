import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('stories')
@ApiBearerAuth()
@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Лента сторис (активные 24ч)' })
  feed(
    @CurrentUser('role') role: Role,
    @CurrentUser('employeeId') employeeId?: string,
  ) {
    return this.stories.feed(role, employeeId ?? null);
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

  @Patch('publish-permission/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.HR)
  @ApiOperation({ summary: 'Выдать/забрать право публикации сторис у сотрудника' })
  setPublishPermission(
    @Param('employeeId') employeeId: string,
    @Body() dto: { canPublishStories: boolean },
    @CurrentUser('role') role: Role,
  ) {
    return this.stories.setPublishPermission(role, employeeId, Boolean(dto?.canPublishStories));
  }

  @Post(':storyId/view')
  @ApiOperation({ summary: 'Отметить просмотр сторис' })
  markViewed(
    @Param('storyId') storyId: string,
    @CurrentUser('employeeId') employeeId?: string,
  ) {
    if (!employeeId) return { success: false };
    return this.stories.markViewed(storyId, employeeId);
  }

  @Post(':storyId/reaction')
  @ApiOperation({ summary: 'Поставить реакцию на сторис' })
  setReaction(
    @Param('storyId') storyId: string,
    @Body() dto: { emoji: string },
    @CurrentUser('employeeId') employeeId?: string,
  ) {
    if (!employeeId) return { success: false };
    return this.stories.setReaction(storyId, employeeId, dto?.emoji ?? '');
  }
}

