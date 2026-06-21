import { createHash } from 'node:crypto';

export function hashRequest(body: unknown): string {
  const payload = body === undefined || body === null ? '' : JSON.stringify(body);
  return createHash('sha256').update(payload).digest('hex');
}

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  responseBody?: unknown;
  statusCode?: number | null;
  expiresAt: Date;
}

export function idempotencyConflict(existing: IdempotencyRecord, requestHash: string): boolean {
  return existing.requestHash !== requestHash;
}

export function defaultIdempotencyExpiry(hours = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
