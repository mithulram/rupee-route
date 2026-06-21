#!/usr/bin/env bash
# Post-deploy smoke checks for sandbox (web + API).
set -euo pipefail

WEB_URL="${WEB_URL:?Set WEB_URL to the deployed Vercel HTTPS origin}"
API_URL="${API_URL:?Set API_URL to the deployed sandbox API HTTPS origin}"

if [[ "$API_URL" == *localhost* ]]; then
  echo "ERROR: API_URL must not be localhost for deployed smoke tests" >&2
  exit 1
fi

echo "==> API health: $API_URL/health"
health="$(curl -sf "$API_URL/health")"
echo "$health" | head -c 500
echo

if echo "$health" | grep -q '"liveTransfersEnabled":false'; then
  echo "PASS liveTransfersEnabled=false"
else
  echo "FAIL expected liveTransfersEnabled=false" >&2
  exit 1
fi

if echo "$health" | grep -q '"sandboxMode":true'; then
  echo "PASS sandboxMode=true"
else
  echo "FAIL expected sandboxMode=true" >&2
  exit 1
fi

echo "==> Web landing: $WEB_URL"
landing_code="$(curl -sf -o /dev/null -w '%{http_code}' "$WEB_URL")"
if [[ "$landing_code" == "200" ]]; then
  echo "PASS landing HTTP 200"
else
  echo "FAIL landing HTTP $landing_code" >&2
  exit 1
fi

echo "==> Web login: $WEB_URL/login"
login_code="$(curl -sf -o /dev/null -w '%{http_code}' "$WEB_URL/login")"
if [[ "$login_code" == "200" ]]; then
  echo "PASS login HTTP 200"
else
  echo "FAIL login HTTP $login_code" >&2
  exit 1
fi

echo "==> Web register: $WEB_URL/register"
register_code="$(curl -sf -o /dev/null -w '%{http_code}' "$WEB_URL/register")"
if [[ "$register_code" == "200" ]]; then
  echo "PASS register HTTP 200"
else
  echo "FAIL register HTTP $register_code" >&2
  exit 1
fi

echo
echo "Smoke checks passed. Run full transfer flow manually or via Playwright with PLAYWRIGHT_BASE_URL=$WEB_URL"
