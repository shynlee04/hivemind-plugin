#!/usr/bin/env bash
# run-cycle.sh
# Runs the 5-stage TDD cycle for one REQ.
# Usage: ./run-cycle.sh <REQ-NNN> <test_file> <impl_file>
set -euo pipefail

REQ="${1:-}"
TEST_FILE="${2:-}"
IMPL_FILE="${3:-}"

if [[ -z "$REQ" ]] || [[ -z "$TEST_FILE" ]] || [[ -z "$IMPL_FILE" ]]; then
  echo "Usage: $0 <REQ-NNN> <test_file> <impl_file>" >&2
  exit 64
fi

# Stage 1: RED — test must fail before impl
echo "=== STAGE 1: RED ==="
if npm test -- "$TEST_FILE" 2>/dev/null; then
  echo "FAIL: test passes BEFORE impl (test-after detected). Aborting."
  exit 1
fi
echo "PASS: test fails as expected"

# Stage 2: GREEN — impl, test must pass
echo "=== STAGE 2: GREEN ==="
# Caller must have already written the minimum impl
if npm test -- "$TEST_FILE" >/dev/null 2>&1; then
  echo "PASS: test passes after impl"
else
  echo "FAIL: test still fails after impl. Add more impl."
  exit 1
fi

# Stage 3: Coverage
echo "=== STAGE 3: COVERAGE ==="
npm run typecheck >/dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "PASS: typecheck clean"

# Stage 4: Cross-ref
echo "=== STAGE 4: CROSS-REF (skip for now) ==="
echo "SKIP: cross-ref not checked in run-cycle.sh; use Stage 4 manually"

# Stage 5: REFACTOR
echo "=== STAGE 5: REFACTOR (skip if clean) ==="
echo "SKIP: refactor is judgment-based"

echo ""
echo "=== CYCLE COMPLETE: $REQ ==="
echo "Commit message: test($REQ): <one-line description>"
