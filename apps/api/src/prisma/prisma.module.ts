import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@rupeeroute/domain';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}
