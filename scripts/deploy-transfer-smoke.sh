#!/usr/bin/env bash
# End-to-end sandbox transfer smoke (register → confirm → funding webhook → tracking).
set -euo pipefail

API_URL="${API_URL:?Set API_URL to the deployed sandbox API HTTPS origin}"
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-srv-d8rmseegvqtc73f8qn40}"

if [[ "$API_URL" == *localhost* ]]; then
  echo "ERROR: API_URL must be the deployed HTTPS origin" >&2
  exit 1
fi

WEBHOOK_SECRET="${WEBHOOK_SIGNING_SECRET:-}"
if [[ -z "$WEBHOOK_SECRET" && -f "$HOME/.render/cli.yaml" ]]; then
  WEBHOOK_SECRET="$(python3 <<'PY'
import json, os, re, urllib.request
key=re.search(r'key: (rnd_\S+)', open(os.path.expanduser('~/.render/cli.yaml')).read()).group(1)
svc=os.environ.get('RENDER_SERVICE_ID', 'srv-d8rmseegvqtc73f8qn40')
req=urllib.request.Request(
    f'https://api.render.com/v1/services/{svc}/env-vars/WEBHOOK_SIGNING_SECRET',
    headers={'Authorization': f'Bearer {key}'},
)
print(json.loads(urllib.request.urlopen(req).read())['value'])
PY
)"
fi

if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "ERROR: Set WEBHOOK_SIGNING_SECRET or authenticate Render CLI for secret lookup" >&2
  exit 1
fi

EMAIL="transfer-smoke-$(date +%s)@sandbox.rupeeroute.test"
PASSWORD="SandboxSmoke123!"
IDEM() { uuidgen | tr '[:upper:]' '[:lower:]'; }

sign_payload() {
  local payload="$1"
  WEBHOOK_PAYLOAD="$payload" WEBHOOK_SECRET="$WEBHOOK_SECRET" node -e \
    'const c=require("crypto"); const p=JSON.parse(process.env.WEBHOOK_PAYLOAD); process.stdout.write(c.createHmac("sha256", process.env.WEBHOOK_SECRET).update(JSON.stringify(p)).digest("hex"));'
}

echo "==> Register"
REG=$(curl -sf -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"countryCode\":\"DE\"}")
TOKEN=$(echo "$REG" | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")

echo "==> Create recipient, quote, transfer"
RECIPIENT=$(curl -sf -X POST "$API_URL/api/v1/recipients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(IDEM)" \
  -d '{"type":"bank_account","displayName":"Smoke Recipient","accountHolder":"Test Holder","ifsc":"HDFC0001234","accountNumber":"123456789012"}')
RECIPIENT_ID=$(echo "$RECIPIENT" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

QUOTE=$(curl -sf -X POST "$API_URL/api/v1/quotes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(IDEM)" \
  -d '{"sourceCurrency":"EUR","sourceAmountMinor":"10000"}')
QUOTE_ID=$(echo "$QUOTE" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

TRANSFER=$(curl -sf -X POST "$API_URL/api/v1/transfers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(IDEM)" \
  -d "{\"quoteId\":\"$QUOTE_ID\"}")
TRANSFER_ID=$(echo "$TRANSFER" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

curl -sf -X POST "$API_URL/api/v1/transfers/$TRANSFER_ID/recipient" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(IDEM)" \
  -d "{\"recipientId\":\"$RECIPIENT_ID\"}" >/dev/null

CONFIRM=$(curl -sf -X POST "$API_URL/api/v1/transfers/$TRANSFER_ID/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(IDEM)" \
  -d '{}')
STATE=$(echo "$CONFIRM" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])")
if [[ "$STATE" != "funding_pending" ]]; then
  echo "FAIL expected funding_pending after confirm, got $STATE" >&2
  exit 1
fi
echo "PASS confirm → funding_pending"

EVENT_ID="evt_smoke_$(date +%s)"
CORR=$(echo "$CONFIRM" | python3 -c "import json,sys; print(json.load(sys.stdin).get('correlationId',''))")
PAYLOAD=$(python3 -c "import json; print(json.dumps({'eventId':'$EVENT_ID','eventType':'funding.received','transferId':'$TRANSFER_ID','correlationId':'$CORR','occurredAt':'$(date -u +%Y-%m-%dT%H:%M:%SZ)'}))")
SIG=$(sign_payload "$PAYLOAD")

echo "==> Post funding.received webhook"
curl -sf -X POST "$API_URL/api/v1/webhooks/provider" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$PAYLOAD" >/dev/null

echo "==> Wait for worker to advance transfer"
for i in $(seq 1 30); do
  DETAIL=$(curl -sf "$API_URL/api/v1/transfers/$TRANSFER_ID" -H "Authorization: Bearer $TOKEN")
  STATE=$(echo "$DETAIL" | python3 -c "import json,sys; print(json.load(sys.stdin)['state'])")
  if [[ "$STATE" == "funding_received" ]]; then
    echo "PASS transfer reached funding_received"
    echo "Transfer tracking OK for $TRANSFER_ID"
    exit 0
  fi
  sleep 2
done

echo "FAIL transfer still in state $STATE after webhook (worker/Redis may be unavailable)" >&2
exit 1
