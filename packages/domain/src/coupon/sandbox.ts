export interface SandboxCoupon {
  code: string;
  marginBpsReduction: number;
  label: string;
  expiresAt: Date | null;
}

const SANDBOX_COUPONS: Record<string, Omit<SandboxCoupon, 'code'>> = {
  WELCOME10: {
    marginBpsReduction: 10,
    label: 'Welcome rate — 0.10% margin reduction',
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
  },
  SANDBOX20: {
    marginBpsReduction: 20,
    label: 'Sandbox promo — 0.20% margin reduction',
    expiresAt: new Date('2026-09-30T23:59:59.000Z'),
  },
};

const MIN_MARGIN_BPS = 25;

export function validateSandboxCoupon(
  code: string | undefined,
  now = new Date(),
): SandboxCoupon | null {
  if (!code?.trim()) return null;
  const normalized = code.trim().toUpperCase();
  const entry = SANDBOX_COUPONS[normalized];
  if (!entry) return null;
  if (entry.expiresAt && now > entry.expiresAt) return null;
  return { code: normalized, ...entry };
}

export function applyCouponMargin(marginBps: number, coupon: SandboxCoupon | null): number {
  if (!coupon) return marginBps;
  return Math.max(MIN_MARGIN_BPS, marginBps - coupon.marginBpsReduction);
}

export function listSandboxCoupons(now = new Date()): SandboxCoupon[] {
  return Object.entries(SANDBOX_COUPONS)
    .map(([code, meta]) => ({ code, ...meta }))
    .filter((c) => !c.expiresAt || now <= c.expiresAt);
}
