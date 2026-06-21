import type { ProviderWebhookPayload } from '@rupeeroute/provider-sdk';
import { PrismaClient } from '@rupeeroute/domain';
import { TransferProcessor } from './transfer.processor.js';

export async function processWebhookJob(
  data: ProviderWebhookPayload,
  deps: { prisma: PrismaClient },
): Promise<{ processed: boolean; reason?: string }> {
  const processor = new TransferProcessor(deps.prisma);
  return processor.processWebhook(data);
}
