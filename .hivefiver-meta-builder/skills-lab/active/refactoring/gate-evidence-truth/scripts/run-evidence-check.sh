#!/usr/bin/env bash
set -euo pipefail

# run-evidence-check.sh — Deterministic evidence classification checker
# Scans test files for mock patterns, checks continuity records, classifies evidence levels.
# Usage: bash scripts/run-evidence-check.sh <module-path> [--gate-type <type>]

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODULE_PATH="${1:?Usage: run-evidence-check.sh <module-path> [--gate-type <type>]}"
GATE_TYPE=""
shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --gate-type)
      GATE_TYPE="${2:?--gate-type requires a value}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [[ ! -d "$MODULE_PATH" ]]; then
  echo "[FAIL] Module path does not exist: $MODULE_PATH"
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() { ((PASS_COUNT++)); echo "[PASS] $1"; }
fail() { ((FAIL_COUNT++)); echo "[FAIL] $1"; }
warn() { ((WARN_COUNT++)); echo "[WARN] $1"; }

echo "=== Evidence Truth Check ==="
echo "Module: $MODULE_PATH"
echo "Gate type: ${GATE_TYPE:-unspecified}"
echo ""

# --- L4 Detection: Unit tests with mocks ---
echo "--- L4 Detection: Mocked Unit Tests ---"

MOCK_FILES=$(grep -rl "vi\.mock\|jest\.mock\|sinon\.stub" "$MODULE_PATH" --include="*.test.ts" --include="*.spec.ts" 2>/dev/null || true)

if [[ -n "$MOCK_FILES" ]]; then
  while IFS= read -r file; do
    MOCK_COUNT=$(grep -c "vi\.mock\|jest\.mock\|sinon\.stub" "$file" 2>/dev/null || echo "0")
    warn "Mock patterns found in $file ($MOCK_COUNT mock(s)) — classify as L4"
  done <<< "$MOCK_FILES"
else
  pass "No mock patterns detected in test files"
fi

# --- L4 False Integration Detection ---
echo ""
echo "--- Mock-Only Integration Detection (AP-4) ---"

INTEGRATION_FILES=$(grep -rl "integration\|Integration" "$MODULE_PATH" --include="*.test.ts" --include="*.spec.ts" 2>/dev/null || true)

if [[ -n "$INTEGRATION_FILES" ]]; then
  while IFS= read -r file; do
    HAS_MOCKS=$(grep -c "vi\.mock\|jest\.mock\|sinon\.stub" "$file" 2>/dev/null || echo "0")
    if [[ "$HAS_MOCKS" -gt 0 ]]; then
      fail "AP-4: $file claims integration but contains mocks — reclassify as L4"
    else
      pass "Integration file $file has no SDK mocks — eligible for L3"
    fi
  done <<< "$INTEGRATION_FILES"
fi

# --- L3 Detection: Integration tests without mocks ---
echo ""
echo "--- L3 Detection: True Integration Tests ---"

ALL_TEST_FILES=$(find "$MODULE_PATH" -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null || true)
L3_COUNT=0

