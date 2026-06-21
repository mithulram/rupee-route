import { createServer, type Server } from 'node:http';
import { buildAuditEvent, PrismaClient, type Prisma } from '@rupeeroute/domain';
import {
  assertSandboxMode,
  parseEnv,
  resolveFeatureFlags,
  workerEnvSchema,
} from '@rupeeroute/config';
import { createLogger, type Logger } from '@rupeeroute/observability';
import { Queue, Worker } from 'bullmq';
import type { ProviderWebhookPayload } from '@rupeeroute/provider-sdk';
import { processWebhookJob } from './jobs/webhook.job.js';
import { recordWebhookFailure, resolveWebhookFailure } from './jobs/webhook-failure.js';

export interface SandboxWorkerHandle {
  shutdown(): Promise<void>;
}

export async function startSandboxWorker(): Promise<SandboxWorkerHandle> {
  const logger = createLogger({ service: 'worker', pretty: true });
  const env = parseEnv(workerEnvSchema);
  const flags = resolveFeatureFlags(env);
  assertSandboxMode(flags);

  const prisma = new PrismaClient();
  const connection = { url: env.REDIS_URL, maxRetriesPerRequest: null };

  const webhookQueue = new Queue('webhooks', { connection });

  const worker = new Worker(
    'webhooks',
    async (job) => {
      logger.info({ jobId: job.id, name: job.name }, 'Processing webhook job');
      const payload = job.data as ProviderWebhookPayload;
      const result = await processWebhookJob(payload, { prisma });
      if (result.processed) {
        await resolveWebhookFailure(prisma, payload.eventId);
      }
      return result;
    },
    { connection },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const payload = job.data as ProviderWebhookPayload;
      void recordWebhookFailure(
        prisma,
        payload,
        err instanceof Error ? err.message : 'Unknown failure',
        job.attemptsMade,
      );
    }
  });

  await prisma.auditEvent.create({
    data: buildAuditEvent({
      eventType: 'worker.started',
      actorType: 'worker',
      resourceType: 'worker',
      resourceId: 'worker',
      correlationId: `worker-${String(Date.now())}`,
      payload: { sandboxMode: !flags.liveTransfersEnabled },
    }) as Prisma.AuditEventCreateInput,
  });

  const server = createHealthServer(env.WORKER_PORT, flags.liveTransfersEnabled, logger);

  return {
    shutdown: async () => {
      await worker.close();
      await webhookQueue.close();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      await prisma.$disconnect();
    },
  };
}

function createHealthServer(port: number, liveTransfersEnabled: boolean, logger: Logger): Server {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'worker',
          sandboxMode: !liveTransfersEnabled,
          liveTransfersEnabled,
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    logger.info({ port }, 'Worker started');
  });

  return server;
}
