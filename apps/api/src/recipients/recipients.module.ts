import { Module } from '@nestjs/common';
import { RecipientsController } from './recipients.controller';
import { RecipientsService } from './recipients.service';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Module({
  controllers: [RecipientsController],
  providers: [RecipientsService, IdempotencyInterceptor],
})
export class RecipientsModule {}
