import { describe, expect, it } from 'vitest';
import { detectReconciliationMismatches } from './reconciliation.js';

describe('reconciliation mismatch detection', () => {
  it('returns no mismatches when ledger and provider entries align', () => {
    const mismatches = detectReconciliationMismatches(
      [
        {
          transferId: 'tr_1',
          amountMinor: 10000n,
          currency: 'EUR',
          entryType: 'funding',
        },
      ],
      [
        {
          transferId: 'tr_1',
          amountMinor: 10000n,
          currency: 'EUR',
          settlementStatus: 'settled',
        },
      ],
    );

    expect(mismatches).toEqual([]);
  });

  it('detects amount deltas between ledger and provider records', () => {
    const mismatches = detectReconciliationMismatches(
      [
        {
          transferId: 'tr_2',
          amountMinor: 10000n,
          currency: 'EUR',
          entryType: 'funding',
        },
      ],
      [
        {
          transferId: 'tr_2',
          amountMinor: 9950n,
          currency: 'EUR',
          settlementStatus: 'settled',
        },
      ],
    );

    expect(mismatches).toEqual([
      {
        transferId: 'tr_2',
        type: 'amount_delta',
        ledgerAmountMinor: 10000n,
        providerAmountMinor: 9950n,
        amountDeltaMinor: 50n,
        currency: 'EUR',
      },
    ]);
  });

  it('detects missing ledger entries for provider settlements', () => {
    const mismatches = detectReconciliationMismatches(
      [],
      [
        {
          transferId: 'tr_3',
          amountMinor: 5000n,
          currency: 'CHF',
          settlementStatus: 'settled',
        },
      ],
    );

    expect(mismatches).toEqual([
      {
        transferId: 'tr_3',
        type: 'missing_ledger',
        providerAmountMinor: 5000n,
        currency: 'CHF',
      },
    ]);
  });

  it('detects missing provider entries for ledger postings', () => {
    const mismatches = detectReconciliationMismatches(
      [
        {
          transferId: 'tr_4',
          amountMinor: 25000n,
          currency: 'INR',
          entryType: 'payout',
        },
      ],
      [],
    );

    expect(mismatches).toEqual([
      {
        transferId: 'tr_4',
        type: 'missing_provider',
        ledgerAmountMinor: 25000n,
        currency: 'INR',
      },
    ]);
  });

  it('detects currency mismatches before amount comparison', () => {
    const mismatches = detectReconciliationMismatches(
      [
        {
          transferId: 'tr_5',
          amountMinor: 10000n,
          currency: 'EUR',
          entryType: 'funding',
        },
      ],
      [
        {
          transferId: 'tr_5',
          amountMinor: 10000n,
          currency: 'CHF',
          settlementStatus: 'settled',
        },
      ],
    );

    expect(mismatches).toEqual([
      {
        transferId: 'tr_5',
        type: 'currency_mismatch',
        ledgerAmountMinor: 10000n,
        providerAmountMinor: 10000n,
        currency: 'EUR',
      },
    ]);
  });
});
