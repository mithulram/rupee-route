#!/usr/bin/env bash
# Post-deploy verification: optional API restart, health wait, deploy + transfer smoke.
# Safe for CI and manual post-deploy checks. Does NOT trigger Blueprint Manual Sync.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

API_URL="${API_URL:?Set API_URL to the deployed sandbox API HTTPS origin}"
WEB_URL="${WEB_URL:-https://rupee-route-web.vercel.app}"
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-srv-d8rmseegvqtc73f8qn40}"
RESTART="${RESTART:-false}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-300}"
HEALTH_INTERVAL_SEC="${HEALTH_INTERVAL_SEC:-5}"

if [[ "$API_URL" == *localhost* ]]; then
  echo "ERROR: API_URL must be the deployed HTTPS origin" >&2
  exit 1
fi

wait_for_health() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SEC))
  echo "==> Waiting for $API_URL/health (timeout ${HEALTH_TIMEOUT_SEC}s)"
  while (( SECONDS < deadline )); do
    if health="$(curl -sf "$API_URL/health" 2>/dev/null)"; then
      if echo "$health" | grep -q '"liveTransfersEnabled":false' \
        && echo "$health" | grep -q '"sandboxMode":true'; then
        echo "PASS health ready"
        echo "$health" | head -c 500
        echo
        return 0
      fi
    fi
    sleep "$HEALTH_INTERVAL_SEC"
  done
  echo "FAIL health not ready within ${HEALTH_TIMEOUT_SEC}s" >&2
  return 1
}

if [[ "$RESTART" == "true" || "$RESTART" == "1" ]]; then
  echo "==> Restarting Render API service $RENDER_SERVICE_ID"
  render restart "$RENDER_SERVICE_ID" --confirm
  # Render free tier may cold-start; allow extra time after restart.
  sleep 15
fi

wait_for_health

echo "==> Deploy smoke (health + web pages)"
export WEB_URL API_URL
bash "$ROOT/scripts/deploy-smoke.sh"

echo "==> Transfer smoke (confirm → webhook → funding_received)"
export API_URL RENDER_SERVICE_ID
bash "$ROOT/scripts/deploy-transfer-smoke.sh"

echo "Post-restart smoke passed."
