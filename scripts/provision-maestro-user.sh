#!/usr/bin/env bash
# Provisions a deterministic sandbox user for Maestro mobile E2E (no manual credentials).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_URL="${API_URL:-http://localhost:3001}"
SANDBOX_EMAIL="${MAESTRO_TEST_EMAIL:-maestro-e2e@sandbox.rupeeroute.test}"
SANDBOX_PASSWORD="${MAESTRO_TEST_PASSWORD:-maestro-sandbox-pass-123}"
RECIPIENT_NAME="${MAESTRO_RECIPIENT_NAME:-Maestro Recipient}"

if ! curl -sf "${API_URL}/health" >/dev/null; then
  echo "API not reachable at ${API_URL}. Start sandbox API first." >&2
  exit 1
fi

register() {
  curl -sf -X POST "${API_URL}/api/v1/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${SANDBOX_EMAIL}\",\"password\":\"${SANDBOX_PASSWORD}\",\"countryCode\":\"DE\"}" \
    >/dev/null 2>&1 || true
}

login_token() {
  curl -sf -X POST "${API_URL}/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${SANDBOX_EMAIL}\",\"password\":\"${SANDBOX_PASSWORD}\"}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).accessToken))"
}

register
TOKEN="$(login_token)"
if [[ -z "$TOKEN" ]]; then
  echo "Failed to provision Maestro sandbox user at ${SANDBOX_EMAIL}" >&2
  exit 1
fi

IDEM=$(uuidgen | tr '[:upper:]' '[:lower:]')
ACCOUNT_SUFFIX="$(date +%s | tail -c 6)"
curl -sf -X POST "${API_URL}/api/v1/recipients" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Idempotency-Key: ${IDEM}" \
  -H 'Content-Type: application/json' \
  -d "{\"type\":\"bank_account\",\"displayName\":\"${RECIPIENT_NAME}\",\"accountHolder\":\"Test Holder\",\"ifsc\":\"HDFC0001234\",\"accountNumber\":\"1234567890${ACCOUNT_SUFFIX}\"}" \
  >/dev/null 2>&1 || true

export MAESTRO_TEST_EMAIL="$SANDBOX_EMAIL"
export MAESTRO_TEST_PASSWORD="$SANDBOX_PASSWORD"
export MAESTRO_RECIPIENT_NAME="$RECIPIENT_NAME"

CREDS_FILE="${ROOT}/docs/evidence/.maestro-credentials.env"
mkdir -p "$(dirname "$CREDS_FILE")"
cat >"$CREDS_FILE" <<EOF
# Auto-generated sandbox credentials — safe for public repo (no real users).
MAESTRO_TEST_EMAIL=${SANDBOX_EMAIL}
MAESTRO_TEST_PASSWORD=${SANDBOX_PASSWORD}
MAESTRO_RECIPIENT_NAME="${RECIPIENT_NAME}"
EOF

echo "Provisioned Maestro user: ${SANDBOX_EMAIL} (recipient: ${RECIPIENT_NAME})"
