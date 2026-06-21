import { describe, expect, it } from 'vitest';
import { hashRequest, idempotencyConflict } from './index.js';

describe('idempotency', () => {
  it('detects conflicting payloads for same key', () => {
    const record = {
      key: 'key-1',
      requestHash: hashRequest({ amount: '100' }),
      expiresAt: new Date(),
    };
    expect(idempotencyConflict(record, hashRequest({ amount: '100' }))).toBe(false);
    expect(idempotencyConflict(record, hashRequest({ amount: '200' }))).toBe(true);
  });

  it('hashes requests deterministically', () => {
    expect(hashRequest({ a: 1 })).toBe(hashRequest({ a: 1 }));
  });

  it('hashes empty confirm bodies (no JSON body)', () => {
    expect(hashRequest(undefined)).toBe(hashRequest(undefined));
    expect(hashRequest(null)).toBe(hashRequest(undefined));
  });

  it('supports duplicate confirmation via stable request hash', () => {
    const confirmPayload = { transferId: 'tr_1' };
    const first = hashRequest(confirmPayload);
    const retry = hashRequest(confirmPayload);
    expect(first).toBe(retry);
    expect(
      idempotencyConflict({ key: 'k', requestHash: first, expiresAt: new Date() }, retry),
    ).toBe(false);
  });
});
