const CURRENCY_DECIMALS: Record<string, number> = {
  EUR: 2,
  CHF: 2,
  INR: 2,
};

export function formatMinorAmount(amountMinor: string, currency: string): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const value = Number(amountMinor) / 10 ** decimals;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function parseMajorToMinor(amount: string, currency: 'EUR' | 'CHF'): string {
  const normalized = amount.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Enter a valid amount');
  }
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return String(Math.round(parsed * 10 ** decimals));
}

export function formatTransferState(state: string): string {
  return state
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
