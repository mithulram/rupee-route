import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { MonitoringService } from './monitoring.service';

@Controller('api/v1/admin/monitoring')
@UseGuards(RolesGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('alerts')
  @Roles('administrator')
  getActiveAlerts() {
    return this.monitoringService.getActiveAlerts();
  }
}
