import { describe, expect, it } from 'vitest';
import { redactPii } from './pii-redaction.js';

describe('redactPii', () => {
  it('redacts email fields and inline emails', () => {
    const result = redactPii({
      email: 'user@example.com',
      message: 'Contact user@example.com for help',
    }) as Record<string, string>;

    expect(result.email).toBe('[REDACTED]');
    expect(result.message).toBe('Contact [REDACTED_EMAIL] for help');
  });

  it('redacts nested secrets', () => {
    const result = redactPii({ auth: { token: 'abc123' } }) as {
      auth: { token: string };
    };
    expect(result.auth.token).toBe('[REDACTED]');
  });
});
