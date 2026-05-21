import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollModule } from '../payroll/payroll.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShiftsController } from './shifts.controller';
import { ShiftTemplateController } from './shift-template.controller';
import { ShiftsService } from './shifts.service';
import { ShiftTemplateService } from './shift-template.service';

@Module({
  imports: [CommonModule, PrismaModule, PayrollModule, NotificationsModule],
  controllers: [ShiftsController, ShiftTemplateController],
  providers: [ShiftsService, ShiftTemplateService],
  exports: [ShiftsService, ShiftTemplateService],
})
export class ShiftsModule {}


