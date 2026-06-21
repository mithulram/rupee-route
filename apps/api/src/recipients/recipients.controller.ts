import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString, Matches, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Idempotent } from '../common/idempotency.interceptor';
import { RecipientsService } from './recipients.service';

class CreateRecipientDto {
  @IsIn(['bank_account', 'upi'])
  type!: 'bank_account' | 'upi';

  @IsString()
  displayName!: string;

  @IsString()
  accountHolder!: string;

  @ValidateIf((o: CreateRecipientDto) => o.type === 'bank_account')
  @IsString()
  ifsc?: string;

  @ValidateIf((o: CreateRecipientDto) => o.type === 'bank_account')
  @IsString()
  @Matches(/^\d{9,18}$/)
  accountNumber?: string;

  @ValidateIf((o: CreateRecipientDto) => o.type === 'upi')
  @IsString()
  upiId?: string;
}

@Controller('api/v1/recipients')
@UseGuards(JwtAuthGuard)
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}

  @Post()
  @Idempotent()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateRecipientDto) {
    return this.recipientsService.create(req.user.id, dto as never);
  }

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.recipientsService.list(req.user.id);
  }

  @Get(':id')
  get(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.recipientsService.get(req.user.id, id);
  }
}
