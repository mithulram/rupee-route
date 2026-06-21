import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  buildAuditEvent,
  applyTransition,
  assertQuoteActive,
  isQuoteExpired,
  type TransferState,
} from '@rupeeroute/domain';
import { createSandboxProviders } from '@rupeeroute/provider-sdk';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TransfersService {
  private readonly providers = createSandboxProviders();

  constructor(private readonly prisma: PrismaClient) {}

  async createDraft(userId: string, quoteId: string, idempotencyKey: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id: quoteId, userId } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (isQuoteExpired(quote.expiresAt)) throw new BadRequestException('Quote expired');

    const existing = await this.prisma.transfer.findUnique({ where: { quoteId } });
    if (existing) return this.getTransfer(userId, existing.id);

    const correlationId = randomUUID();
    const transfer = await this.prisma.transfer.create({
      data: {
        userId,
        quoteId,
        state: 'draft',
        idempotencyKey,
        correlationId,
        stateHistory: {
          create: {
            fromState: null,
            toState: 'draft',
            actorType: 'client',
            actorId: userId,
          },
        },
      },
    });

    const updated = await this.transition(userId, transfer.id, 'quote_created', 'client');
    return this.getTransfer(userId, updated.id);
  }

  async attachRecipient(userId: string, transferId: string, recipientId: string) {
    const transfer = await this.requireTransfer(userId, transferId);
    const recipient = await this.prisma.recipient.findFirst({
      where: { id: recipientId, userId },
    });
    if (!recipient?.validated) throw new BadRequestException('Recipient not validated');

    if (transfer.state === 'quote_created') {
      await this.prisma.transfer.update({
        where: { id: transferId },
        data: { recipientId },
      });
      await this.transition(userId, transferId, 'recipient_validated', 'client');
    }

    const refreshed = await this.requireTransfer(userId, transferId);
    const kyc = await this.providers.kyc.checkStatus(userId, {
      correlationId: refreshed.correlationId,
      idempotencyKey: `kyc_${transferId}`,
    });

    if (kyc.status === 'pending') {
      await this.transition(userId, transferId, 'identity_required', 'client');
    } else if (kyc.status === 'approved') {
      if (refreshed.state === 'recipient_validated') {
        await this.transition(userId, transferId, 'compliance_review', 'client');
      }
    } else {
      throw new BadRequestException('KYC verification declined for sandbox user');
    }

    return this.getTransfer(userId, transferId);
  }

  async confirm(userId: string, transferId: string) {
    const transfer = await this.requireTransfer(userId, transferId);
    const quote = await this.prisma.quote.findUnique({ where: { id: transfer.quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');
    assertQuoteActive(quote.expiresAt);

    const allowedFrom: TransferState[] = ['compliance_review', 'recipient_validated'];
    if (!(allowedFrom as string[]).includes(transfer.state)) {
      throw new BadRequestException(`Cannot confirm transfer in state ${transfer.state}`);
    }

    if (transfer.state === 'recipient_validated') {
      await this.transition(userId, transferId, 'compliance_review', 'client');
    }
    await this.transition(userId, transferId, 'funding_pending', 'client');

    const refreshed = await this.requireTransfer(userId, transferId);
    const funding = await this.providers.funding.initiateFunding(
      transferId,
      {
        amountMinor: quote.sourceAmountMinor,
        currency: quote.sourceCurrency as 'EUR' | 'CHF',
      },
      { correlationId: refreshed.correlationId, idempotencyKey: `fund_${transferId}` },
    );

    return {
      ...this.serializeTransfer(refreshed),
      fundingReference: funding.reference,
      fundingStatus: funding.status,
      message: 'Funding initiated. Delivery times vary and transfers are not guaranteed instant.',
    };
  }

  async cancel(userId: string, transferId: string) {
    const transfer = await this.requireTransfer(userId, transferId);
    if ((['delivered', 'cancelled', 'refunded'] as string[]).includes(transfer.state)) {
      throw new ConflictException('Transfer cannot be cancelled');
    }
    await this.transition(userId, transferId, 'cancelled', 'client');
    return this.getTransfer(userId, transferId);
  }

  async listTransfers(userId: string) {
    const transfers = await this.prisma.transfer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        quote: true,
        recipient: true,
      },
    });

    return transfers.map((transfer) => ({
      ...this.serializeTransfer(transfer),
      sourceCurrency: transfer.quote.sourceCurrency,
      sourceAmountMinor: transfer.quote.sourceAmountMinor.toString(),
      targetAmountMinor: transfer.quote.targetAmountMinor.toString(),
      recipientName: transfer.recipient?.displayName ?? null,
    }));
  }

  async getTransfer(userId: string, transferId: string) {
    const transfer = await this.requireTransfer(userId, transferId);
    const quote = await this.prisma.quote.findUnique({ where: { id: transfer.quoteId } });
    const history = await this.prisma.transferStateHistory.findMany({
      where: { transferId },
      orderBy: { occurredAt: 'asc' },
    });

    return {
      ...this.serializeTransfer(transfer),
      quote: quote
        ? {
            id: quote.id,
            sourceCurrency: quote.sourceCurrency,
            sourceAmountMinor: quote.sourceAmountMinor.toString(),
            targetAmountMinor: quote.targetAmountMinor.toString(),
            customerRate: quote.customerRate,
            marginPercent: quote.marginPercent,
            marginDisclosure: `Rate includes our margin of ${quote.marginPercent}%`,
            expiresAt: quote.expiresAt.toISOString(),
          }
        : null,
      stateHistory: history.map((h) => ({
        fromState: h.fromState,
        toState: h.toState,
        actorType: h.actorType,
        occurredAt: h.occurredAt.toISOString(),
        reason: h.reason,
      })),
    };
  }

  private async transition(
    userId: string,
    transferId: string,
    to: TransferState,
    actor: 'client' | 'worker' | 'webhook',
    reason?: string,
  ) {
    const transfer = await this.requireTransfer(userId, transferId);
    const from = transfer.state as TransferState;
    applyTransition({ from, to, actor, reason });

    return this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        state: to,
        failureReason: to.includes('failed') || to === 'compliance_declined' ? reason : undefined,
        stateHistory: {
          create: {
            fromState: from,
            toState: to,
            actorType: actor,
            actorId: actor === 'client' ? userId : 'system',
            reason,
          },
        },
      },
    });
  }

  /** Called by worker only — not exposed via controller */
  async advanceStateSystem(
    transferId: string,
    to: TransferState,
    actor: 'worker' | 'webhook',
    reason?: string,
  ) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id: transferId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return this.transition(transfer.userId, transferId, to, actor, reason);
  }

  private async requireTransfer(userId: string, transferId: string) {
    const transfer = await this.prisma.transfer.findFirst({ where: { id: transferId, userId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  private serializeTransfer(transfer: {
    id: string;
    state: string;
    quoteId: string;
    recipientId: string | null;
    correlationId: string;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: transfer.id,
      state: transfer.state,
      quoteId: transfer.quoteId,
      recipientId: transfer.recipientId,
      correlationId: transfer.correlationId,
      failureReason: transfer.failureReason,
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString(),
    };
  }

  async writeAudit(transferId: string, eventType: string, payload: Record<string, unknown>) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id: transferId } });
    if (!transfer) return;
    await this.prisma.auditEvent.create({
      data: buildAuditEvent({
        eventType,
        actorType: 'worker',
        resourceType: 'transfer',
        resourceId: transferId,
        correlationId: transfer.correlationId,
        payload,
        userId: transfer.userId,
      }) as Prisma.AuditEventCreateInput,
    });
  }
}
