#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
SCRIPT="$ROOT_DIR/.opencode/skills/gx-context-engine/scripts/signals/gx-signal-chain-integrity.sh"

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

echo "=== TDD Test: R1-13 S12 chain_integrity ==="

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if OUT_MISSING="$($SCRIPT "$TMP_DIR" "2")"; then
  EXIT_MISSING=0
else
  EXIT_MISSING=$?
fi

assert "Missing skill file exits 0" "$([ "$EXIT_MISSING" -eq 0 ] && echo true || echo false)"
assert "Missing skill file output valid JSON" "$(echo "$OUT_MISSING" | jq -e '.' >/dev/null 2>&1 && echo true || echo false)"
assert "Signal name is chain_integrity" "$([ "$(echo "$OUT_MISSING" | jq -r '.signal // ""')" = "chain_integrity" ] && echo true || echo false)"
assert "Score is numeric 0-100" "$(echo "$OUT_MISSING" | jq -r '((.score | type) == "number") and (.score >= 0 and .score <= 100)' 2>/dev/null || echo false)"

mkdir -p "$TMP_DIR/.opencode/skills/gx-context-engine/scripts"
cat > "$TMP_DIR/.opencode/skills/gx-context-engine/SKILL.md" <<'MD'
### Chain 1: Healthy Chain
```bash
bash scripts/gx-healthy.sh <workdir>
```

### Chain 2: Degraded Chain
```bash
bash scripts/gx-stub.sh <workdir>
```
MD

cat > "$TMP_DIR/.opencode/skills/gx-context-engine/scripts/gx-healthy.sh" <<'BASH'
#!/usr/bin/env bash
# healthy script with enough lines
line_01=1
line_02=2
line_03=3
line_04=4
line_05=5
line_06=6
line_07=7
line_08=8
line_09=9
line_10=10
line_11=11
line_12=12
line_13=13
line_14=14
line_15=15
line_16=16
line_17=17
line_18=18
line_19=19
line_20=20
BASH

cat > "$TMP_DIR/.opencode/skills/gx-context-engine/scripts/gx-stub.sh" <<'BASH'
#!/usr/bin/env bash
# STUB implementation
exit 0
BASH

OUT_SAMPLE="$($SCRIPT "$TMP_DIR" "2")"
assert "Stub chain is marked CHAIN_DEGRADED (CR-11)" "$(echo "$OUT_SAMPLE" | jq -r '.detail.chains[] | select(.chain == "Chain 2: Degraded Chain") | .status == "CHAIN_DEGRADED"' 2>/dev/null || echo false)"
assert "Sample score matches formula (1 healthy / 2 total => 50)" "$([ "$(echo "$OUT_SAMPLE" | jq -r '.score')" = "50" ] && echo true || echo false)"

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
