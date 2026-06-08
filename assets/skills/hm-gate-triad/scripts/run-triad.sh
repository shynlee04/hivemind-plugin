#!/usr/bin/env bash
# run-triad.sh
# Runs the 3 quality gates in fixed order. Halt on any failure.
# Usage: ./run-triad.sh <phase_or_skill_name> <spec_md>
set -euo pipefail

TARGET="${1:-}"
SPEC="${2:-SPEC.md}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <phase_or_skill_name> [spec_md]" >&2
  exit 64
fi

echo "=== Gate Triad: $TARGET ==="
echo ""

# Gate 1: lifecycle-integration
echo "--- Gate 1: lifecycle-integration ---"
if bash "assets/skills/gate-lifecycle-integration/scripts/check.sh" "$TARGET" 2>/dev/null; then
  echo "Gate 1: PASS"
else
  echo "Gate 1: FAIL (lifecycle check)"
  echo "Remediation: see .opencode/skills/gate-lifecycle-integration/SKILL.md"
  exit 1
fi
echo ""

# Gate 2: spec-compliance
echo "--- Gate 2: spec-compliance ---"
if [[ -f "$SPEC" ]]; then
  if bash "assets/skills/hm-spec-authoring/scripts/validate-spec-falsifiability.sh" "$SPEC" >/dev/null 2>&1; then
    echo "Gate 2: PASS"
  else
    echo "Gate 2: FAIL (spec check)"
    exit 1
  fi
else
  echo "Gate 2: SKIP (no spec file)"
fi
echo ""

# Gate 3: evidence-truth
echo "--- Gate 3: evidence-truth ---"
if bash "assets/skills/gate-evidence-truth/scripts/check.sh" "$TARGET" 2>/dev/null; then
  echo "Gate 3: PASS"
else
  echo "Gate 3: FAIL (evidence check)"
  exit 1
fi
echo ""

echo "=== ALL 3 GATES PASS ==="
echo "Status: passed"
