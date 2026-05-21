import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { DocumentsModule } from '../documents/documents.module';
import { AchievementsHrModule } from '../achievements-hr/achievements-hr.module';

@Module({
  imports: [DocumentsModule, AchievementsHrModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
