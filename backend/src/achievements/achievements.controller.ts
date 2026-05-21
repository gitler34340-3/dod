import { Controller, Get, UseGuards } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '../domain/entities';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly data: DataService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: User) {
    return this.data.getAchievementsForTeam(user.teamId);
  }
}
