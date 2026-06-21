import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@rupeeroute/domain';
import { apiEnvSchema, parseEnv } from '@rupeeroute/config';
import { parseWebhookPayload, verifyWebhookSignature } from '@rupeeroute/provider-sdk';
import { Queue } from 'bullmq';

@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly queue: Queue;

  constructor(private readonly prisma: PrismaClient) {
    const env = parseEnv(apiEnvSchema);
    this.queue = new Queue('webhooks', {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    });
  }

  @Post('provider')
  async receiveProviderWebhook(
    @Body() body: unknown,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    const env = parseEnv(apiEnvSchema);
    if (!signature) throw new UnauthorizedException('Missing webhook signature');

    const payload = parseWebhookPayload(JSON.stringify(body));
    if (!verifyWebhookSignature(payload, signature, env.WEBHOOK_SIGNING_SECRET)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { providerEventId: payload.eventId },
    });
    if (existing?.processed) {
      return { received: true, duplicate: true, status: 'already_processed' };
    }

    if (existing) {
      await this.queue.add('provider.webhook', payload, {
        jobId: payload.eventId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      return { received: true, duplicate: true, status: 'requeued' };
    }

    await this.prisma.webhookEvent.create({
      data: {
        providerEventId: payload.eventId,
        transferId: payload.transferId,
        eventType: payload.eventType,
        payload: JSON.parse(JSON.stringify(payload)) as object,
        signature,
      },
    });

    await this.queue.add('provider.webhook', payload, {
      jobId: payload.eventId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    return { received: true, duplicate: false };
  }
}
