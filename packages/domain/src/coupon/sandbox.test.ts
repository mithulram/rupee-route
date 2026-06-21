import { describe, expect, it } from 'vitest';
import { applyCouponMargin, listSandboxCoupons, validateSandboxCoupon } from './sandbox.js';

describe('sandbox coupons', () => {
  it('accepts valid coupon codes', () => {
    const coupon = validateSandboxCoupon('welcome10');
    expect(coupon?.code).toBe('WELCOME10');
    expect(coupon?.marginBpsReduction).toBe(10);
  });

  it('rejects unknown codes', () => {
    expect(validateSandboxCoupon('INVALID')).toBeNull();
  });

  it('rejects expired coupons', () => {
    expect(validateSandboxCoupon('SANDBOX20', new Date('2026-10-01'))).toBeNull();
  });

  it('applies margin reduction with floor', () => {
    const coupon = validateSandboxCoupon('SANDBOX20');
    expect(applyCouponMargin(75, coupon)).toBe(55);
    expect(applyCouponMargin(30, coupon)).toBe(25);
  });

  it('lists active coupons', () => {
    expect(listSandboxCoupons(new Date('2026-06-01'))).toHaveLength(2);
  });
});
