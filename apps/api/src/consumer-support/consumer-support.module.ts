import { Module } from '@nestjs/common';
import { ConsumerSupportController } from './consumer-support.controller';
import { ConsumerSupportService } from './consumer-support.service';

@Module({
  controllers: [ConsumerSupportController],
  providers: [ConsumerSupportService],
})
export class ConsumerSupportModule {}
