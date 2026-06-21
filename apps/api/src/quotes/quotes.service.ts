import { Injectable, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  createQuote,
  assertSupportedCurrency,
  validateSandboxCoupon,
  applyCouponMargin,
} from '@rupeeroute/domain';
import { createSandboxProviders } from '@rupeeroute/provider-sdk';

@Injectable()
export class QuotesService {
  private readonly providers = createSandboxProviders();

  constructor(private readonly prisma: PrismaClient) {}

  async createQuote(
    userId: string,
    sourceCurrency: string,
    sourceAmountMinor: string,
    couponCode?: string,
  ) {
    const currency = assertSupportedCurrency(sourceCurrency);
    const amountMinor = BigInt(sourceAmountMinor);
    const coupon = validateSandboxCoupon(couponCode);
    if (couponCode && !coupon) {
      throw new BadRequestException('Coupon is invalid or expired');
    }

    const providerQuote = await this.providers.fxQuote.getQuote({
      sourceCurrency: currency,
      targetCurrency: 'INR',
      sourceAmountMinor: amountMinor,
    });

    const marginBps = applyCouponMargin(providerQuote.marginBps, coupon);

    const quote = createQuote({
      sourceCurrency: currency,
      sourceAmountMinor: amountMinor,
      targetCurrency: 'INR',
      marginBps,
      midRate: providerQuote.midRate,
    });

    const record = await this.prisma.quote.create({
      data: {
        userId,
        sourceCurrency: currency,
        targetCurrency: 'INR',
        sourceAmountMinor: amountMinor,
        targetAmountMinor: quote.target.amountMinor,
        midRate: quote.midRate,
        customerRate: quote.customerRate,
        marginBps: quote.marginBps,
        marginPercent: quote.marginPercent,
        couponCode: coupon?.code,
        expiresAt: quote.expiresAt,
      },
    });

    return this.serializeQuote(record, coupon?.label);
  }

  private serializeQuote(
    record: {
      id: string;
      sourceCurrency: string;
      targetCurrency: string;
      sourceAmountMinor: bigint;
      targetAmountMinor: bigint;
      midRate: string;
      customerRate: string;
      marginBps: number;
      marginPercent: string;
      couponCode: string | null;
      expiresAt: Date;
      createdAt: Date;
    },
    couponLabel?: string,
  ) {
    return {
      id: record.id,
      sourceCurrency: record.sourceCurrency,
      targetCurrency: record.targetCurrency,
      sourceAmountMinor: record.sourceAmountMinor.toString(),
      targetAmountMinor: record.targetAmountMinor.toString(),
      midRate: record.midRate,
      customerRate: record.customerRate,
      marginBps: record.marginBps,
      marginPercent: record.marginPercent,
      marginDisclosure: `Rate includes our margin of ${record.marginPercent}%`,
      couponCode: record.couponCode,
      couponLabel: couponLabel ?? null,
      expiresAt: record.expiresAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      deliveryEstimate: 'Typically 1–3 business days; not guaranteed instant.',
    };
  }
}
