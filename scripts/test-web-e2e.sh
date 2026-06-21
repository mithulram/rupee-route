#!/usr/bin/env bash
# Run web E2E + a11y with API + Postgres (requires Node 22, pnpm 9, Docker).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "Node 22+ required (found $(node -v))" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable pnpm 2>/dev/null || true
fi
PNPM_MAJOR="$(pnpm -v | cut -d. -f1)"
if [[ "$PNPM_MAJOR" -lt 9 ]]; then
  echo "pnpm 9+ required (found $(pnpm -v))" >&2
  exit 1
fi

bash scripts/setup-local.sh

pnpm lint
pnpm typecheck
pnpm test
pnpm build

pnpm --filter @rupeeroute/web exec playwright install --with-deps chromium firefox webkit

pnpm --filter @rupeeroute/web build

pnpm --filter @rupeeroute/web test:e2e
pnpm --filter @rupeeroute/web test:a11y
pnpm --filter @rupeeroute/web exec playwright test e2e/screenshots.spec.ts --grep @screenshot --project=chromium-desktop

echo "==> Web E2E suite complete"
