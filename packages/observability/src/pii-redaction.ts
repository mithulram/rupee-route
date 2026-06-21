const PII_FIELD_PATTERN =
  /email|password|token|secret|iban|account|phone|ssn|nationalid|passport|address/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function redactPii(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
  }

  if (Array.isArray(value)) {
    return value.map(redactPii);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (PII_FIELD_PATTERN.test(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactPii(nested);
      }
    }
    return result;
  }

  return value;
}
