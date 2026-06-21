import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  apiEnvSchema,
  mergeDbFeatureFlags,
  parseEnv,
  resolveFeatureFlags,
} from '@rupeeroute/config';
import {
  applyTransition,
  buildAuditEvent,
  detectReconciliationMismatches,
  PrismaClient,
  type Prisma,
  type AdminRole,
  type TransferState,
} from '@rupeeroute/domain';
import { enrichAdminAuditPayload, createMonitoringSnapshot } from '@rupeeroute/observability';
import type { ProviderWebhookPayload } from '@rupeeroute/provider-sdk';
import { Queue } from 'bullmq';

@Injectable()
export class AdminService {
  private readonly webhookQueue: Queue;

  constructor(private readonly prisma: PrismaClient) {
    const env = parseEnv(apiEnvSchema);
    this.webhookQueue = new Queue('webhooks', {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    });
  }

  private async audit(
    admin: { id: string; email: string; roles: AdminRole[] },
    eventType: string,
    resourceType: string,
    resourceId: string,
    action: string,
    payload: Record<string, unknown> = {},
    ip = 'admin-console',
  ) {
    await this.prisma.auditEvent.create({
      data: buildAuditEvent({
        eventType,
        actorType: 'admin',
        actorId: admin.id,
        resourceType,
        resourceId,
        correlationId: resourceId,
        payload: {
          ...enrichAdminAuditPayload(admin.email, admin.roles, ip, action),
          ...payload,
        },
      }) as Prisma.AuditEventCreateInput,
    });
  }

