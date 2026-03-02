#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
SCRIPT="$ROOT_DIR/.opencode/skills/gx-context-engine/scripts/signals/gx-signal-turn-normalized.sh"

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

echo "=== TDD Test: R1-12 S11 turn_normalized ==="

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if OUT_MISSING="$($SCRIPT "$TMP_DIR" "2")"; then
  EXIT_MISSING=0
else
  EXIT_MISSING=$?
fi

assert "Missing state exits 0" "$([ "$EXIT_MISSING" -eq 0 ] && echo true || echo false)"
assert "Missing state output valid JSON" "$(echo "$OUT_MISSING" | jq -e '.' >/dev/null 2>&1 && echo true || echo false)"
assert "Signal name is turn_normalized" "$([ "$(echo "$OUT_MISSING" | jq -r '.signal // ""')" = "turn_normalized" ] && echo true || echo false)"
assert "Score is numeric 0-100" "$(echo "$OUT_MISSING" | jq -r '((.score | type) == "number") and (.score >= 0 and .score <= 100)' 2>/dev/null || echo false)"
assert "Missing state defaults to 100" "$([ "$(echo "$OUT_MISSING" | jq -r '.score')" = "100" ] && echo true || echo false)"

mkdir -p "$TMP_DIR/.hivemind/state"
cat > "$TMP_DIR/.hivemind/state/enforcement.json" <<'JSON'
{
  "turnCount": 42
}
JSON

OUT_SAMPLE="$($SCRIPT "$TMP_DIR" "2")"
assert "Sample score matches formula (turn 42 => 58)" "$([ "$(echo "$OUT_SAMPLE" | jq -r '.score')" = "58" ] && echo true || echo false)"

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
