import { describe, expect, it } from 'vitest';
import { enrichAdminAuditPayload } from './admin-audit.js';

describe('enrichAdminAuditPayload', () => {
  it('returns enriched admin audit payload with immutable actor context', () => {
    const occurredAt = new Date('2026-06-20T12:00:00.000Z');
    const payload = enrichAdminAuditPayload(
      'admin_1',
      ['administrator', 'finance'],
      '203.0.113.10',
      'feature_flag.updated',
      occurredAt,
    );

    expect(payload).toEqual({
      actor: 'admin_1',
      roles: ['administrator', 'finance'],
      ip: '203.0.113.10',
      action: 'feature_flag.updated',
      occurredAt: '2026-06-20T12:00:00.000Z',
      source: 'admin_console',
    });
  });

  it('copies roles array to avoid mutation', () => {
    const roles = ['administrator'];
    const payload = enrichAdminAuditPayload('admin_1', roles, '127.0.0.1', 'transfer.viewed');
    roles.push('support');
    expect(payload.roles).toEqual(['administrator']);
  });
});
