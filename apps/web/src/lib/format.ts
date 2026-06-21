const MINOR_DIVISORS: Record<string, number> = { EUR: 100, CHF: 100, INR: 100 };

export function formatMoney(minor: string, currency: string): string {
  const divisor = MINOR_DIVISORS[currency] ?? 100;
  const major = Number(minor) / divisor;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(major);
}

export function toMinorUnits(amount: string, _currency: 'EUR' | 'CHF'): string {
  const parsed = Number.parseFloat(amount.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Invalid amount');
  const minor = Math.round(parsed * 100);
  return String(minor);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function isQuoteExpired(expiresAt: string): boolean {
  return Date.now() >= new Date(expiresAt).getTime();
}

export function quoteSecondsRemaining(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m)}:${String(s).padStart(2, '0')}`;
}
