export type AuditActorType = 'user' | 'system' | 'worker' | 'provider_webhook' | 'admin';

export interface AuditEventInput {
  eventType: string;
  actorType: AuditActorType;
  actorId?: string;
  resourceType: string;
  resourceId: string;
  correlationId: string;
  payload: Record<string, unknown>;
  userId?: string;
}

/**
 * Immutable audit event record shape.
 * Application code must only INSERT audit events — never update or delete.
 */
export interface AuditEventRecord extends AuditEventInput {
  id: string;
  occurredAt: Date;
}

export function buildAuditEvent(
  input: AuditEventInput,
): Omit<AuditEventRecord, 'id' | 'occurredAt'> {
  return {
    ...input,
    payload: {
      ...input.payload,
      _immutable: true,
    },
  };
}

export const AUDIT_IMMUTABILITY_ERROR =
  'Audit events are append-only and cannot be modified or deleted';
