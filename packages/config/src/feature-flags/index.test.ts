import { describe, expect, it } from 'vitest';
import { assertSandboxMode, mergeDbFeatureFlags, resolveFeatureFlags } from './index.js';

describe('feature flags', () => {
  it('defaults live transfers to disabled', () => {
    const flags = resolveFeatureFlags({ LIVE_TRANSFERS_ENABLED: false });
    expect(flags.liveTransfersEnabled).toBe(false);
    expect(flags.transferCreationEnabled).toBe(true);
    expect(flags.couponsEnabled).toBe(true);
  });

  it('assertSandboxMode rejects live transfers', () => {
    expect(() => {
      assertSandboxMode({ liveTransfersEnabled: true } as never);
    }).toThrow(/LIVE_TRANSFERS_ENABLED=true/);
  });

  it('merges db kill switches', () => {
    const merged = mergeDbFeatureFlags(resolveFeatureFlags({ LIVE_TRANSFERS_ENABLED: false }), {
      transfer_creation: false,
      coupons: false,
    });
    expect(merged.transferCreationEnabled).toBe(false);
    expect(merged.couponsEnabled).toBe(false);
  });
});
