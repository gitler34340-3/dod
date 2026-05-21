import { Module } from '@nestjs/common';
import { AchievementsHrController } from './achievements-hr.controller';
import { AchievementsHrService } from './achievements-hr.service';

@Module({
  controllers: [AchievementsHrController],
  providers: [AchievementsHrService],
  exports: [AchievementsHrService],
})
export class AchievementsHrModule {}
