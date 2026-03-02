#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MID_GUARD_SCRIPT="$ROOT_DIR/scripts/gx-mid-guard.sh"
HEALTH_COMPUTE_SCRIPT="$ROOT_DIR/scripts/gx-health-compute.sh"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

pass() {
  printf 'PASS: %s\n' "$1"
}

[ -f "$MID_GUARD_SCRIPT" ] || fail "Missing script: $MID_GUARD_SCRIPT"

if grep -q "dirty_score" "$MID_GUARD_SCRIPT"; then
  fail "Legacy dirty_score token still present in gx-mid-guard.sh"
fi
pass "No dirty_score token in gx-mid-guard.sh"

if ! grep -q "gx-health-compute" "$MID_GUARD_SCRIPT"; then
  fail "gx-mid-guard.sh does not call gx-health-compute.sh"
fi
pass "gx-mid-guard.sh calls gx-health-compute.sh"

PROJECT_ROOT="$(cd "$ROOT_DIR/../../.." && pwd)"
MOCKED_HEALTH=false

if [ ! -f "$HEALTH_COMPUTE_SCRIPT" ]; then
  printf 'NOTE: Missing dependency %s (expected from R1-14). Injecting deterministic mock for contract assertions.\n' "$HEALTH_COMPUTE_SCRIPT"
  cat >"$HEALTH_COMPUTE_SCRIPT" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

jq -n '{
  composite: {
    score: 82,
    status: "warning",
    hard_blocked: false
  },
  signals: {
    signal_01: {score: 90},
    signal_02: {score: 90},
    signal_03: {score: 90},
    signal_04: {score: 90},
    signal_05: {score: 90},
    signal_06: {score: 90},
    signal_07: {score: 90},
    signal_08: {score: 90},
    signal_09: {score: 90},
    signal_10: {score: 90},
    signal_11: {score: 90},
    signal_12: {score: 90}
  }
}'
EOF
  chmod +x "$HEALTH_COMPUTE_SCRIPT"
  MOCKED_HEALTH=true
fi

cleanup() {
  if [ "$MOCKED_HEALTH" = true ]; then
    rm -f "$HEALTH_COMPUTE_SCRIPT"
  fi
}

trap cleanup EXIT

set +e
OUTPUT="$(bash "$MID_GUARD_SCRIPT" "$PROJECT_ROOT" 2>&1)"
EXIT_CODE=$?
set -e

if [ "$EXIT_CODE" -ne 0 ]; then
  fail "gx-mid-guard.sh exited non-zero: $OUTPUT"
fi

if ! echo "$OUTPUT" | jq -e '.' >/dev/null 2>&1; then
  fail "Output is not valid JSON: $OUTPUT"
fi
pass "Output is valid JSON"

if ! echo "$OUTPUT" | jq -e '(.composite_score | type) == "number"' >/dev/null; then
  fail "Output missing numeric composite_score"
fi
pass "Output includes numeric composite_score"

if ! echo "$OUTPUT" | jq -e '(.status | type) == "string"' >/dev/null; then
  fail "Output missing string status"
fi
pass "Output includes string status"

if ! echo "$OUTPUT" | jq -e '(.hard_blocked | type) == "boolean"' >/dev/null; then
  fail "Output missing boolean hard_blocked"
fi
pass "Output includes boolean hard_blocked"

if ! echo "$OUTPUT" | jq -e '(.signals | type) == "object" and ((.signals | keys | length) == 12)' >/dev/null; then
  fail "Output missing signals object with 12 keys"
fi
pass "Output includes signals object with 12 keys"

if ! echo "$OUTPUT" | jq -e '.threshold == null' >/dev/null; then
  fail "Undocumented threshold field found in output"
fi
pass "No undocumented threshold field"

printf 'PASS: R1-15 mid-guard assertions complete\n'
