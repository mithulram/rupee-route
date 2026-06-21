import { createMoney, type Money } from '../money/index.js';
import type { SupportedCurrency } from '../currency/index.js';

export interface QuoteInput {
  sourceCurrency: SupportedCurrency;
  sourceAmountMinor: bigint;
  targetCurrency: 'INR';
  marginBps?: number;
  midRate?: string;
  now?: Date;
  ttlSeconds?: number;
}

export interface QuoteResult {
  source: Money;
  target: Money;
  midRate: string;
  customerRate: string;
  marginBps: number;
  marginPercent: string;
  expiresAt: Date;
}

const MID_RATES: Record<string, string> = {
  'EUR:INR': '90.2500',
  'CHF:INR': '94.1000',
};

const DEFAULT_MARGIN_BPS = 75;
const DEFAULT_TTL_SECONDS = 900;

/** Multiply rate (4 decimal string) by amount using integer math. */
export function applyRate(
  amountMinor: bigint,
  rate: string,
  sourceDecimals = 2,
  targetDecimals = 2,
): bigint {
  const [whole = '0', frac = ''] = rate.split('.');
  const rateScaled = BigInt(`${whole}${frac.padEnd(4, '0').slice(0, 4)}`);
  const scale = 10n ** BigInt(4 + sourceDecimals - targetDecimals);
  return (amountMinor * rateScaled) / scale;
}

export function computeCustomerRate(midRate: string, marginBps: number): string {
  const mid = Number(midRate);
  const customer = mid * (1 - marginBps / 10_000);
  return customer.toFixed(4);
}

export function formatMarginPercent(marginBps: number): string {
  return (marginBps / 100).toFixed(2);
}

export function getMidRate(source: SupportedCurrency, target: SupportedCurrency): string {
  const key = `${source}:${target}`;
  const rate = MID_RATES[key];
  if (!rate) throw new Error(`No mid rate for ${key}`);
  return rate;
}

export function createQuote(input: QuoteInput): QuoteResult {
  if (input.sourceCurrency !== 'EUR' && input.sourceCurrency !== 'CHF') {
    throw new Error('Quote corridor supports EUR or CHF source only');
  }
  if (input.sourceAmountMinor <= 0n) {
    throw new Error('Source amount must be positive');
  }

  const marginBps = input.marginBps ?? DEFAULT_MARGIN_BPS;
  const midRate = input.midRate ?? getMidRate(input.sourceCurrency, input.targetCurrency);
  const customerRate = computeCustomerRate(midRate, marginBps);
  const targetMinor = applyRate(input.sourceAmountMinor, customerRate);
  const now = input.now ?? new Date();
  const ttl = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  return {
    source: createMoney(input.sourceAmountMinor, input.sourceCurrency),
    target: createMoney(targetMinor, 'INR'),
    midRate,
    customerRate,
    marginBps,
    marginPercent: formatMarginPercent(marginBps),
    expiresAt: new Date(now.getTime() + ttl * 1000),
  };
}

export function isQuoteExpired(expiresAt: Date, now = new Date()): boolean {
  return now >= expiresAt;
}

export function assertQuoteActive(expiresAt: Date, now = new Date()): void {
  if (isQuoteExpired(expiresAt, now)) {
    throw new Error('Quote has expired; request a new quote');
  }
}
