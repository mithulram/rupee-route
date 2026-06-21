import { describe, expect, it } from 'vitest';
import {
  buildFundingJournal,
  buildFxBookedJournal,
  buildPayoutJournal,
  buildRefundJournal,
  validateJournal,
} from './journal.js';

describe('ledger journal', () => {
  it('funding journal balances per currency', () => {
    const journal = buildFundingJournal({
      journalId: 'j1',
      transferId: 't1',
      idempotencyKey: 'idem-1',
      sourceAmountMinor: 10000n,
      sourceCurrency: 'EUR',
    });
    expect(() => validateJournal(journal)).not.toThrow();
  });

  it('fx booked journal balances EUR and INR legs', () => {
    const journal = buildFxBookedJournal({
      journalId: 'j2',
      transferId: 't1',
      idempotencyKey: 'idem-2',
      sourceAmountMinor: 10000n,
      sourceCurrency: 'EUR',
      targetAmountMinor: 900000n,
      marginMinor: 75n,
    });
    expect(() => validateJournal(journal)).not.toThrow();
  });

  it('payout journal balances INR', () => {
    const journal = buildPayoutJournal({
      journalId: 'j3',
      transferId: 't1',
      idempotencyKey: 'idem-3',
      targetAmountMinor: 900000n,
    });
    expect(() => validateJournal(journal)).not.toThrow();
  });

  it('refund journal balances source currency', () => {
    const journal = buildRefundJournal({
      journalId: 'j4',
      transferId: 't1',
      idempotencyKey: 'idem-4',
      sourceAmountMinor: 10000n,
      sourceCurrency: 'EUR',
    });
    expect(() => validateJournal(journal)).not.toThrow();
  });

  it('rejects unbalanced journal', () => {
    expect(() =>
      validateJournal({
        journalId: 'bad',
        transferId: 't1',
        idempotencyKey: 'idem-bad',
        lines: [
          {
            accountCode: 'A',
            direction: 'debit',
            amountMinor: 100n,
            currency: 'EUR',
            description: 'x',
          },
        ],
      }),
    ).toThrow(/at least two lines/);
  });
});
