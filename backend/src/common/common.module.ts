import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { AuthGuard } from './guards/auth.guard';
import { ManagerGuard } from './guards/manager.guard';

@Module({
  imports: [DataModule],
  providers: [AuthGuard, ManagerGuard],
  exports: [AuthGuard, ManagerGuard],
})
export class CommonModule {}
