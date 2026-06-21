import { describe, expect, it } from 'vitest';
import { validateRecipientInput } from './validation.js';

describe('recipient validation', () => {
  it('accepts valid bank account', () => {
    expect(() =>
      validateRecipientInput({
        type: 'bank_account',
        displayName: 'Family',
        accountHolder: 'Raj Kumar',
        ifsc: 'HDFC0001234',
        accountNumber: '123456789012',
      }),
    ).not.toThrow();
  });

  it('accepts valid UPI', () => {
    expect(() =>
      validateRecipientInput({
        type: 'upi',
        displayName: 'Friend',
        accountHolder: 'Priya',
        upiId: 'priya@upi',
      }),
    ).not.toThrow();
  });

  it('rejects invalid IFSC', () => {
    expect(() =>
      validateRecipientInput({
        type: 'bank_account',
        displayName: 'X',
        accountHolder: 'Y',
        ifsc: 'BAD',
        accountNumber: '123456789012',
      }),
    ).toThrow(/IFSC/);
  });
});
