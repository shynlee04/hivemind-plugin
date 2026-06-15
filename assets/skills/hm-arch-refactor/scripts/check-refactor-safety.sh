#!/usr/bin/env bash
# check-refactor-safety.sh
# Verifies a refactor preserves behavior before allowing commit.
# Usage: ./check-refactor-safety.sh <baseline_test_output> <post_refactor_test_output>
set -euo pipefail

BASELINE="${1:-}"
POST="${2:-}"

if [[ -z "$BASELINE" ]] || [[ -z "$POST" ]]; then
  echo "Usage: $0 <baseline_output> <post_output>" >&2
  exit 64
fi

# Both files must exist
if [[ ! -f "$BASELINE" ]] || [[ ! -f "$POST" ]]; then
  echo "FAIL: one or both test output files missing"
  exit 1
fi

# Extract pass/fail counts from both
baseline_pass=$(grep -cE "^\s*(✓|PASS|ok)" "$BASELINE" 2>/dev/null | head -1)
baseline_fail=$(grep -cE "^\s*(✗|FAIL|FAIL)" "$BASELINE" 2>/dev/null | head -1)
post_pass=$(grep -cE "^\s*(✓|PASS|ok)" "$POST" 2>/dev/null | head -1)
post_fail=$(grep -cE "^\s*(✗|FAIL|FAIL)" "$POST" 2>/dev/null | head -1)

echo "Baseline: $baseline_pass pass, $baseline_fail fail"
echo "Post:     $post_pass pass, $post_fail fail"

if [[ "$post_fail" -gt "$baseline_fail" ]]; then
  echo "FAIL: refactor introduced $((post_fail - baseline_fail)) new failures"
  exit 1
fi

if [[ "$post_pass" -lt "$baseline_pass" ]]; then
  echo "FAIL: refactor broke $((baseline_pass - post_pass)) previously-passing tests"
  exit 1
fi

echo "PASS: refactor preserves behavior"
