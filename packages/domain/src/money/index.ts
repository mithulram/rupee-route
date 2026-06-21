import { assertSupportedCurrency, type SupportedCurrency } from '../currency/index.js';

export interface Money {
  /** Integer minor units (e.g. cents, paise). Never use floats for money. */
  amountMinor: bigint;
  currency: SupportedCurrency;
}

export function createMoney(amountMinor: bigint, currency: string): Money {
  return {
    amountMinor,
    currency: assertSupportedCurrency(currency),
  };
}

export function formatMoney(money: Money): string {
  const decimals = money.currency === 'INR' ? 2 : 2;
  const major = Number(money.amountMinor) / 10 ** decimals;
  return `${major.toFixed(decimals)} ${money.currency}`;
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add ${a.currency} and ${b.currency}`);
  }
  return createMoney(a.amountMinor + b.amountMinor, a.currency);
}
