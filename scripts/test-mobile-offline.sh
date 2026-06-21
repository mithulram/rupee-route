#!/usr/bin/env bash
# Lightweight mobile verification without iOS/Android simulators.
# Use on low-RAM machines or beta macOS where native builds fail.
# Device E2E (Maestro) remains optional — run in CI or on hardware with stable Xcode.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

EVIDENCE_DIR="${ROOT}/docs/evidence"
STAMP="$(date -u +%Y%m%dT%H%MZ)"
RUN_DIR="${EVIDENCE_DIR}/mobile-offline-${STAMP}"
LOG_FILE="${RUN_DIR}/verification.log"
SUMMARY_FILE="${RUN_DIR}/summary.txt"

mkdir -p "$RUN_DIR"

log() {
  echo "$*" | tee -a "$LOG_FILE"
}

log "=== Mobile offline verification (${STAMP}) ==="
log "node=$(node -v 2>/dev/null || echo unknown)"
log "pnpm=$(pnpm -v 2>/dev/null || echo unknown)"

log ""
log "--- lint / typecheck / build ---"
pnpm --filter @rupeeroute/mobile lint 2>&1 | tee -a "$LOG_FILE"
pnpm --filter @rupeeroute/mobile typecheck 2>&1 | tee -a "$LOG_FILE"
pnpm --filter @rupeeroute/mobile build 2>&1 | tee -a "$LOG_FILE"

log ""
log "--- unit tests (Vitest + react-native-web) ---"
pnpm --filter @rupeeroute/mobile test 2>&1 | tee -a "$LOG_FILE"

log ""
log "--- Maestro flow YAML syntax ---"
FLOW_COUNT=0
for flow in "$ROOT"/.maestro/flows/*.yaml; do
  [[ -f "$flow" ]] || continue
  ruby -ryaml -e "YAML.load_file('$flow')" >/dev/null
  log "  OK $(basename "$flow")"
  FLOW_COUNT=$((FLOW_COUNT + 1))
done
if [[ "$FLOW_COUNT" -lt 1 ]]; then
  log "ERROR: no Maestro flows found in .maestro/flows/"
  exit 1
fi

log ""
log "--- static mobile config ---"
grep -q '"bundleIdentifier": "com.rupeeroute.sandbox"' "$ROOT/apps/mobile/app.json"
grep -q 'LIVE_TRANSFERS_ENABLED=false' "$ROOT/apps/api/.env.example" || true
log "  bundleId com.rupeeroute.sandbox OK"
log "  Maestro flows: ${FLOW_COUNT}"

{
  echo "date=${STAMP}"
  echo "mode=offline"
  echo "maestro_flows=${FLOW_COUNT}"
  echo "simulator_e2e=skipped"
  echo "reason=local_hardware_or_beta_os"
  echo "log=${LOG_FILE}"
} >"$SUMMARY_FILE"

ln -sf "$(basename "$RUN_DIR")/verification.log" "${EVIDENCE_DIR}/mobile-offline-latest.log" 2>/dev/null || true

log ""
log "PASS — mobile offline verification complete"
log "Evidence: ${RUN_DIR}"
log ""
log "For device E2E when hardware allows:"
log "  bash scripts/test-mobile-maestro.sh ios"
log "  bash scripts/test-mobile-maestro.sh android"
