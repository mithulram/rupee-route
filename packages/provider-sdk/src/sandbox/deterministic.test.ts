import { describe, expect, it } from 'vitest';
import { createDeterministicSandboxProviders } from './deterministic.js';

describe('deterministic sandbox providers', () => {
  const ctx = { correlationId: 'corr_1', idempotencyKey: 'key_1' };

  it('returns funding failed for funding_failed scenario', async () => {
    const providers = createDeterministicSandboxProviders('seed', 'funding_failed');
    const result = await providers.funding.initiateFunding(
      'tr_fail',
      { amountMinor: 10000n, currency: 'EUR' },
      { ...ctx, idempotencyKey: 'fund_tr_fail' },
    );
    expect(result.status).toBe('failed');
  });

  it('holds screening for compliance_hold scenario', async () => {
    const providers = createDeterministicSandboxProviders('seed', 'compliance_hold');
    const result = await providers.screening.screenTransfer('tr_hold', ctx);
    expect(result.status).toBe('held');
  });

  it('fails payout for payout_failed scenario', async () => {
    const providers = createDeterministicSandboxProviders('seed', 'payout_failed');
    const result = await providers.payout.initiatePayout(
      'rec_1',
      { amountMinor: 900000n, currency: 'INR' },
      { ...ctx, idempotencyKey: 'payout_tr_po_fail' },
    );
    expect(result.status).toBe('failed');
  });

  it('uses integer minor units for FX quotes', async () => {
    const providers = createDeterministicSandboxProviders('seed', 'happy_path');
    const quote = await providers.fxQuote.getQuote({
      sourceCurrency: 'EUR',
      targetCurrency: 'INR',
      sourceAmountMinor: 10000n,
    });
    expect(typeof quote.targetAmountMinor).toBe('bigint');
    expect(quote.marginBps).toBeGreaterThan(0);
  });
});
