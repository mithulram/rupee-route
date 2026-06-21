import { describe, expect, it } from 'vitest';
import { createQuote, isQuoteExpired, applyRate, computeCustomerRate } from './engine.js';

describe('quote engine', () => {
  it('computes EUR→INR quote without floating point storage', () => {
    const quote = createQuote({
      sourceCurrency: 'EUR',
      sourceAmountMinor: 10000n,
      targetCurrency: 'INR',
      marginBps: 75,
      midRate: '90.2500',
      now: new Date('2026-01-01T00:00:00Z'),
      ttlSeconds: 900,
    });

    expect(quote.source.amountMinor).toBe(10000n);
    expect(quote.target.currency).toBe('INR');
    expect(quote.target.amountMinor).toBeGreaterThan(0n);
    expect(quote.marginPercent).toBe('0.75');
    expect(quote.customerRate).toBe(computeCustomerRate('90.2500', 75));
    expect(Number.isInteger(Number(quote.target.amountMinor))).toBe(true);
  });

  it('computes CHF→INR quote', () => {
    const quote = createQuote({
      sourceCurrency: 'CHF',
      sourceAmountMinor: 50000n,
      targetCurrency: 'INR',
      marginBps: 75,
      midRate: '94.1000',
    });
    expect(quote.target.currency).toBe('INR');
  });

  it('detects quote expiry', () => {
    const expiresAt = new Date('2026-01-01T00:15:00Z');
    expect(isQuoteExpired(expiresAt, new Date('2026-01-01T00:16:00Z'))).toBe(true);
    expect(isQuoteExpired(expiresAt, new Date('2026-01-01T00:10:00Z'))).toBe(false);
  });

  it('uses integer math for rate application', () => {
    const result = applyRate(10000n, '90.2500');
    expect(typeof result).toBe('bigint');
  });

  it('requires re-quote after expiry', () => {
    const quote = createQuote({
      sourceCurrency: 'EUR',
      sourceAmountMinor: 10000n,
      targetCurrency: 'INR',
      marginBps: 75,
      midRate: '90.2500',
      now: new Date('2026-01-01T00:00:00Z'),
      ttlSeconds: 900,
    });
    expect(isQuoteExpired(quote.expiresAt, new Date('2026-01-01T00:20:00Z'))).toBe(true);
    const requote = createQuote({
      sourceCurrency: 'EUR',
      sourceAmountMinor: 10000n,
      targetCurrency: 'INR',
      marginBps: 75,
      midRate: '90.2500',
      now: new Date('2026-01-01T00:20:00Z'),
    });
    expect(requote.expiresAt.getTime()).toBeGreaterThan(quote.expiresAt.getTime());
  });
});
