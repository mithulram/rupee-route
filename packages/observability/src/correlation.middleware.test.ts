import { describe, expect, it, vi } from 'vitest';
import {
  CORRELATION_ID_HEADER,
  correlationIdMiddleware,
  createCorrelationMiddleware,
  resolveCorrelationId,
  type CorrelationRequest,
} from './correlation.middleware.js';

describe('correlation.middleware', () => {
  it('generates a correlation id when header is absent', () => {
    const id = resolveCorrelationId({ headers: {} });
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('propagates incoming correlation id header', () => {
    const id = resolveCorrelationId({
      headers: { [CORRELATION_ID_HEADER]: 'corr-existing' },
    });
    expect(id).toBe('corr-existing');
  });

  it('sets request correlation id and response header', () => {
    const req: CorrelationRequest = {
      headers: { [CORRELATION_ID_HEADER]: 'corr-123' },
    };
    const res = { setHeader: vi.fn() };
    const next = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe('corr-123');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'corr-123');
    expect(next).toHaveBeenCalledOnce();
  });

  it('createCorrelationMiddleware returns the middleware function', () => {
    expect(createCorrelationMiddleware()).toBe(correlationIdMiddleware);
  });
});
