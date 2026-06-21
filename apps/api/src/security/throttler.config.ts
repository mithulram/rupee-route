export const THROTTLER_TTL_MS = 60_000;
export const THROTTLER_LIMIT = 120;

export function buildThrottlerConfig() {
  return {
    throttlers: [
      {
        name: 'default',
        ttl: THROTTLER_TTL_MS,
        limit: THROTTLER_LIMIT,
      },
    ],
  };
}
