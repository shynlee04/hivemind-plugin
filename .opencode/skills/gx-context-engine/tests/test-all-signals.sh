#!/usr/bin/env bash
# TDD Test: R1-02 through R1-13 — All 12 Signal Scripts
# Validates contract compliance for every signal script.
# Each must: exist, be executable, output valid JSON, have signal+score+detail fields,
# score in 0-100, handle missing state files gracefully.
set -euo pipefail

WORKDIR="${1:-/Users/apple/hivemind-plugin}"
SIGNALS_DIR="$WORKDIR/.opencode/skills/gx-context-engine/scripts/signals"

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

EXPECTED_SIGNALS=(
  "plan_adherence"
  "hierarchy_freshness"
  "decision_velocity"
  "todo_progression"
  "context_saturation"
  "hard_stop_compliance"
  "delegation_efficiency"
  "scope_proximity"
  "domain_continuity"
  "evidence_quality"
  "turn_normalized"
  "chain_integrity"
)

echo "=== TDD Test: All 12 Signal Scripts ==="
echo ""

# Check all 12 scripts exist
SCRIPT_COUNT=$(ls "$SIGNALS_DIR"/gx-signal-*.sh 2>/dev/null | wc -l | tr -d '[:space:]')
assert "12 signal scripts exist in signals/ (got $SCRIPT_COUNT)" "$([ "$SCRIPT_COUNT" = "12" ] && echo true || echo false)"

for SIGNAL_NAME in "${EXPECTED_SIGNALS[@]}"; do
  SCRIPT="$SIGNALS_DIR/gx-signal-${SIGNAL_NAME//_/-}.sh"
  echo ""
  echo "--- Signal: $SIGNAL_NAME ---"

  # Exists
  assert "[$SIGNAL_NAME] Script exists" "$([ -f "$SCRIPT" ] && echo true || echo false)"

  # Executable
  assert "[$SIGNAL_NAME] Script is executable" "$([ -x "$SCRIPT" ] && echo true || echo false)"

  if [ ! -x "$SCRIPT" ]; then
    echo "  SKIP: Cannot run non-executable script"
    continue
  fi

  # Run it
  OUTPUT=$(bash "$SCRIPT" "$WORKDIR" 2 2>/dev/null || echo '{"error":"script_crashed"}')

  # Valid JSON
  VALID_JSON="false"
  if echo "$OUTPUT" | jq '.' > /dev/null 2>&1; then
    VALID_JSON="true"
  fi
  assert "[$SIGNAL_NAME] Output is valid JSON" "$VALID_JSON"

  if [ "$VALID_JSON" != "true" ]; then
    echo "  SKIP: Cannot validate non-JSON output: $OUTPUT"
    continue
  fi

  # Has signal field matching expected name
  ACTUAL_SIGNAL=$(echo "$OUTPUT" | jq -r '.signal // "MISSING"')
  assert "[$SIGNAL_NAME] signal field = '$SIGNAL_NAME' (got '$ACTUAL_SIGNAL')" \
    "$([ "$ACTUAL_SIGNAL" = "$SIGNAL_NAME" ] && echo true || echo false)"

  # Has score field
  HAS_SCORE=$(echo "$OUTPUT" | jq 'has("score")' 2>/dev/null || echo "false")
  assert "[$SIGNAL_NAME] Has score field" "$HAS_SCORE"

  # Score is numeric 0-100
  SCORE_VALID=$(echo "$OUTPUT" | jq '.score | type == "number" and . >= 0 and . <= 100' 2>/dev/null || echo "false")
  assert "[$SIGNAL_NAME] Score is numeric [0,100]" "$SCORE_VALID"

  # Has detail field
  HAS_DETAIL=$(echo "$OUTPUT" | jq 'has("detail")' 2>/dev/null || echo "false")
  assert "[$SIGNAL_NAME] Has detail field" "$HAS_DETAIL"

  # Has formula in detail
  HAS_FORMULA=$(echo "$OUTPUT" | jq '.detail | has("formula")' 2>/dev/null || echo "false")
  assert "[$SIGNAL_NAME] Detail includes formula" "$HAS_FORMULA"
done

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: RED (tests failing)"
  exit 1
else
  echo "STATUS: GREEN (all tests pass)"
  exit 0
fi
