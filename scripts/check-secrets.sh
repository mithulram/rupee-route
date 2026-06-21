#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCAN_ROOT="${1:-.}"
EXCLUDE_PATHS=(
  '--exclude-dir=node_modules'
  '--exclude-dir=.next'
  '--exclude-dir=dist'
  '--exclude-dir=.turbo'
  '--exclude-dir=coverage'
  '--exclude=pnpm-lock.yaml'
  '--exclude=*.png'
  '--exclude=*.jpg'
  '--exclude=*.svg'
)

PATTERNS=(
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
  'sk_live_[0-9a-zA-Z]{16,}'
  'sk_test_[0-9a-zA-Z]{16,}'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  'ghp_[0-9A-Za-z]{20,}'
  'github_pat_[0-9A-Za-z_]{20,}'
)

echo "==> Running basic secret pattern scan in ${SCAN_ROOT}"

matches=0

for pattern in "${PATTERNS[@]}"; do
  if rg -n -S "${EXCLUDE_PATHS[@]}" "$pattern" "$SCAN_ROOT" >/tmp/rupeeroute-secret-scan.txt 2>/dev/null; then
    echo "Potential secret match for pattern: ${pattern}"
    cat /tmp/rupeeroute-secret-scan.txt
    matches=1
  fi
done

if [[ "$matches" -ne 0 ]]; then
  echo "Secret scan failed."
  exit 1
fi

echo "Secret scan passed."
