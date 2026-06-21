import { Injectable } from '@nestjs/common';
import { apiEnvSchema, parseEnv } from '@rupeeroute/config';
import { PrismaClient } from '@rupeeroute/domain';
import {
  createMonitoringSnapshot,
  evaluateAlerts,
  type ActiveAlert,
  type MonitoringSnapshot,
} from '@rupeeroute/observability';
import { Queue } from 'bullmq';

@Injectable()
export class MonitoringService {
  private readonly queue: Queue;

  constructor(private readonly prisma: PrismaClient) {
    const env = parseEnv(apiEnvSchema);
    this.queue = new Queue('webhooks', {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    });
  }

  async getActiveAlerts(): Promise<ActiveAlert[]> {
    const counts = await this.collectCounts();
    return evaluateAlerts(counts);
  }

  async getMonitoringSnapshot(): Promise<MonitoringSnapshot> {
    const counts = await this.collectCounts();
    return createMonitoringSnapshot(counts);
  }

  private async collectCounts() {
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);

    const [webhookTotal, webhookFailed, reconciliationExceptions, queueDepth] = await Promise.all([
      this.prisma.webhookEvent.count({
        where: { receivedAt: { gte: windowStart } },
      }),
      this.prisma.webhookFailure.count({
        where: { resolved: false, lastAttemptAt: { lt: staleThreshold } },
      }),
      this.prisma.auditEvent.count({
        where: {
          eventType: { startsWith: 'reconciliation.exception' },
        },
      }),
      this.getQueueDepth(),
    ]);

    return {
      webhookTotal,
      webhookFailed,
      reconciliationExceptions,
      queueDepth,
    };
  }

  private async getQueueDepth(): Promise<number> {
    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'delayed',
      'paused',
      'prioritized',
    );

    return (
      (counts.waiting ?? 0) +
      (counts.active ?? 0) +
      (counts.delayed ?? 0) +
      (counts.paused ?? 0) +
      (counts.prioritized ?? 0)
    );
  }
}
