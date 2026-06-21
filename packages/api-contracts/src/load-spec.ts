import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadOpenApiSpec(): Record<string, unknown> {
  const specPath = join(__dirname, '..', 'openapi.yaml');
  const raw = readFileSync(specPath, 'utf8');
  return parse(raw) as Record<string, unknown>;
}
