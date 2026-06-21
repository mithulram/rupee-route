import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { QuotesModule } from './quotes/quotes.module';
import { RecipientsModule } from './recipients/recipients.module';
import { SecurityModule } from './security/security.module';
import { TransfersModule } from './transfers/transfers.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ConsumerSupportModule } from './consumer-support/consumer-support.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    SecurityModule,
    FeatureFlagsModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    ProfileModule,
    QuotesModule,
    RecipientsModule,
    TransfersModule,
    WebhooksModule,
    MonitoringModule,
    ConsumerSupportModule,
  ],
})
export class AppModule {}
