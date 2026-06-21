/** Client-safe rate preview (mirrors @rupeeroute/domain quote engine). */

const MID_RATES: Record<string, string> = {
  'EUR:INR': '90.2500',
  'CHF:INR': '94.1000',
};

export function previewQuote(
  currency: 'EUR' | 'CHF',
  amountMinor: bigint,
  marginBps = 75,
): { customerRate: string; targetMinor: bigint; marginPercent: string } {
  const midRate = MID_RATES[`${currency}:INR`] ?? '90.2500';
  const mid = Number(midRate);
  const customer = mid * (1 - marginBps / 10_000);
  const customerRate = customer.toFixed(4);
  const [whole = '0', frac = ''] = customerRate.split('.');
  const rateScaled = BigInt(`${whole}${frac.padEnd(4, '0').slice(0, 4)}`);
  const targetMinor = (amountMinor * rateScaled) / 10000n;
  return {
    customerRate,
    targetMinor,
    marginPercent: (marginBps / 100).toFixed(2),
  };
}
