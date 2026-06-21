import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { signWebhookPayload } from '@rupeeroute/provider-sdk';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createIntegrationApp, describeIntegration } from './integration-test-utils';

describeIntegration('consumer financial flow (integration)', () => {
  let app: Awaited<ReturnType<typeof createIntegrationApp>>;

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  async function registerApprovedUser() {
    const email = `integration-${randomUUID()}@sandbox.rupeeroute.test`;
    const password = 'integration-pass-123';

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, countryCode: 'DE' })
      .expect(201);

    const token = registerRes.body.accessToken as string;
    return { email, password, token };
  }

  async function createTransferReadyForConfirm(token: string) {
    const recipientRes = await request(app.getHttpServer())
      .post('/api/v1/recipients')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({
        type: 'bank_account',
        displayName: 'Integration Recipient',
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

    return { transferId, quoteId: quoteRes.body.id as string };
  }

  it('confirms transfer with empty body and replays idempotency key', async () => {
    const { token } = await registerApprovedUser();
    const { transferId } = await createTransferReadyForConfirm(token);
    const idempotencyKey = randomUUID();

    const confirmRes = await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transferId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .expect(201);

    expect(confirmRes.body.state).toBe('funding_pending');
    expect(confirmRes.body.fundingReference).toBeTruthy();

    const replayRes = await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transferId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .expect(200);

    expect(replayRes.body.state).toBe('funding_pending');
    expect(replayRes.body.fundingReference).toBe(confirmRes.body.fundingReference);
  });

  it('cancels transfer with empty body after confirm attempt blocked pre-funding', async () => {
    const { token } = await registerApprovedUser();
    const { transferId } = await createTransferReadyForConfirm(token);

    await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transferId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .expect(201)
      .expect((res) => {
        expect(res.body.state).toBe('cancelled');
      });
  });

  it('rejects cross-user transfer access', async () => {
    const userA = await registerApprovedUser();
    const userB = await registerApprovedUser();
    const { transferId } = await createTransferReadyForConfirm(userA.token);

    await request(app.getHttpServer())
      .get(`/api/v1/transfers/${transferId}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .expect(404);
  });

  it('deduplicates provider webhooks by event id', async () => {
    const { token } = await registerApprovedUser();
    const { transferId } = await createTransferReadyForConfirm(token);
    const secret = process.env.WEBHOOK_SIGNING_SECRET ?? 'sandbox-webhook-secret';

    const payload = {
      eventId: `evt_${randomUUID()}`,
      eventType: 'funding.received' as const,
      transferId,
      correlationId: randomUUID(),
      occurredAt: new Date().toISOString(),
    };
    const signature = signWebhookPayload(payload, secret);

    const first = await request(app.getHttpServer())
      .post('/api/v1/webhooks/provider')
      .set('x-webhook-signature', signature)
      .send(payload)
      .expect(201);

    expect(first.body.duplicate).toBe(false);

    const second = await request(app.getHttpServer())
      .post('/api/v1/webhooks/provider')
      .set('x-webhook-signature', signature)
      .send(payload)
      .expect(201);

    expect(second.body.duplicate).toBe(true);
  });

  it('rejects webhook without signature', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/webhooks/provider')
      .send({
        eventId: `evt_${randomUUID()}`,
        eventType: 'funding.received',
        transferId: 'missing',
        correlationId: randomUUID(),
        occurredAt: new Date().toISOString(),
      })
      .expect(401);
  });

  it('rejects client attempt to confirm from quote_created state', async () => {
    const { token } = await registerApprovedUser();

    const quoteRes = await request(app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ sourceCurrency: 'EUR', sourceAmountMinor: '5000' })
      .expect(201);

    const transferRes = await request(app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ quoteId: quoteRes.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/transfers/${transferRes.body.id}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .expect(400);
  });
});
