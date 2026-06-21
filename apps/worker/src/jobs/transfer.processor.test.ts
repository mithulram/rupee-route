import { describe, expect, it, vi } from 'vitest';
import { TransferProcessor } from './transfer.processor.js';

function mockPrisma() {
  const transfer = {
    id: 'tr_1',
    userId: 'user_1',
    quoteId: 'q_1',
    recipientId: 'rec_1',
    state: 'funding_pending',
    correlationId: 'corr_1',
    quote: {
      sourceAmountMinor: 10000n,
      targetAmountMinor: 900000n,
      sourceCurrency: 'EUR',
      marginBps: 75,
    },
  };

  return {
    transfer: { ...transfer },
    webhookEvent: {
      findUnique: vi.fn().mockResolvedValue({ providerEventId: 'evt_1', processed: false }),
      update: vi.fn().mockResolvedValue({}),
    },
    transferModel: {
      findUnique: vi
        .fn()
        .mockImplementation(() => Promise.resolve({ ...transfer, quote: transfer.quote })),
      update: vi.fn().mockImplementation(async ({ data }: { data: { state: string } }) => {
        transfer.state = data.state;
        return { ...transfer };
      }),
    },
    ledgerAccount: {
      findUnique: vi.fn().mockResolvedValue({ id: 'acct_1', code: 'SANDBOX_CUSTOMER_FUNDING' }),
    },
    ledgerEntry: { create: vi.fn().mockResolvedValue({}) },
    auditEvent: { create: vi.fn().mockResolvedValue({}) },
    transferStateHistory: { create: vi.fn() },
  };
}

describe('TransferProcessor', () => {
  it('processes funding.received webhook', async () => {
    const mocks = mockPrisma();
    const prisma = {
      webhookEvent: mocks.webhookEvent,
      transfer: mocks.transferModel,
      ledgerAccount: mocks.ledgerAccount,
      ledgerEntry: mocks.ledgerEntry,
      auditEvent: mocks.auditEvent,
    } as never;

    const processor = new TransferProcessor(prisma);
    const result = await processor.processWebhook({
      eventId: 'evt_1',
      eventType: 'funding.received',
      transferId: 'tr_1',
      correlationId: 'corr_1',
      occurredAt: new Date().toISOString(),
    });

    expect(result.processed).toBe(true);
    expect(mocks.transferModel.update).toHaveBeenCalled();
  });

  it('ignores duplicate processed webhook', async () => {
    const mocks = mockPrisma();
    mocks.webhookEvent.findUnique.mockResolvedValue({ processed: true });
    const prisma = {
      webhookEvent: mocks.webhookEvent,
      transfer: mocks.transferModel,
    } as never;

    const processor = new TransferProcessor(prisma);
    const result = await processor.processWebhook({
      eventId: 'evt_dup',
      eventType: 'funding.received',
      transferId: 'tr_1',
      correlationId: 'corr_1',
      occurredAt: new Date().toISOString(),
    });

    expect(result.processed).toBe(false);
    expect(result.reason).toBe('duplicate_already_processed');
  });

  it('processes funding.failed webhook', async () => {
    const mocks = mockPrisma();
    const prisma = {
      webhookEvent: mocks.webhookEvent,
      transfer: mocks.transferModel,
      ledgerAccount: mocks.ledgerAccount,
      ledgerEntry: mocks.ledgerEntry,
      auditEvent: mocks.auditEvent,
    } as never;

    const processor = new TransferProcessor(prisma);
    const result = await processor.processWebhook({
      eventId: 'evt_fail',
      eventType: 'funding.failed',
      transferId: 'tr_1',
      correlationId: 'corr_1',
      occurredAt: new Date().toISOString(),
    });

    expect(result.processed).toBe(true);
    expect(mocks.transferModel.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ state: 'funding_failed' }) }),
    );
  });

  it('ignores out-of-order webhook', async () => {
    const mocks = mockPrisma();
    mocks.transferModel.findUnique.mockResolvedValue({
      id: 'tr_1',
      userId: 'user_1',
      quoteId: 'q_1',
      recipientId: 'rec_1',
      state: 'funding_pending',
      correlationId: 'corr_1',
      quote: null,
    });
    const prisma = {
      webhookEvent: mocks.webhookEvent,
      transfer: mocks.transferModel,
    } as never;

    const processor = new TransferProcessor(prisma);
    const result = await processor.processWebhook({
      eventId: 'evt_ooo',
      eventType: 'payout.delivered',
      transferId: 'tr_1',
      correlationId: 'corr_1',
      occurredAt: new Date().toISOString(),
    });

    expect(result.processed).toBe(false);
    expect(result.reason).toBe('out_of_order_or_irrelevant');
  });
});
