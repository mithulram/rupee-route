import type { ProviderWebhookPayload } from '@rupeeroute/provider-sdk';
import type { PrismaClient } from '@rupeeroute/domain';

export async function recordWebhookFailure(
  prisma: PrismaClient,
  payload: ProviderWebhookPayload,
  failureReason: string,
  retryCount: number,
) {
  await prisma.webhookFailure.create({
    data: {
      providerEventId: payload.eventId,
      eventType: payload.eventType,
      transferId: payload.transferId,
      payload: JSON.parse(JSON.stringify(payload)) as object,
      failureReason,
      retryCount,
      lastAttemptAt: new Date(),
    },
  });
}

export async function resolveWebhookFailure(prisma: PrismaClient, providerEventId: string) {
  await prisma.webhookFailure.updateMany({
    where: { providerEventId, resolved: false },
    data: { resolved: true },
  });
}
