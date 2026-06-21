import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, IdempotencyInterceptor],
})
export class QuotesModule {}
