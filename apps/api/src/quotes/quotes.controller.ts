import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Idempotent } from '../common/idempotency.interceptor';
import { listSandboxCoupons } from '@rupeeroute/domain';
import { QuotesService } from './quotes.service';

class CreateQuoteDto {
  @IsIn(['EUR', 'CHF'])
  sourceCurrency!: 'EUR' | 'CHF';

  @IsString()
  @Matches(/^\d+$/)
  sourceAmountMinor!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}

@Controller('api/v1/quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('coupons')
  listCoupons() {
    return { coupons: listSandboxCoupons() };
  }

  @Post()
  @Idempotent()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateQuoteDto) {
    return this.quotesService.createQuote(
      req.user.id,
      dto.sourceCurrency,
      dto.sourceAmountMinor,
      dto.couponCode,
    );
  }
}
