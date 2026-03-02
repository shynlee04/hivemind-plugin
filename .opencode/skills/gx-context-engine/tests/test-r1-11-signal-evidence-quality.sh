#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
SCRIPT="$ROOT_DIR/.opencode/skills/gx-context-engine/scripts/signals/gx-signal-evidence-quality.sh"

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

echo "=== TDD Test: R1-11 S10 evidence_quality ==="

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if OUT_MISSING="$($SCRIPT "$TMP_DIR" "2")"; then
  EXIT_MISSING=0
else
  EXIT_MISSING=$?
fi

assert "Missing state exits 0" "$([ "$EXIT_MISSING" -eq 0 ] && echo true || echo false)"
assert "Missing state output valid JSON" "$(echo "$OUT_MISSING" | jq -e '.' >/dev/null 2>&1 && echo true || echo false)"
assert "Signal name is evidence_quality" "$([ "$(echo "$OUT_MISSING" | jq -r '.signal // ""')" = "evidence_quality" ] && echo true || echo false)"
assert "Score is numeric 0-100" "$(echo "$OUT_MISSING" | jq -r '((.score | type) == "number") and (.score >= 0 and .score <= 100)' 2>/dev/null || echo false)"
assert "No completed items defaults to 50" "$([ "$(echo "$OUT_MISSING" | jq -r '.score')" = "50" ] && echo true || echo false)"

mkdir -p "$TMP_DIR/.hivemind/state"
cat > "$TMP_DIR/.hivemind/state/todo.json" <<'JSON'
{
  "items": [
    { "status": "completed", "evidence": "link-1" },
    { "status": "completed", "evidence": "   " },
    { "status": "completed", "evidence": "link-2" },
    { "status": "in_progress", "evidence": "n/a" }
  ]
}
JSON

OUT_SAMPLE="$($SCRIPT "$TMP_DIR" "2")"
assert "Sample score matches formula (2/3 => 66)" "$([ "$(echo "$OUT_SAMPLE" | jq -r '.score')" = "66" ] && echo true || echo false)"

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