if [[ -n "$ALL_TEST_FILES" ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    HAS_MOCKS=$(grep -c "vi\.mock\|jest\.mock\|sinon\.stub" "$file" 2>/dev/null || echo "0")
    HAS_SDK_IMPORTS=$(grep -c "session-api\|continuity\|delegation-manager" "$file" 2>/dev/null || echo "0")
    if [[ "$HAS_MOCKS" -eq 0 && "$HAS_SDK_IMPORTS" -gt 0 ]]; then
      pass "True integration test: $file (imports SDK modules, no mocks)"
      ((L3_COUNT++))
    fi
  done <<< "$ALL_TEST_FILES"
fi

if [[ "$L3_COUNT" -eq 0 ]]; then
  warn "No true integration tests detected (L3 evidence may be missing)"
fi

# --- L2 Detection: Continuity records ---
echo ""
echo "--- L2 Detection: Continuity Records ---"

CONTINUITY_FILE="$MODULE_PATH/.hivemind/state/continuity.json"
if [[ ! -f "$CONTINUITY_FILE" ]]; then
  CONTINUITY_FILE=$(find "$MODULE_PATH" -path "*/.hivemind/state/continuity.json" -print -quit 2>/dev/null || true)
fi

if [[ -n "$CONTINUITY_FILE" && -f "$CONTINUITY_FILE" ]]; then
  HAS_SESSION_ID=$(grep -c '"sessionId"' "$CONTINUITY_FILE" 2>/dev/null || echo "0")
  HAS_DELEGATION_ID=$(grep -c '"delegationId"' "$CONTINUITY_FILE" 2>/dev/null || echo "0")
  if [[ "$HAS_SESSION_ID" -gt 0 || "$HAS_DELEGATION_ID" -gt 0 ]]; then
    pass "Continuity record found with session/delegation metadata — L2 eligible"
  else
    warn "Continuity record found but lacks session/delegation metadata — may be L5"
  fi
else
  warn "No continuity record found — L2 evidence absent"
fi

# --- L1 Detection: Live session logs ---
echo ""
echo "--- L1 Detection: Live Session Evidence ---"

SESSION_LOGS=$(find "$MODULE_PATH" -path "*/.hivemind/sessions/*.log" -o -path "*/.hivemind/sessions/*.jsonl" 2>/dev/null || true)

if [[ -n "$SESSION_LOGS" ]]; then
  LOG_COUNT=$(echo "$SESSION_LOGS" | wc -l | tr -d ' ')
  pass "Live session logs found: $LOG_COUNT file(s) — L1 eligible"
else
  warn "No live session logs found — L1 evidence absent"
fi

# --- Gate Minimum Check ---
echo ""
echo "--- Gate Minimum Enforcement ---"

declare -A GATE_MINIMUMS
GATE_MINIMUMS[pr_review]=3
GATE_MINIMUMS[phase_completion]=2
GATE_MINIMUMS[merge]=2
GATE_MINIMUMS[milestone_completion]=2
GATE_MINIMUMS[deployment_readiness]=1

HIGHEST_LEVEL=5
[[ "$L3_COUNT" -gt 0 ]] && HIGHEST_LEVEL=3
[[ -n "$CONTINUITY_FILE" && -f "$CONTINUITY_FILE" ]] && HIGHEST_LEVEL=2
[[ -n "$SESSION_LOGS" ]] && HIGHEST_LEVEL=1

if [[ -n "$GATE_TYPE" && -v "GATE_MINIMUMS[$GATE_TYPE]" ]]; then
  MINIMUM="${GATE_MINIMUMS[$GATE_TYPE]}"
  if [[ "$HIGHEST_LEVEL" -le "$MINIMUM" ]]; then
    pass "Highest evidence level L${HIGHEST_LEVEL} meets ${GATE_TYPE} gate minimum L${MINIMUM}"
  else
    fail "Highest evidence level L${HIGHEST_LEVEL} does NOT meet ${GATE_TYPE} gate minimum L${MINIMUM}"
  fi
else
  echo "[INFO] Gate type not specified or unknown — minimum enforcement skipped"
  echo "[INFO] Highest evidence level detected: L${HIGHEST_LEVEL}"
fi

# --- Summary ---
echo ""
echo "=== Summary ==="
echo "PASS: $PASS_COUNT"
echo "FAIL: $FAIL_COUNT"
echo "WARN: $WARN_COUNT"
echo "Highest evidence level: L${HIGHEST_LEVEL}"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo ""
  echo "RESULT: EVIDENCE GATE FAILS — remediation required"
  exit 1
else
  echo ""
  echo "RESULT: EVIDENCE GATE PASSES — all checks satisfied"
  exit 0
fi
