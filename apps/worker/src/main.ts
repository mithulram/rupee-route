import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { buildAuditEvent, PrismaClient, type Prisma } from '@rupeeroute/domain';
import {
  assertSandboxMode,
  parseEnv,
  resolveFeatureFlags,
  workerEnvSchema,
} from '@rupeeroute/config';
import { createLogger } from '@rupeeroute/observability';
import { Queue, Worker } from 'bullmq';
import type { ProviderWebhookPayload } from '@rupeeroute/provider-sdk';
import { processWebhookJob } from './jobs/webhook.job.js';
import { recordWebhookFailure, resolveWebhookFailure } from './jobs/webhook-failure.js';

async function main() {
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

  const handleRequest = (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'worker',
          sandboxMode: !flags.liveTransfersEnabled,
          liveTransfersEnabled: flags.liveTransfersEnabled,
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end();
  };

  const server = createServer(handleRequest);
  server.listen(env.WORKER_PORT, () => {
    logger.info({ port: env.WORKER_PORT }, 'Worker started');
  });

  process.on('SIGTERM', () => {
    void worker.close();
    void webhookQueue.close();
    void prisma.$disconnect();
    server.close();
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
