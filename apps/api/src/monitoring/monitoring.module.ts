import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, RolesGuard],
  exports: [MonitoringService],
})
export class MonitoringModule {}
