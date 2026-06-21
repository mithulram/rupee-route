import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe } from 'vitest';
import { AppModule } from '../app.module';
import { ensureTestEnv, assertIntegrationCiEnv } from './integration-env';

export function describeIntegration(name: string, fn: () => void): void {
  assertIntegrationCiEnv();
  if (!process.env.DATABASE_URL) {
    if (process.env.CI === 'true') {
      throw new Error('DATABASE_URL is required in CI — integration tests must not be skipped');
    }
    describe.skip(name, fn);
    return;
  }
  describe(name, fn);
}

export async function createIntegrationApp(): Promise<INestApplication> {
  ensureTestEnv();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}
