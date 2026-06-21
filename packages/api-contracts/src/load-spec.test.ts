import { describe, expect, it } from 'vitest';
import { loadOpenApiSpec } from './load-spec.js';

describe('openapi contract', () => {
  it('loads the yaml spec with required sections', () => {
    const spec = loadOpenApiSpec();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info).toBeTruthy();
    expect(spec.paths).toBeTruthy();
  });
});
