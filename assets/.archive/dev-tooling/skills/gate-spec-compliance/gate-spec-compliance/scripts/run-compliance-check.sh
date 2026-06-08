#!/usr/bin/env bash
# run-compliance-check.sh — Deterministic spec compliance checker
# Scans SPEC.md → PLAN.md → code → tests and produces gap analysis
# Usage: ./run-compliance-check.sh <spec_path> <plan_path> <code_root> <test_root>
# Exit codes: 0=PASS, 1=FAIL (gaps found), 2=ERROR (invalid args)

set -euo pipefail

SPEC_PATH="${1:-}"
PLAN_PATH="${2:-}"
CODE_ROOT="${3:-}"
TEST_ROOT="${4:-}"

if [[ -z "$SPEC_PATH" || -z "$PLAN_PATH" || -z "$CODE_ROOT" || -z "$TEST_ROOT" ]]; then
  echo "[compliance] ERROR: Usage: $0 <spec_path> <plan_path> <code_root> <test_root>" >&2
  exit 2
fi

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "[compliance] ERROR: SPEC not found: $SPEC_PATH" >&2
  exit 2
fi

if [[ ! -f "$PLAN_PATH" ]]; then
  echo "[compliance] ERROR: PLAN not found: $PLAN_PATH" >&2
  exit 2
fi

if [[ ! -d "$CODE_ROOT" ]]; then
  echo "[compliance] ERROR: Code root not found: $CODE_ROOT" >&2
  exit 2
fi

if [[ ! -d "$TEST_ROOT" ]]; then
  echo "[compliance] ERROR: Test root not found: $TEST_ROOT" >&2
  exit 2
fi

echo "=== Spec Compliance Check ==="
echo "SPEC:  $SPEC_PATH"
echo "PLAN:  $PLAN_PATH"
echo "CODE:  $CODE_ROOT"
echo "TESTS: $TEST_ROOT"
echo ""

PASS=true
GAPS_SPEC_NO_CODE=0
GAPS_SPEC_NO_TEST=0
GAPS_CODE_NO_SPEC=0
GAPS_TEST_NO_SPEC=0

# Step 1: Extract REQ-IDs from SPEC
echo "[1] Extracting requirements from SPEC..."
REQ_IDS=$(grep -oE 'REQ-[a-z]+-[0-9]+' "$SPEC_PATH" | sort -u || true)
REQ_COUNT=$(echo "$REQ_IDS" | grep -c . || echo "0")
echo "    Found $REQ_COUNT requirements"

if [[ "$REQ_COUNT" -eq 0 ]]; then
  echo "[compliance] BLOCKED: No REQ-IDs found in SPEC" >&2
  exit 1
fi
echo ""

# Step 2: Check each REQ-ID has a PLAN task reference
echo "[2] Checking PLAN task mapping..."
PLAN_MISSING=0
for req in $REQ_IDS; do
  if ! grep -q "$req" "$PLAN_PATH" 2>/dev/null; then
    echo "    GAP [SPEC-WITHOUT-PLAN]: $req not referenced in PLAN"
    PLAN_MISSING=$((PLAN_MISSING + 1))
    PASS=false
  fi
done
if [[ "$PLAN_MISSING" -eq 0 ]]; then
  echo "    All requirements mapped to PLAN tasks"
fi
echo ""

# Step 3: Forward sweep — REQ-ID → code → test
echo "[3] Forward sweep: REQ → CODE → TEST..."
for req in $REQ_IDS; do
  # Check code references
  CODE_FOUND=false
  if grep -rq "$req" "$CODE_ROOT" 2>/dev/null; then
    CODE_FOUND=true
  fi

  if [[ "$CODE_FOUND" == "false" ]]; then
    echo "    GAP [SPEC-WITHOUT-CODE]: $req has no code artifact"
    GAPS_SPEC_NO_CODE=$((GAPS_SPEC_NO_CODE + 1))
    PASS=false
  fi

  # Check test references
  TEST_FOUND=false
  if grep -rq "$req" "$TEST_ROOT" 2>/dev/null; then
    TEST_FOUND=true
  fi

  if [[ "$TEST_FOUND" == "false" ]]; then
    echo "    GAP [SPEC-WITHOUT-TEST]: $req has no test case"
    GAPS_SPEC_NO_TEST=$((GAPS_SPEC_NO_TEST + 1))
    PASS=false
  fi
