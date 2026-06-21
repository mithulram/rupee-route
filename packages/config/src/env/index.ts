import { z } from 'zod';

const booleanFromEnv = z.union([z.boolean(), z.string()]).transform((value) => {
  if (typeof value === 'boolean') return value;
  return value.toLowerCase() === 'true' || value === '1';
});

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LIVE_TRANSFERS_ENABLED: booleanFromEnv.default(false),
});

export const apiEnvSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')),
  API_PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(16),
  WEBHOOK_SIGNING_SECRET: z.string().min(8),
});

export const workerEnvSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')),
  WORKER_PORT: z.coerce.number().int().positive().default(3002),
  WEBHOOK_SIGNING_SECRET: z.string().min(8),
});

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SANDBOX_BANNER: booleanFromEnv.default(true),
});

export const mobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type MobileEnv = z.infer<typeof mobileEnvSchema>;

export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(formatted)}`);
  }
  return result.data as z.infer<T>;
}
