#!/usr/bin/env sh
# Sandbox API container entrypoint — migrations, optional embedded worker, foreground API.
set -eu

WORKER_PID=""
API_PID=""

shutdown() {
  trap - TERM INT
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill -TERM "$API_PID" 2>/dev/null || true
  fi
  if [ -n "$WORKER_PID" ] && kill -0 "$WORKER_PID" 2>/dev/null; then
    kill -TERM "$WORKER_PID" 2>/dev/null || true
  fi
  if [ -n "$WORKER_PID" ]; then
    wait "$WORKER_PID" 2>/dev/null || true
  fi
  if [ -n "$API_PID" ]; then
    wait "$API_PID" 2>/dev/null || true
  fi
  exit 0
}

trap shutdown TERM INT

echo "==> Running database migrations"
pnpm db:migrate

if [ "${SANDBOX_COMBINED_WORKER:-}" = "true" ]; then
  echo "==> Starting embedded sandbox worker (WORKER_PORT=${WORKER_PORT:-3002})"
  pnpm --filter @rupeeroute/worker start &
  WORKER_PID=$!
fi

echo "==> Starting API"
pnpm --filter @rupeeroute/api start &
API_PID=$!

wait "$API_PID"
shutdown
