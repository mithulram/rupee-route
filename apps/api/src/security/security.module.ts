import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { buildThrottlerConfig } from './throttler.config';

@Module({
  imports: [ThrottlerModule.forRoot(buildThrottlerConfig())],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [ThrottlerModule],
})
export class SecurityModule {}
