#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PATH="${PATH}:${HOME}/.maestro/bin"
EVIDENCE_DIR="${ROOT}/docs/evidence"
PLATFORM="${1:-ios}"
STAMP="$(date -u +%Y%m%dT%H%MZ)"
RUN_DIR="${EVIDENCE_DIR}/maestro-${PLATFORM}-${STAMP}"
LOG_FILE="${RUN_DIR}/maestro.log"
SUMMARY_FILE="${RUN_DIR}/summary.txt"

mkdir -p "$RUN_DIR"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install: https://maestro.mobile.dev/docs/getting-started/installing-maestro" >&2
  exit 1
fi

API_URL="${API_URL:-http://localhost:3001}"

ensure_api() {
  if curl -sf "${API_URL}/health" >/dev/null; then
    return 0
  fi
  echo "Starting sandbox API…" | tee -a "$LOG_FILE"
  (
    cd "$ROOT"
    set -a
    # shellcheck disable=SC1091
    source apps/api/.env
    set +a
    export SANDBOX_FORCE_KYC_APPROVED=true
    pnpm --filter @rupeeroute/api dev
  ) >>"${RUN_DIR}/api.log" 2>&1 &
  API_PID=$!
  echo "$API_PID" >"${RUN_DIR}/api.pid"
  for _ in $(seq 1 60); do
    if curl -sf "${API_URL}/health" >/dev/null; then
      return 0
    fi
    sleep 2
  done
  echo "API failed to start. See ${RUN_DIR}/api.log" >&2
  exit 1
}

ensure_api

bash "$ROOT/scripts/provision-maestro-user.sh" 2>&1 | tee -a "$LOG_FILE"
set -a
# shellcheck disable=SC1091
source "${EVIDENCE_DIR}/.maestro-credentials.env"
set +a
export MAESTRO_RECIPIENT_NAME="${MAESTRO_RECIPIENT_NAME:-Maestro Recipient}"

SIM_MODEL=""
SIM_OS=""

ios_simulator_sdk_version() {
  xcodebuild -showsdks 2>/dev/null \
    | grep -E 'iphonesimulator[0-9]' \
    | tail -1 \
    | sed -E 's/.*iphonesimulator([0-9.]+).*/\1/'
}

