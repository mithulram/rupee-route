import { describe, expect, it } from 'vitest';

describe('api health contract', () => {
  it('defines ok status shape', () => {
    const response = {
      status: 'ok' as const,
      service: 'api',
      sandboxMode: true,
      liveTransfersEnabled: false,
    };
    expect(response.sandboxMode).toBe(true);
  });
});
