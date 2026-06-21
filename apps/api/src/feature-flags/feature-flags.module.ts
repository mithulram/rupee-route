import { Global, Module } from '@nestjs/common';
import { apiEnvSchema, parseEnv, resolveFeatureFlags } from '@rupeeroute/config';

export const FEATURE_FLAGS = 'FEATURE_FLAGS';
export const API_ENV = 'API_ENV';

@Global()
@Module({
  providers: [
    {
      provide: API_ENV,
      useFactory: () => parseEnv(apiEnvSchema),
    },
    {
      provide: FEATURE_FLAGS,
      inject: [API_ENV],
      useFactory: (env: ReturnType<typeof parseEnv<typeof apiEnvSchema>>) =>
        resolveFeatureFlags(env),
    },
  ],
  exports: [FEATURE_FLAGS, API_ENV],
})
export class FeatureFlagsModule {}
