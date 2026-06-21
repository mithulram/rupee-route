#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Copying environment files"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

for app in api worker web admin mobile; do
  if [[ -f "apps/$app/.env.example" && ! -f "apps/$app/.env" ]]; then
    cp "apps/$app/.env.example" "apps/$app/.env"
    echo "Created apps/$app/.env"
  fi
done

if [[ ! -f packages/domain/.env ]]; then
  grep '^DATABASE_URL=' .env > packages/domain/.env
  echo "Created packages/domain/.env"
fi

echo "==> Starting Docker services"
docker compose -f infra/docker-compose.yml up -d

echo "==> Installing dependencies"
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable pnpm 2>/dev/null || true
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Install Node 22+ and run: corepack enable pnpm" >&2
  exit 1
fi
pnpm install

echo "==> Generating Prisma client"
pnpm db:generate

echo "==> Running migrations"
pnpm db:migrate

echo "==> Setup complete"
echo "Run: pnpm dev"
