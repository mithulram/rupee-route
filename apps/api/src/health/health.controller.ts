import { Controller, Get, Inject } from '@nestjs/common';
import type { FeatureFlags } from '@rupeeroute/config';
import { FEATURE_FLAGS } from '../feature-flags/feature-flags.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(FEATURE_FLAGS) private readonly flags: FeatureFlags) {}

  @Get()
  getHealth() {
    return {
      status: 'ok' as const,
      service: 'api',
      sandboxMode: !this.flags.liveTransfersEnabled,
      liveTransfersEnabled: this.flags.liveTransfersEnabled,
      sandboxForceKycApproved: process.env.SANDBOX_FORCE_KYC_APPROVED === 'true',
    };
  }

  @Get('service-status')
  getServiceStatus() {
    return {
      status: 'operational' as const,
      environment: 'sandbox',
      corridors: ['DE-IN', 'CH-IN'],
      message:
        'All sandbox services operational. Delivery times vary; transfers are not guaranteed instant.',
      components: [
        { name: 'api', status: 'operational' },
        { name: 'fx-quotes', status: 'operational' },
        { name: 'funding', status: 'operational' },
        { name: 'payouts', status: 'operational' },
      ],
    };
  }
}
