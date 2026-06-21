import { randomUUID } from 'node:crypto';
import { startSandboxWorker } from '@rupeeroute/worker/sandbox-worker';
import { signWebhookPayload } from '@rupeeroute/provider-sdk';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createIntegrationApp, describeIntegration } from './integration-test-utils';

describeIntegration('combined sandbox worker (integration)', () => {
  let app: Awaited<ReturnType<typeof createIntegrationApp>>;
  let workerHandle: Awaited<ReturnType<typeof startSandboxWorker>> | undefined;

  beforeAll(async () => {
    process.env.SANDBOX_COMBINED_WORKER = 'true';
    process.env.WORKER_PORT ??= '3002';
    workerHandle = await startSandboxWorker();
    app = await createIntegrationApp();
  });

  afterAll(async () => {
    await app?.close();
    await workerHandle?.shutdown();
  });

  async function registerApprovedUser() {
    const email = `combined-worker-${randomUUID()}@sandbox.rupeeroute.test`;
    const password = 'integration-pass-123';

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, countryCode: 'DE' })
      .expect(201);

    return { token: registerRes.body.accessToken as string };
  }

  async function waitForTransferState(
    token: string,
    transferId: string,
    expectedState: string,
    attempts = 20,
  ) {
    for (let i = 0; i < attempts; i += 1) {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/transfers/${transferId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      if (res.body.state === expectedState) {
        return res.body;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Transfer ${transferId} did not reach state ${expectedState}`);
  }

  it('processes a queued funding webhook when combined-worker mode is enabled', async () => {
    const { token } = await registerApprovedUser();

    const recipientRes = await request(app.getHttpServer())
      .post('/api/v1/recipients')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({
        type: 'bank_account',
        displayName: 'Combined Worker Recipient',
        accountHolder: 'Test Holder',
        ifsc: 'HDFC0001234',
        accountNumber: '123456789012',
      })
      .expect(201);

    const quoteRes = await request(app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ sourceCurrency: 'EUR', sourceAmountMinor: '10000' })
      .expect(201);

    const transferRes = await request(app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ quoteId: quoteRes.body.id })
      .expect(201);

    const transferId = transferRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transferId}/recipient`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ recipientId: recipientRes.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transferId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .expect(201)
      .expect((res) => {
        expect(res.body.state).toBe('funding_pending');
      });

    const secret = process.env.WEBHOOK_SIGNING_SECRET ?? 'sandbox-webhook-secret';
    const payload = {
      eventId: `evt_${randomUUID()}`,
      eventType: 'funding.received' as const,
      transferId,
      correlationId: randomUUID(),
      occurredAt: new Date().toISOString(),
    };
    const signature = signWebhookPayload(payload, secret);

    await request(app.getHttpServer())
      .post('/api/v1/webhooks/provider')
      .set('x-webhook-signature', signature)
      .send(payload)
      .expect(201)
      .expect((res) => {
        expect(res.body.received).toBe(true);
        expect(res.body.duplicate).toBe(false);
      });

    const transfer = await waitForTransferState(token, transferId, 'funding_received');
    expect(transfer.state).toBe('funding_received');
  });
});
