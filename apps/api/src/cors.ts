const LOCAL_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3003',
  'http://localhost:8081',
];

/** Comma-separated HTTPS origins for deployed customer web (Vercel). */
export function resolveCorsOrigins(): string[] {
  const fromEnv = process.env.WEB_CORS_ORIGINS?.trim();
  if (!fromEnv) {
    return LOCAL_DEV_ORIGINS;
  }

  const origins = fromEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    if (!origin.startsWith('https://')) {
      throw new Error(
        `WEB_CORS_ORIGINS must use HTTPS in deployed environments. Invalid origin: ${origin}`,
      );
    }
  }

  return origins;
}
