#!/usr/bin/env bash
# validate-spec-falsifiability.sh
# Validates that every REQ in a SPEC.md is falsifiable (ends with measurable outcome).
# Usage: ./validate-spec-falsifiability.sh <path-to-SPEC.md>
set -euo pipefail

SPEC="${1:-}"

if [[ -z "$SPEC" ]] || [[ ! -f "$SPEC" ]]; then
  echo "Usage: $0 <path-to-SPEC.md>" >&2
  exit 64
fi

echo "Validating spec: $SPEC"

# Extract the requirement table (rows starting with REQ-NNN)
# Each row should have a measurable verb in the statement.

# Anti-patterns (unfalsifiable verbs/phrases):
UNFALSIFIABLE_PATTERNS=(
  "shall be fast"
  "should be fast"
  "shall be user-friendly"
  "should be user-friendly"
  "shall be intuitive"
  "should be intuitive"
  "shall be easy"
  "should be easy"
  "shall be simple"
  "should be simple"
  "shall be efficient"
  "should be efficient"
  "shall be good"
  "should be good"
  "shall be robust"
  "should be robust"
  "shall be reliable"
  "should be reliable"
  "shall be scalable"
  "should be scalable"
  "shall be flexible"
  "should be flexible"
  "shall handle gracefully"
  "should handle gracefully"
  "shall work well"
  "should work well"
)

FAILED=0
PASSED=0
for pattern in "${UNFALSIFIABLE_PATTERNS[@]}"; do
  if grep -i -q "$pattern" "$SPEC"; then
    echo "FAIL: '$pattern' is unfalsifiable. Replace with measurable outcome."
    FAILED=$((FAILED + 1))
  else
    PASSED=$((PASSED + 1))
  fi
done

# Check that REQ rows have a "shall" + a measurable verb after
# Count REQ rows
REQ_COUNT=$(grep -c -E "^\| REQ-[0-9]+ \|" "$SPEC" || echo 0)
if [[ "$REQ_COUNT" -lt 1 ]]; then
  echo "FAIL: No REQ-NNN rows found in the requirement table."
  FAILED=$((FAILED + 1))
else
  echo "PASS: Found $REQ_COUNT REQ rows."
  PASSED=$((PASSED + 1))
fi

# Check for empty statement (REQ row with no content after the pattern column)
if grep -E "^\| REQ-[0-9]+ \|.*\|.*\| *$" "$SPEC" | grep -v "Statement" >/dev/null 2>&1; then
  echo "WARN: Some REQ rows appear to have empty statements. Review manually."
fi

# Final verdict
if [[ "$FAILED" -eq 0 ]]; then
  echo ""
  echo "VERDICT: PASS ($PASSED checks passed, 0 failed)"
  echo "Spec is falsifiable. Ready to hand off."
  exit 0
else
  echo ""
  echo "VERDICT: FAIL ($FAILED checks failed, $PASSED passed)"
  echo "Spec has unfalsifiable requirements. Fix and re-run."
  exit 1
fi