  async listTransfers(filters: { state?: string; userId?: string; q?: string }) {
    const where: Prisma.TransferWhereInput = {};
    if (filters.state) where.state = filters.state;
    if (filters.userId) where.userId = filters.userId;
    if (filters.q) {
      where.OR = [{ id: { contains: filters.q } }, { correlationId: { contains: filters.q } }];
    }

    const [items, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include: { quote: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return {
      items: items.map((t) => this.serializeTransferSummary(t)),
      total,
    };
  }

  async getTransfer(id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        quote: true,
        recipient: true,
        stateHistory: { orderBy: { occurredAt: 'asc' } },
        ledgerEntries: { include: { account: true }, orderBy: { postedAt: 'asc' } },
        webhookEvents: { orderBy: { receivedAt: 'asc' } },
      },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');

    const auditEvents = await this.prisma.auditEvent.findMany({
      where: { resourceId: id },
      orderBy: { occurredAt: 'asc' },
      take: 100,
    });

    const tickets = await this.prisma.supportTicket.findMany({
      where: { transferId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      transfer: {
        ...this.serializeTransferSummary(transfer),
        reference: transfer.correlationId,
        idempotencyKey: transfer.idempotencyKey,
      },
      quote: {
        id: transfer.quote.id,
        rate: transfer.quote.customerRate,
        feeAmount: '0',
        expiresAt: transfer.quote.expiresAt.toISOString(),
      },
      recipient: transfer.recipient
        ? {
            id: transfer.recipient.id,
            displayName: transfer.recipient.displayName,
            type: transfer.recipient.type,
            accountMask: transfer.recipient.accountNumber
              ? `****${transfer.recipient.accountNumber.slice(-4)}`
              : (transfer.recipient.upiId ?? ''),
          }
        : null,
      stateHistory: transfer.stateHistory.map((h) => ({
        id: h.id,
        fromState: h.fromState,
        toState: h.toState,
        reason: h.reason,
        createdAt: h.occurredAt.toISOString(),
      })),
      ledgerEntries: transfer.ledgerEntries.map((e) => ({
        id: e.id,
        type: e.account.code,
        amount: e.amountMinor.toString(),
        currency: e.currency,
        direction: e.direction as 'debit' | 'credit',
        createdAt: e.postedAt.toISOString(),
      })),
      webhookEvents: transfer.webhookEvents.map((w) => ({
        id: w.id,
        provider: 'sandbox',
        eventType: w.eventType,
        status: w.processed ? 'processed' : 'pending',
        receivedAt: w.receivedAt.toISOString(),
        payloadSummary: w.eventType,
      })),
      auditEvents: auditEvents.map((a) => ({
        id: a.id,
        action: a.eventType,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        actorId: a.actorId,
        actorEmail: null,
        metadata: a.payload as Record<string, unknown>,
        createdAt: a.occurredAt.toISOString(),
      })),
      tickets: tickets.map((t) => this.serializeTicketSummary(t)),
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const transferCount = await this.prisma.transfer.count({ where: { userId: id } });
    return {
      id: user.id,
      email: user.email,
      countryCode: user.countryCode,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt.toISOString(),
      transferCount,
    };
  }

  async listAuditEvents(filters: {
    resourceType?: string;
    resourceId?: string;
    from?: string;
    to?: string;
  }) {
    const where: Prisma.AuditEventWhereInput = {};
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.from || filters.to) {
      where.occurredAt = {};
      if (filters.from) where.occurredAt.gte = new Date(filters.from);
      if (filters.to) where.occurredAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditEvent.findMany({ where, orderBy: { occurredAt: 'desc' }, take: 100 }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      items: items.map((a) => ({
        id: a.id,
        action: a.eventType,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        actorId: a.actorId,
        actorEmail: null,
        metadata: a.payload as Record<string, unknown>,
        createdAt: a.occurredAt.toISOString(),
      })),
      total,
    };
  }

  async exportAuditEvents(filters: {
    resourceType?: string;
    resourceId?: string;
    from?: string;
    to?: string;
  }) {
    const { items } = await this.listAuditEvents(filters);
    const header = 'id,action,resourceType,resourceId,actorId,createdAt';
    const rows = items.map(
      (a) =>
        `${a.id},${a.action},${a.resourceType},${a.resourceId},${a.actorId ?? ''},${a.createdAt}`,
    );
    return [header, ...rows].join('\n');
  }

  async listTickets(filters: { status?: string; transferId?: string }) {
    const where: Prisma.SupportTicketWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.transferId) where.transferId = filters.transferId;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { createdBy: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items: items.map((t) => this.serializeTicketSummary(t)), total };
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        createdBy: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.serializeTicketDetail(ticket);
  }

  async createTicket(
    admin: { id: string; email: string; roles: AdminRole[] },
    body: { subject: string; description: string; transferId?: string; priority?: string },
  ) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: body.subject,
        description: body.description,
        transferId: body.transferId,
        priority: body.priority ?? 'medium',
        createdById: admin.id,
      },
      include: { createdBy: true, comments: { include: { author: true } } },
    });

    await this.audit(admin, 'ticket.created', 'support_ticket', ticket.id, 'create', {
      transferId: body.transferId,
    });

