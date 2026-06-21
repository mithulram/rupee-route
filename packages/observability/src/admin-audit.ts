export interface AdminAuditEnrichment {
  actor: string;
  roles: string[];
  ip: string;
  action: string;
  occurredAt: string;
  source: 'admin_console';
}

export interface AdminAuditPayload extends AdminAuditEnrichment {
  action: string;
}

/**
 * Enriches admin audit event payloads with actor context for immutable audit inserts.
 */
export function enrichAdminAuditPayload(
  actor: string,
  roles: string[],
  ip: string,
  action: string,
  occurredAt: Date = new Date(),
): AdminAuditPayload {
  return {
    actor,
    roles: [...roles],
    ip,
    action,
    occurredAt: occurredAt.toISOString(),
    source: 'admin_console',
  };
}
