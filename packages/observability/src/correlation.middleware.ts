import { randomUUID } from 'node:crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

export interface CorrelationRequest {
  headers: Record<string, string | string[] | undefined>;
  correlationId?: string;
}

export interface CorrelationResponse {
  setHeader(name: string, value: string): void;
}

export type CorrelationNext = () => void;

export function resolveCorrelationId(req: Pick<CorrelationRequest, 'headers'>): string {
  const incoming = req.headers[CORRELATION_ID_HEADER] ?? req.headers[REQUEST_ID_HEADER];
  if (typeof incoming === 'string' && incoming.trim()) {
    return incoming.trim();
  }
  if (Array.isArray(incoming) && incoming[0]?.trim()) {
    return incoming[0].trim();
  }
  return randomUUID();
}

export function correlationIdMiddleware(
  req: CorrelationRequest,
  res: CorrelationResponse,
  next: CorrelationNext,
): void {
  const correlationId = resolveCorrelationId(req);
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}

/** Express / Nest bootstrap helper for `app.use(...)`. */
export function createCorrelationMiddleware() {
  return correlationIdMiddleware;
}

/** Duck-typed NestJS middleware for `MiddlewareConsumer.apply(...)`. */
export class CorrelationIdMiddleware {
  use = correlationIdMiddleware;
}
