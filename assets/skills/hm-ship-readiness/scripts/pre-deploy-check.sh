#!/usr/bin/env bash
# pre-deploy-check.sh
# Runs all 6 pre-deploy checks. Exits non-zero on first failure.
# Usage: ./pre-deploy-check.sh <spec_md> <coverage_state>
set -euo pipefail

SPEC="${1:-SPEC.md}"
COVERAGE_STATE="${2:-PARTIAL}"

echo "=== PRE-DEPLOY GATE ==="

# Check 1: Spec locked
if [[ ! -f "$SPEC" ]]; then
  echo "FAIL Check 1: spec file not found: $SPEC"
  exit 1
fi
if ! bash "assets/skills/hm-spec-authoring/scripts/validate-spec-falsifiability.sh" "$SPEC" >/dev/null 2>&1; then
  echo "FAIL Check 1: spec not falsifiable"
  exit 1
fi
echo "PASS Check 1: spec locked"

# Check 2: Tests green
if ! npm run typecheck >/dev/null 2>&1; then
  echo "FAIL Check 2: typecheck"
  exit 1
fi
if ! npm test >/dev/null 2>&1; then
  echo "FAIL Check 2: tests"
  exit 1
fi
echo "PASS Check 2: tests green"

# Check 3: Changelog + version (manual check)
echo "WARN Check 3: manually verify CHANGELOG.md and package.json version"

# Check 4: Rollback plan (manual)
echo "WARN Check 4: manually verify rollback plan documented"

# Check 5: Backward compat (manual)
echo "WARN Check 5: manually verify backward compat or feature flag"

# Check 6: Monitoring (manual)
echo "WARN Check 6: manually verify health check, logs, error reporting"

echo ""
echo "=== AUTOMATED CHECKS PASS (3 WARN for manual) ==="
echo "Coverage state: $COVERAGE_STATE"
