import { describe, expect, it } from 'vitest';
import {
  buildHelmetConfig,
  buildThrottlerConfig,
  SECURITY_HEADERS,
  SecurityModule,
  THROTTLER_LIMIT,
  THROTTLER_TTL_MS,
} from './index';

describe('security module exports', () => {
  it('exports SecurityModule for Nest wiring', () => {
    expect(SecurityModule).toBeDefined();
    expect(SecurityModule.name).toBe('SecurityModule');
  });

  it('defines helmet headers configuration', () => {
    const config = buildHelmetConfig();
    const csp = config.contentSecurityPolicy;

    expect(typeof csp).toBe('object');
    if (typeof csp === 'object' && csp !== null && 'directives' in csp) {
      expect(csp.directives?.defaultSrc).toEqual(["'self'"]);
    }

    expect(config.frameguard).toEqual({ action: 'deny' });
    expect(config.noSniff).toBe(true);
    expect(config.hidePoweredBy).toBe(true);
    expect(config.hsts).toMatchObject({
      maxAge: 31_536_000,
      includeSubDomains: true,
    });
  });

  it('documents expected response security headers', () => {
    expect(SECURITY_HEADERS).toContain('content-security-policy');
    expect(SECURITY_HEADERS).toContain('strict-transport-security');
    expect(SECURITY_HEADERS).toContain('x-frame-options');
  });

  it('defines throttler rate limit defaults', () => {
    const config = buildThrottlerConfig();

    expect(THROTTLER_TTL_MS).toBe(60_000);
    expect(THROTTLER_LIMIT).toBe(120);
    expect(config.throttlers[0]).toMatchObject({
      name: 'default',
      ttl: THROTTLER_TTL_MS,
      limit: THROTTLER_LIMIT,
    });
  });
});
