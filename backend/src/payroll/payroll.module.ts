import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DataModule } from '../data/data.module';
import { CommonModule } from '../common/common.module';
import { PayrollController } from './payroll.controller';
import { SalaryController } from './salary.controller';
import { PayrollService } from './payroll.service';
import { SalaryCalculationService } from './salary-calculation.service';

@Module({
  imports: [PrismaModule, DataModule, CommonModule],
  controllers: [PayrollController, SalaryController],
  providers: [PayrollService, SalaryCalculationService],
  exports: [PayrollService, SalaryCalculationService],
})
export class PayrollModule {}


