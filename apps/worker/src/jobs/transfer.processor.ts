import {
  PrismaClient,
  type Prisma,
  applyTransition,
  nextStateAfterWebhook,
  mapFundingReceivedNext,
  mapFxBookedNext,
  mapPayoutFailedNext,
  buildFundingJournal,
  buildFxBookedJournal,
  buildPayoutJournal,
  buildRefundJournal,
  type TransferState,
  buildAuditEvent,
} from '@rupeeroute/domain';
import type { ProviderWebhookPayload } from '@rupeeroute/provider-sdk';
import { createSandboxProviders } from '@rupeeroute/provider-sdk';
import { createLogger, type Logger } from '@rupeeroute/observability';

export class TransferProcessor {
  private readonly logger: Logger;
  private readonly providers = createSandboxProviders();

  constructor(private readonly prisma: PrismaClient) {
    this.logger = createLogger({ service: 'transfer-processor' });
  }

  async processWebhook(
    payload: ProviderWebhookPayload,
  ): Promise<{ processed: boolean; reason?: string }> {
    const stored = await this.prisma.webhookEvent.findUnique({
      where: { providerEventId: payload.eventId },
    });

    if (stored?.processed) {
      return { processed: false, reason: 'duplicate_already_processed' };
    }

    const transfer = await this.prisma.transfer.findUnique({ where: { id: payload.transferId } });
    if (!transfer) {
      return { processed: false, reason: 'transfer_not_found' };
    }

    const current = transfer.state as TransferState;
    const next = nextStateAfterWebhook(current, payload.eventType);

    if (!next) {
      this.logger.info(
        { transferId: transfer.id, eventType: payload.eventType, current },
        'Out-of-order or irrelevant webhook ignored',
      );
      await this.markWebhookProcessed(payload.eventId);
      return { processed: false, reason: 'out_of_order_or_irrelevant' };
    }

    applyTransition({ from: current, to: next, actor: 'webhook' });
    await this.updateState(transfer.id, current, next, 'webhook', payload.eventType);

    await this.postLedgerForTransition(transfer.id, next, payload.eventId);

    await this.autoAdvance(transfer.id, next);

    await this.markWebhookProcessed(payload.eventId);

    await this.prisma.auditEvent.create({
      data: buildAuditEvent({
        eventType: `webhook.${payload.eventType}`,
        actorType: 'provider_webhook',
        actorId: 'sandbox-provider',
        resourceType: 'transfer',
        resourceId: transfer.id,
        correlationId: transfer.correlationId,
        payload: { eventType: payload.eventType, from: current, to: next },
        userId: transfer.userId,
      }) as Prisma.AuditEventCreateInput,
    });

    return { processed: true };
  }

  private async autoAdvance(transferId: string, fromState: TransferState) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id: transferId } });
    if (!transfer) return;

    let current = transfer.state as TransferState;
    const steps: TransferState[] = [];

    if (fromState === 'funding_received' || current === 'funding_received') {
      steps.push(mapFundingReceivedNext());
    }
    if (fromState === 'fx_booked' || current === 'fx_booked') {
      steps.push(mapFxBookedNext());
    }
    if (fromState === 'payout_failed' || current === 'payout_failed') {
      steps.push(mapPayoutFailedNext());
    }

    for (const to of steps) {
      applyTransition({ from: current, to, actor: 'worker' });
      await this.updateState(transferId, current, to, 'worker');
      await this.runWorkerSideEffects(transferId, to);
      current = to;
    }

    if (current === 'screening_pending') {
      const screening = await this.providers.screening.screenTransfer(transferId, {
        correlationId: transfer.correlationId,
        idempotencyKey: `screen_${transferId}`,
      });
      const to: TransferState =
        screening.status === 'declined' || screening.status === 'held'
          ? 'compliance_declined'
          : 'fx_booked';
      applyTransition({ from: current, to, actor: 'worker' });
      await this.updateState(transferId, current, to, 'worker', screening.status);
      await this.postLedgerForTransition(transferId, to, `screen_${transferId}`);
      if (to === 'fx_booked') {
        await this.autoAdvance(transferId, 'fx_booked');
      }
    }
  }

  private async runWorkerSideEffects(transferId: string, state: TransferState) {
    if (state !== 'payout_pending') return;
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { quote: true },
    });
    if (!transfer?.recipientId) return;

    await this.providers.payout.initiatePayout(
      transfer.recipientId,
      {
        amountMinor: transfer.quote.targetAmountMinor,
        currency: 'INR',
      },
      { correlationId: transfer.correlationId, idempotencyKey: `payout_${transferId}` },
    );
  }

  private async postLedgerForTransition(
    transferId: string,
    state: TransferState,
    idempotencyKey: string,
  ) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: { quote: true },
    });
    if (!transfer?.quote) return;

    const quote = transfer.quote;
    const journalId = `${transferId}_${state}_${idempotencyKey}`;

    let journal;
    if (state === 'funding_received') {
      journal = buildFundingJournal({
        journalId,
        transferId,
        idempotencyKey,
        sourceAmountMinor: quote.sourceAmountMinor,
        sourceCurrency: quote.sourceCurrency,
      });
    } else if (state === 'fx_booked') {
      const marginMinor = (quote.sourceAmountMinor * BigInt(quote.marginBps)) / 10000n;
      journal = buildFxBookedJournal({
        journalId,
        transferId,
        idempotencyKey,
        sourceAmountMinor: quote.sourceAmountMinor,
        sourceCurrency: quote.sourceCurrency,
        targetAmountMinor: quote.targetAmountMinor,
        marginMinor,
      });
    } else if (state === 'delivered') {
      journal = buildPayoutJournal({
        journalId,
        transferId,
        idempotencyKey,
        targetAmountMinor: quote.targetAmountMinor,
      });
    } else if (state === 'refunded') {
      journal = buildRefundJournal({
        journalId,
        transferId,
        idempotencyKey,
        sourceAmountMinor: quote.sourceAmountMinor,
        sourceCurrency: quote.sourceCurrency,
      });
    } else {
      return;
    }

    for (const line of journal.lines) {
      const account = await this.prisma.ledgerAccount.findUnique({
        where: { code: line.accountCode },
      });
      if (!account) continue;

      await this.prisma.ledgerEntry.create({
        data: {
          journalId: journal.journalId,
          accountId: account.id,
          transferId,
          direction: line.direction,
          amountMinor: line.amountMinor,
          currency: line.currency,
          description: line.description,
          idempotencyKey: `${idempotencyKey}_${line.accountCode}_${line.direction}`,
        },
      });
    }
  }

  private async updateState(
    transferId: string,
    from: TransferState,
    to: TransferState,
    actor: 'worker' | 'webhook',
    reason?: string,
  ) {
    await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        state: to,
        failureReason:
          to.includes('failed') || to === 'compliance_declined' ? (reason ?? to) : undefined,
        stateHistory: {
          create: {
            fromState: from,
            toState: to,
            actorType: actor,
            actorId: 'system',
            reason,
          },
        },
      },
    });
  }

  private async markWebhookProcessed(providerEventId: string) {
    await this.prisma.webhookEvent.update({
      where: { providerEventId },
      data: { processed: true, processedAt: new Date() },
    });
  }
}
