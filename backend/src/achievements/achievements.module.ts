import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AchievementsController } from './achievements.controller';

@Module({
  imports: [CommonModule],
  controllers: [AchievementsController],
})
export class AchievementsModule {}
