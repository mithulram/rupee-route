import { describe, expect, it } from 'vitest';
import { addMoney, createMoney } from './index.js';

describe('money', () => {
  it('stores amounts as integer minor units', () => {
    const money = createMoney(1050n, 'EUR');
    expect(money.amountMinor).toBe(1050n);
    expect(money.currency).toBe('EUR');
  });

  it('rejects unsupported currencies', () => {
    expect(() => createMoney(100n, 'USD')).toThrow(/Unsupported currency/);
  });

  it('adds same-currency amounts', () => {
    const result = addMoney(createMoney(100n, 'CHF'), createMoney(50n, 'CHF'));
    expect(result.amountMinor).toBe(150n);
  });
});
