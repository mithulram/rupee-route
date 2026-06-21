import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Idempotent } from '../common/idempotency.interceptor';
import { TransfersService } from './transfers.service';

class CreateTransferDto {
  @IsString()
  quoteId!: string;
}

class AttachRecipientDto {
  @IsString()
  recipientId!: string;
}

@Controller('api/v1/transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.transfersService.listTransfers(req.user.id);
  }

  @Post()
  @Idempotent()
  createDraft(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateTransferDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key header required');
    return this.transfersService.createDraft(req.user.id, dto.quoteId, idempotencyKey);
  }

  @Post(':id/recipient')
  @Idempotent()
  attachRecipient(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: AttachRecipientDto,
  ) {
    return this.transfersService.attachRecipient(req.user.id, id, dto.recipientId);
  }

  @Post(':id/confirm')
  @Idempotent()
  confirm(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.transfersService.confirm(req.user.id, id);
  }

  @Post(':id/cancel')
  @Idempotent()
  cancel(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.transfersService.cancel(req.user.id, id);
  }

  @Get(':id')
  get(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.transfersService.getTransfer(req.user.id, id);
  }
}
