export const SUPPORTED_CURRENCIES = ['EUR', 'CHF', 'INR'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function assertSupportedCurrency(value: string): SupportedCurrency {
  if (!isSupportedCurrency(value)) {
    throw new Error(`Unsupported currency: ${value}. Allowed: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  return value;
}
