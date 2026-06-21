import { expect, it } from 'vitest';
import { assertIntegrationCiEnv } from './integration-env';

it('requires DATABASE_URL when CI is set', () => {
  assertIntegrationCiEnv();
  if (process.env.CI === 'true') {
    expect(process.env.DATABASE_URL).toBeTruthy();
  }
});
