import { describe, expect, it } from 'vitest';
import { processWebhookJob } from './webhook.job.js';

describe('processWebhookJob', () => {
  it('exports processor function', () => {
    expect(typeof processWebhookJob).toBe('function');
  });
});
