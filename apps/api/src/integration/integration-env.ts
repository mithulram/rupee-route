export function ensureTestEnv(): void {
  process.env.NODE_ENV ??= 'test';
  process.env.LIVE_TRANSFERS_ENABLED ??= 'false';
  process.env.SANDBOX_FORCE_KYC_APPROVED ??= 'true';
  process.env.REDIS_URL ??= 'redis://localhost:6379';
  process.env.JWT_SECRET ??= 'test-jwt-secret-min-16-chars';
  process.env.WEBHOOK_SIGNING_SECRET ??= 'sandbox-webhook-secret';
  process.env.API_PORT ??= '3001';
}

export function assertIntegrationCiEnv(): void {
  ensureTestEnv();
  if (process.env.CI === 'true' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in CI for integration tests');
  }
}

/** @deprecated use ensureTestEnv */
export function ensureIntegrationEnv(): void {
  ensureTestEnv();
}
