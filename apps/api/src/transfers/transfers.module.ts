import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Module({
  controllers: [TransfersController],
  providers: [TransfersService, IdempotencyInterceptor],
  exports: [TransfersService],
})
export class TransfersModule {}
