import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ProviderWebhookPayload } from '../types.js';

export function signWebhookPayload(payload: ProviderWebhookPayload, secret: string): string {
  const body = JSON.stringify(payload);
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyWebhookSignature(
  payload: ProviderWebhookPayload,
  signature: string,
  secret: string,
): boolean {
  const expected = signWebhookPayload(payload, secret);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function serializeWebhookPayload(payload: ProviderWebhookPayload): string {
  return JSON.stringify(payload);
}

export function parseWebhookPayload(raw: string): ProviderWebhookPayload {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    typeof parsed.eventId !== 'string' ||
    typeof parsed.eventType !== 'string' ||
    typeof parsed.transferId !== 'string'
  ) {
    throw new Error('Invalid webhook payload');
  }
  return parsed as unknown as ProviderWebhookPayload;
}