done
echo ""

# Step 4: Backward sweep — code → REQ-ID
echo "[4] Backward sweep: CODE → SPEC..."
CODE_FILES=$(find "$CODE_ROOT" -name '*.ts' -not -name '*.d.ts' -not -path '*/node_modules/*' 2>/dev/null || true)
for file in $CODE_FILES; do
  HAS_REQ=false
  for req in $REQ_IDS; do
    if grep -q "$req" "$file" 2>/dev/null; then
      HAS_REQ=true
      break
    fi
  done

  if [[ "$HAS_REQ" == "false" ]]; then
    REL_PATH="${file#$(pwd)/}"
    echo "    WARN [CODE-WITHOUT-SPEC]: ${REL_PATH:-$file} has no REQ-ID reference"
    GAPS_CODE_NO_SPEC=$((GAPS_CODE_NO_SPEC + 1))
  fi
done
echo ""

# Step 5: Backward sweep — test → REQ-ID
echo "[5] Backward sweep: TEST → SPEC..."
TEST_FILES=$(find "$TEST_ROOT" -name '*.test.ts' -not -path '*/node_modules/*' 2>/dev/null || true)
for file in $TEST_FILES; do
  HAS_REQ=false
  for req in $REQ_IDS; do
    if grep -q "$req" "$file" 2>/dev/null; then
      HAS_REQ=true
      break
    fi
  done

  if [[ "$HAS_REQ" == "false" ]]; then
    REL_PATH="${file#$(pwd)/}"
    echo "    INFO [TEST-WITHOUT-SPEC]: ${REL_PATH:-$file} has no REQ-ID reference"
    GAPS_TEST_NO_SPEC=$((GAPS_TEST_NO_SPEC + 1))
  fi
done
echo ""

# Step 6: Check for EARS-pattern acceptance criteria
echo "[6] Checking acceptance criteria EARS compliance..."
AC_COUNT=$(grep -cE '(GIVEN:|WHEN:|THEN:|MEASURE:|PASS:|FAIL:)' "$SPEC_PATH" 2>/dev/null || echo "0")
SHALL_COUNT=$(grep -ciE 'the system shall' "$SPEC_PATH" 2>/dev/null || echo "0")
echo "    EARS-pattern AC fields found: $AC_COUNT"
echo "    'The system shall' occurrences: $SHALL_COUNT"

if [[ "$SHALL_COUNT" -gt 0 && "$AC_COUNT" -eq 0 ]]; then
  echo "    WARN: Requirements exist but no EARS-pattern acceptance criteria found"
fi
echo ""

# Summary
echo "=== Gap Summary ==="
echo "SPEC-WITHOUT-CODE: $GAPS_SPEC_NO_CODE (HIGH)"
echo "CODE-WITHOUT-SPEC: $GAPS_CODE_NO_SPEC (MEDIUM)"
echo "SPEC-WITHOUT-TEST: $GAPS_SPEC_NO_TEST (HIGH)"
echo "TEST-WITHOUT-SPEC: $GAPS_TEST_NO_SPEC (LOW)"
echo ""

TOTAL_HIGH=$((GAPS_SPEC_NO_CODE + GAPS_SPEC_NO_TEST))

if [[ "$TOTAL_HIGH" -gt 0 ]]; then
  echo "=== VERDICT: FAIL ==="
  echo "HIGH severity gaps: $TOTAL_HIGH"
  echo "Compliance blocked until gaps resolved."
  exit 1
elif [[ "$PASS" == "true" ]]; then
  echo "=== VERDICT: PASS ==="
  echo "All requirements traced and verified."
  echo "Route to: gate-evidence-truth"
  exit 0
else
  echo "=== VERDICT: FAIL ==="
  echo "One or more checks failed."
  exit 1
fi