    return this.serializeTicketDetail({ ...ticket, comments: [] });
  }

  async updateTicket(
    admin: { id: string; email: string; roles: AdminRole[] },
    id: string,
    body: { status?: string; priority?: string; assigneeEmail?: string },
  ) {
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: body,
      include: {
        createdBy: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    await this.audit(admin, 'ticket.updated', 'support_ticket', id, 'update', body);
    return this.serializeTicketDetail(ticket);
  }

  async listComplianceReviews() {
    const items = await this.prisma.complianceReview.findMany({
      include: { user: true },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.user.email,
        status: r.status as 'pending' | 'approved' | 'declined',
        riskScore: r.riskScore,
        flags: r.flags,
        submittedAt: r.submittedAt.toISOString(),
      })),
      total: items.length,
    };
  }

  async decideComplianceReview(
    admin: { id: string; email: string; roles: AdminRole[] },
    id: string,
    decision: 'approve' | 'decline',
  ) {
    const status = decision === 'approve' ? 'approved' : 'declined';
    const review = await this.prisma.complianceReview.update({
      where: { id },
      data: { status, decidedById: admin.id, decidedAt: new Date() },
      include: { user: true },
    });

    if (review.userId) {
      await this.prisma.user.update({
        where: { id: review.userId },
        data: { kycStatus: status === 'approved' ? 'approved' : 'declined' },
      });
    }

    await this.audit(admin, 'compliance.decided', 'compliance_review', id, decision, {
      status,
    });

    return {
      id: review.id,
      userId: review.userId,
      userEmail: review.user.email,
      status: review.status as 'pending' | 'approved' | 'declined',
      riskScore: review.riskScore,
      flags: review.flags,
      submittedAt: review.submittedAt.toISOString(),
    };
  }

  async listReconciliationRuns() {
    const items = await this.prisma.reconciliationRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        status: r.status as 'running' | 'completed' | 'failed',
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
        exceptionCount: r.exceptionCount,
      })),
      total: items.length,
    };
  }

  async triggerReconciliationRun(admin: { id: string; email: string; roles: AdminRole[] }) {
    const run = await this.prisma.reconciliationRun.create({
      data: { status: 'running' },
    });

    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: { direction: 'debit' },
      distinct: ['transferId'],
    });

    const ledgerForDetect = ledgerEntries.map((e) => ({
      transferId: e.transferId,
      amountMinor: e.amountMinor,
      currency: e.currency,
      entryType: 'debit',
    }));

    const providerForDetect = ledgerForDetect.map((e, idx) => ({
      ...e,
      settlementStatus: 'settled',
      amountMinor: idx === 0 && ledgerForDetect.length > 0 ? e.amountMinor + 100n : e.amountMinor,
    }));

    const mismatches = detectReconciliationMismatches(ledgerForDetect, providerForDetect);

    for (const mismatch of mismatches) {
      await this.prisma.reconciliationException.create({
        data: {
          runId: run.id,
          transferId: mismatch.transferId,
          type: mismatch.type,
          amountDelta: (mismatch.amountDeltaMinor ?? 0n).toString(),
          status: 'open',
        },
      });

      await this.audit(
        admin,
        'reconciliation.exception',
        'transfer',
        mismatch.transferId,
        'detect',
        {
          type: mismatch.type,
        },
      );
    }

    const completed = await this.prisma.reconciliationRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        exceptionCount: mismatches.length,
      },
    });

    return {
      id: completed.id,
      status: completed.status as 'running' | 'completed' | 'failed',
      startedAt: completed.startedAt.toISOString(),
      completedAt: completed.completedAt?.toISOString() ?? null,
      exceptionCount: completed.exceptionCount,
    };
  }

  async listReconciliationExceptions() {
    const items = await this.prisma.reconciliationException.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      items: items.map((e) => ({
        id: e.id,
        runId: e.runId,
        transferId: e.transferId,
        type: e.type,
        amountDelta: e.amountDelta,
        status: e.status as 'open' | 'resolved',
        createdAt: e.createdAt.toISOString(),
      })),
      total: items.length,
    };
  }

  async listWebhookFailures() {
    const items = await this.prisma.webhookFailure.findMany({
      where: { resolved: false },
      orderBy: { lastAttemptAt: 'desc' },
      take: 50,
    });
    return {
      items: items.map((f) => ({
        id: f.id,
        provider: f.provider,
        eventType: f.eventType,
        transferId: f.transferId,
        failureReason: f.failureReason,
        retryCount: f.retryCount,
        lastAttemptAt: f.lastAttemptAt.toISOString(),
      })),
      total: items.length,
    };
  }

  async retryWebhookFailure(admin: { id: string; email: string; roles: AdminRole[] }, id: string) {
    const failure = await this.prisma.webhookFailure.findUnique({ where: { id } });
    if (!failure) throw new NotFoundException('Webhook failure not found');

    const payload = failure.payload as unknown as ProviderWebhookPayload;
    await this.webhookQueue.add('provider.webhook', payload, {
      jobId: `${payload.eventId}_retry_${String(Date.now())}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    const updated = await this.prisma.webhookFailure.update({
      where: { id },
      data: {
        retryCount: failure.retryCount + 1,
        lastAttemptAt: new Date(),
      },
    });

    await this.audit(admin, 'webhook.retry', 'webhook_failure', id, 'retry');

    return {
      id: updated.id,
      provider: updated.provider,
      eventType: updated.eventType,
      transferId: updated.transferId,
      failureReason: updated.failureReason,
      retryCount: updated.retryCount,
      lastAttemptAt: updated.lastAttemptAt.toISOString(),
    };
  }

  async listRefundProposals() {
    const items = await this.prisma.refundProposal.findMany({
      include: { proposedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      items: items.map((p) => ({
        id: p.id,
        transferId: p.transferId,
        amount: p.amountMinor.toString(),
        currency: p.currency,
        reason: p.reason,
        status: p.status as 'pending' | 'approved' | 'rejected',
        proposedBy: p.proposedBy.email,
        createdAt: p.createdAt.toISOString(),
      })),
      total: items.length,
    };
  }

  async createRefundProposal(
    admin: { id: string; email: string; roles: AdminRole[] },
    body: { transferId: string; amount: string; reason: string },
  ) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: body.transferId },
      include: { quote: true },
    });
    if (!transfer?.quote) throw new NotFoundException('Transfer not found');

    const proposal = await this.prisma.refundProposal.create({
      data: {
        transferId: body.transferId,
        amountMinor: BigInt(body.amount),
        currency: transfer.quote.sourceCurrency,
        reason: body.reason,
        proposedById: admin.id,
      },
      include: { proposedBy: true },
    });

    await this.audit(admin, 'refund.proposed', 'refund_proposal', proposal.id, 'propose', body);

    return {
      id: proposal.id,
      transferId: proposal.transferId,
      amount: proposal.amountMinor.toString(),
      currency: proposal.currency,
      reason: proposal.reason,
      status: proposal.status as 'pending' | 'approved' | 'rejected',
      proposedBy: proposal.proposedBy.email,
      createdAt: proposal.createdAt.toISOString(),
    };
  }

  async approveRefundProposal(
    admin: { id: string; email: string; roles: AdminRole[] },
    id: string,
  ) {
    const proposal = await this.prisma.refundProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Refund proposal not found');
    if (proposal.status !== 'pending') {
      throw new BadRequestException('Proposal already decided');
    }

    const transfer = await this.prisma.transfer.findUnique({
      where: { id: proposal.transferId },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');

    const from = transfer.state as TransferState;
    if (from === 'payout_failed') {
      applyTransition({ from, to: 'refund_pending', actor: 'worker' });
    }

    await this.prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        state: 'refund_pending',
        stateHistory: {
          create: {
            fromState: from,
            toState: 'refund_pending',
            actorType: 'worker',
            actorId: admin.id,
            reason: `Refund approved: ${proposal.reason}`,
          },
        },
      },
    });

    const updated = await this.prisma.refundProposal.update({
      where: { id },
      data: { status: 'approved', approvedById: admin.id },
      include: { proposedBy: true },
    });

    await this.audit(admin, 'refund.approved', 'refund_proposal', id, 'approve');

    return {
      id: updated.id,
      transferId: updated.transferId,
      amount: updated.amountMinor.toString(),
      currency: updated.currency,
      reason: updated.reason,
      status: updated.status as 'pending' | 'approved' | 'rejected',
      proposedBy: updated.proposedBy.email,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async getProviderStatus() {
    const snapshot = createMonitoringSnapshot({
      webhookTotal: 0,
      webhookFailed: await this.prisma.webhookFailure.count({ where: { resolved: false } }),
      reconciliationExceptions: await this.prisma.reconciliationException.count({
        where: { status: 'open' },
      }),
      queueDepth: 0,
    });
    return { providers: snapshot.providers };
  }

  async listFeatureFlags() {
    const records = await this.prisma.featureFlagRecord.findMany({ orderBy: { key: 'asc' } });
    return {
      flags: records.map((f) => ({
        key: f.key,
        enabled: f.enabled,
        description: f.description,
        updatedAt: f.updatedAt.toISOString(),
      })),
    };
  }

  async updateFeatureFlag(
    admin: { id: string; email: string; roles: AdminRole[] },
    key: string,
    enabled: boolean,
  ) {
    const flag = await this.prisma.featureFlagRecord.update({
      where: { key },
      data: { enabled },
    });

    await this.audit(admin, 'feature_flag.updated', 'feature_flag', key, 'update', { enabled });

    return {
      key: flag.key,
      enabled: flag.enabled,
      description: flag.description,
      updatedAt: flag.updatedAt.toISOString(),
    };
  }

  async getEffectiveFeatureFlags() {
    const base = resolveFeatureFlags(parseEnv(apiEnvSchema));
    const records = await this.prisma.featureFlagRecord.findMany();
    const dbMap = Object.fromEntries(records.map((r) => [r.key, r.enabled]));
    return mergeDbFeatureFlags(base, dbMap);
  }

  async listPrivacyRequests() {
    const items = await this.prisma.privacyRequest.findMany({
      include: { user: true },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });
    return {
      items: items.map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.user.email,
        type: r.type as 'export' | 'delete',
        status: r.status as 'pending' | 'in_progress' | 'completed' | 'rejected',
        requestedAt: r.requestedAt.toISOString(),
      })),
      total: items.length,
    };
  }

  async createPrivacyRequest(
    admin: { id: string; email: string; roles: AdminRole[] },
    body: { userId: string; type: 'export' | 'delete' },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) throw new NotFoundException('User not found');

    const request = await this.prisma.privacyRequest.create({
      data: { userId: body.userId, type: body.type },
      include: { user: true },
    });

    await this.audit(admin, 'privacy.requested', 'privacy_request', request.id, 'create', body);

    return {
      id: request.id,
      userId: request.userId,
      userEmail: request.user.email,
      type: request.type as 'export' | 'delete',
      status: request.status as 'pending' | 'in_progress' | 'completed' | 'rejected',
      requestedAt: request.requestedAt.toISOString(),
    };
  }

  async ensureComplianceQueueFromUsers() {
    const pendingUsers = await this.prisma.user.findMany({
      where: { kycStatus: { in: ['pending', 'in_review'] } },
    });

    for (const user of pendingUsers) {
      const existing = await this.prisma.complianceReview.findFirst({
        where: { userId: user.id, status: 'pending' },
      });
      if (!existing) {
        await this.prisma.complianceReview.create({
          data: {
            userId: user.id,
            riskScore: user.kycStatus === 'pending' ? 40 : 65,
            flags: user.kycStatus === 'pending' ? ['kyc_pending'] : ['manual_review'],
          },
        });
      }
    }
  }

  private serializeTransferSummary(t: {
    id: string;
    userId: string;
    state: string;
    createdAt: Date;
    updatedAt: Date;
    quote?: {
      sourceCurrency: string;
      targetCurrency: string;
      sourceAmountMinor: bigint;
      targetAmountMinor: bigint;
    } | null;
  }) {
    return {
      id: t.id,
      userId: t.userId,
      state: t.state,
      sourceCurrency: t.quote?.sourceCurrency ?? '',
      destinationCurrency: t.quote?.targetCurrency ?? 'INR',
      sourceAmount: t.quote?.sourceAmountMinor.toString() ?? '0',
      destinationAmount: t.quote?.targetAmountMinor.toString() ?? '0',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private serializeTicketSummary(t: {
    id: string;
    subject: string;
    status: string;
    priority: string;
    transferId: string | null;
    assigneeEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: t.id,
      subject: t.subject,
      status: t.status as 'open' | 'in_progress' | 'resolved' | 'closed',
      priority: t.priority as 'low' | 'medium' | 'high',
      transferId: t.transferId,
      assigneeEmail: t.assigneeEmail,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private serializeTicketDetail(t: {
    id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    transferId: string | null;
    assigneeEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
    comments: {
      id: string;
      body: string;
      createdAt: Date;
      author: { email: string };
    }[];
  }) {
    return {
      ...this.serializeTicketSummary(t),
      description: t.description,
      comments: t.comments.map((c) => ({
        id: c.id,
        authorEmail: c.author.email,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }
}
