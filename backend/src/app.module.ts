import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DataModule } from './data/data.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { AchievementsHrModule } from './achievements-hr/achievements-hr.module';
import { ShiftsModule } from './shifts/shifts.module';
import { DocumentsModule } from './documents/documents.module';
import { StoriesModule } from './stories/stories.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DataModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule,
    AchievementsHrModule,
    ShiftsModule,
    DocumentsModule,
    StoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
