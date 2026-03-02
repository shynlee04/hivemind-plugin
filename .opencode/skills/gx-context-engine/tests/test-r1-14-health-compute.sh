#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/Users/apple/hivemind-plugin}"
SCRIPT="$ROOT_DIR/.opencode/skills/gx-context-engine/scripts/gx-health-compute.sh"
METRICS_FILE="$ROOT_DIR/.hivemind/state/health-metrics.json"

PASS=0
FAIL=0
TOTAL=0

assert() {
  local name="$1"
  local result="$2"
  TOTAL=$((TOTAL + 1))
  if [ "$result" = "true" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $name"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $name"
  fi
}

echo "=== TDD Test: R1-14 Signal Combinator ==="

assert "Script exists" "$([ -f "$SCRIPT" ] && echo true || echo false)"
assert "Script is executable" "$([ -x "$SCRIPT" ] && echo true || echo false)"

if command -v jq >/dev/null 2>&1; then
  assert "Pre-flight jq check" "true"
else
  assert "Pre-flight jq check" "false"
fi

if [ ! -x "$SCRIPT" ]; then
  echo ""
  echo "Script missing or not executable; skipping runtime assertions."
  echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
  exit 1
fi

BEFORE_TS=$(jq -r '(.computed_at // 0) | tonumber? // 0' "$METRICS_FILE" 2>/dev/null || echo 0)

if OUTPUT="$($SCRIPT "$ROOT_DIR" "2")"; then
  EXIT_CODE=0
else
  EXIT_CODE=$?
fi

assert "Combinator exits with code 0" "$([ "$EXIT_CODE" -eq 0 ] && echo true || echo false)"
assert "Output is valid JSON" "$(echo "$OUTPUT" | jq -e '.' >/dev/null 2>&1 && echo true || echo false)"

assert "Output has composite.score numeric 0-100" "$(
  echo "$OUTPUT" | jq -e '(.composite.score | type) == "number" and (.composite.score >= 0 and .composite.score <= 100)' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output has composite.status healthy/warning/critical" "$(
  echo "$OUTPUT" | jq -e '.composite.status == "healthy" or .composite.status == "warning" or .composite.status == "critical"' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output has composite.hard_blocked boolean" "$(
  echo "$OUTPUT" | jq -e '(.composite.hard_blocked | type) == "boolean"' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output has signals object with 12 keys" "$(
  echo "$OUTPUT" | jq -e '(.signals | type) == "object" and ((.signals | keys | length) == 12)' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output signals are nested objects (not flat numbers)" "$(
  echo "$OUTPUT" | jq -e '.signals | to_entries | all(.value | type == "object" and has("score"))' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output signal velocity is nested per signal" "$(
  echo "$OUTPUT" | jq -e '.signals | to_entries | all(.value | has("velocity"))' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output has no top-level velocity field" "$(
  echo "$OUTPUT" | jq -e 'has("velocity") | not' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output has signal_count = 12" "$(
  echo "$OUTPUT" | jq -e '.signal_count == 12' >/dev/null 2>&1 && echo true || echo false
)"

assert "Output has computed_at numeric timestamp" "$(
  echo "$OUTPUT" | jq -e '(.computed_at | type) == "number" and .computed_at > 0' >/dev/null 2>&1 && echo true || echo false
)"

AFTER_TS=$(jq -r '(.computed_at // 0) | tonumber? // 0' "$METRICS_FILE" 2>/dev/null || echo 0)
assert "health-metrics.json updated (computed_at > 0)" "$([ "$AFTER_TS" -gt 0 ] && echo true || echo false)"
assert "health-metrics.json computed_at changed or stayed monotonic" "$([ "$AFTER_TS" -ge "$BEFORE_TS" ] && echo true || echo false)"

printf '{broken json\n' > "$METRICS_FILE"
if OUTPUT_CORRUPT="$($SCRIPT "$ROOT_DIR" "2")"; then
  EXIT_CODE_CORRUPT=0
else
  EXIT_CODE_CORRUPT=$?
fi

assert "Corrupt health-metrics.json does not crash combinator" "$([ "$EXIT_CODE_CORRUPT" -eq 0 ] && echo true || echo false)"
assert "Corrupt-state run returns valid JSON" "$(echo "$OUTPUT_CORRUPT" | jq -e '.' >/dev/null 2>&1 && echo true || echo false)"
assert "Corrupt-state run rewrites valid health-metrics.json" "$(jq -e '.' "$METRICS_FILE" >/dev/null 2>&1 && echo true || echo false)"
assert "Recovered state keeps nested signal objects" "$(
  jq -e '.signals | to_entries | all(.value | type == "object" and has("score") and has("velocity"))' "$METRICS_FILE" >/dev/null 2>&1 && echo true || echo false
)"
assert "Recovered state has no top-level velocity" "$(
  jq -e 'has("velocity") | not' "$METRICS_FILE" >/dev/null 2>&1 && echo true || echo false
)"

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