ios_pick_simulator() {
  local preferred_name="${MAESTRO_IOS_SIMULATOR:-iPhone 15 Pro}"
  local sdk_version
  sdk_version="$(ios_simulator_sdk_version)"

  if [[ -z "$sdk_version" ]]; then
    echo "Could not detect iOS Simulator SDK from xcodebuild -showsdks" >&2
    return 1
  fi

  local runtime_line runtime_id runtime_version
  runtime_line="$(xcrun simctl list runtimes available 2>/dev/null | grep -E "iOS ${sdk_version} \\(" | head -1 || true)"
  if [[ -z "$runtime_line" ]]; then
    echo "No iOS ${sdk_version} simulator runtime installed (Xcode SDK requires matching runtime)." >&2
    echo "Install via: xcodebuild -downloadPlatform iOS" >&2
    echo "Or Xcode > Settings > Platforms > iOS ${sdk_version}" >&2
    return 1
  fi
  runtime_id="$(sed -E 's/.*- (com.apple[^ ]+).*/\1/' <<<"$runtime_line")"
  runtime_version="$(sed -E 's/^iOS ([0-9.]+).*/\1/' <<<"$runtime_line")"

  local device_line udid
  device_line="$(xcrun simctl list devices available 2>/dev/null \
    | awk -v rt="-- iOS ${runtime_version} --" '$0 == rt { in_rt=1; next } in_rt && /^-- / { exit } in_rt && index($0, "'"${preferred_name}"' (") { print; exit }')"
  if [[ -z "$device_line" ]]; then
    device_line="$(xcrun simctl list devices available 2>/dev/null \
      | awk -v rt="-- iOS ${runtime_version} --" '$0 == rt { in_rt=1; next } in_rt && /^-- / { exit } in_rt && /iPhone/ { print; exit }')"
  fi
  if [[ -z "$device_line" ]]; then
    echo "No iOS ${runtime_version} simulator device found for '${preferred_name}'." >&2
    return 1
  fi

  udid="$(sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' <<<"$device_line")"
  SIM_NAME="$(sed -E 's/^[[:space:]]*(.+)[[:space:]]+\([A-F0-9-]+\).*/\1/' <<<"$device_line" | sed 's/[[:space:]]*$//')"
  SIM_UDID="$udid"
  SIM_OS="$runtime_version"
  SIM_MODEL="${SIM_NAME} (iOS ${runtime_version})"
}

if [[ "$PLATFORM" == "ios" ]]; then
  if ! ios_pick_simulator; then
    exit 1
  fi
  echo "Booting iOS simulator: ${SIM_MODEL} (${SIM_UDID})" | tee -a "$LOG_FILE"
  xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
  open -a Simulator --args -CurrentDeviceUDID "$SIM_UDID" || true

  if ! xcrun simctl get_app_container "$SIM_UDID" com.rupeeroute.sandbox data >/dev/null 2>&1; then
    echo "Building and installing Expo app on simulator…" | tee -a "$LOG_FILE"
    if pgrep -xq xcodebuild; then
      echo "Waiting for in-flight xcodebuild to finish…" | tee -a "$LOG_FILE"
      while pgrep -xq xcodebuild; do sleep 5; done
    fi
    if ! pod --version 2>/dev/null | awk -F. '$1>1 || ($1==1 && $2>=15) { ok=1 } END { exit !ok }'; then
      echo "CocoaPods >= 1.15 required for RN 0.76 (visionos podspec). Current: $(pod --version 2>/dev/null || echo missing)" >&2
      echo "Run: gem install cocoapods -v '~> 1.16'" >&2
      exit 1
    fi
    echo "CocoaPods $(pod --version 2>/dev/null) OK" | tee -a "$LOG_FILE"
    BUILD_ROOT="$ROOT"
    if [[ "$ROOT" == *" "* ]]; then
      SYMLINK="/tmp/rupee-route"
      ln -sfn "$ROOT" "$SYMLINK"
      BUILD_ROOT="$SYMLINK"
      echo "Using symlink ${SYMLINK} for iOS build (spaces in repo path)." | tee -a "$LOG_FILE"
    fi
    (
      cd "${BUILD_ROOT}/apps/mobile"
      export EXPO_PUBLIC_API_URL="${API_URL}"
      npx expo run:ios --device "${SIM_UDID}"
    ) >>"${RUN_DIR}/expo-build.log" 2>&1
  fi
elif [[ "$PLATFORM" == "android" ]]; then
  if ! command -v emulator >/dev/null 2>&1 && [[ ! -x "${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator" ]]; then
    echo "ANDROID_PENDING: No Android SDK/emulator on this machine." | tee "$SUMMARY_FILE"
    echo "Install Android Studio, create an AVD (API 34+), set ANDROID_HOME, then re-run:" | tee -a "$SUMMARY_FILE"
    echo "  bash scripts/test-mobile-maestro.sh android" | tee -a "$SUMMARY_FILE"
    exit 2
  fi
  EMULATOR_BIN="${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator"
  AVD_NAME="${MAESTRO_ANDROID_AVD:-$( "$EMULATOR_BIN" -list-avds 2>/dev/null | head -1 )}"
  if [[ -z "$AVD_NAME" ]]; then
    echo "ANDROID_PENDING: No AVD configured. Create one in Android Studio Device Manager." | tee "$SUMMARY_FILE"
    exit 2
  fi
  SIM_MODEL="$AVD_NAME"
  SIM_OS="Android"
  "$EMULATOR_BIN" -avd "$AVD_NAME" -no-snapshot-load >>"${RUN_DIR}/emulator.log" 2>&1 &
  adb wait-for-device
  (
    cd "$ROOT/apps/mobile"
    export EXPO_PUBLIC_API_URL="http://10.0.2.2:3001"
    npx expo run:android
  ) >>"${RUN_DIR}/expo-build.log" 2>&1
else
  echo "Unknown platform: $PLATFORM (use ios or android)" >&2
  exit 1
fi

export MAESTRO_DRIVER_STARTUP_TIMEOUT=120000

FLOWS=(login send-smoke send-full coupons tabs-a11y)
PASSED=0
FAILED=0

{
  echo "platform=${PLATFORM}"
  echo "simulator=${SIM_MODEL}"
  echo "os=${SIM_OS}"
  echo "date=${STAMP}"
  echo "maestro=$(maestro --version 2>/dev/null | tail -1 || echo unknown)"
  echo "api=${API_URL}"
  echo "user=${MAESTRO_TEST_EMAIL}"
} >"$SUMMARY_FILE"

echo "Running Maestro flows on ${PLATFORM}…" | tee "$LOG_FILE"

for flow in "${FLOWS[@]}"; do
  echo "=== flow: ${flow}.yaml ===" | tee -a "$LOG_FILE"
  FLOW_DIR="${RUN_DIR}/${flow}"
  mkdir -p "$FLOW_DIR"
  if maestro test \
    --debug-output "$FLOW_DIR" \
    --format junit \
    --output "${FLOW_DIR}/results.xml" \
    -e "MAESTRO_TEST_EMAIL=${MAESTRO_TEST_EMAIL}" \
    -e "MAESTRO_TEST_PASSWORD=${MAESTRO_TEST_PASSWORD}" \
    -e "MAESTRO_RECIPIENT_NAME=${MAESTRO_RECIPIENT_NAME}" \
    ".maestro/flows/${flow}.yaml" >>"$LOG_FILE" 2>&1; then
    echo "PASS ${flow}" | tee -a "$LOG_FILE"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL ${flow}" | tee -a "$LOG_FILE"
    FAILED=$((FAILED + 1))
  fi
done

echo "passed=${PASSED}" >>"$SUMMARY_FILE"
echo "failed=${FAILED}" >>"$SUMMARY_FILE"
echo "log=${LOG_FILE}" >>"$SUMMARY_FILE"

ln -sf "$(basename "$RUN_DIR")/maestro.log" "${EVIDENCE_DIR}/maestro-${PLATFORM}-latest.log" 2>/dev/null || true

echo "Maestro ${PLATFORM}: ${PASSED} passed, ${FAILED} failed — evidence: ${RUN_DIR}"

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi
