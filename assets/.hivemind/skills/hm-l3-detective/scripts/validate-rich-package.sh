#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"

[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -f "$DIR/templates/assumption-verification.md" ] || { echo "FAIL: assumption template missing"; exit 1; }
[ -f "$DIR/evals/evals.json" ] || { echo "FAIL: evals missing"; exit 1; }
grep -q "Assumption Verification Mode" "$DIR/SKILL.md" || { echo "FAIL: assumption mode not wired"; exit 1; }
grep -q "not found" "$DIR/SKILL.md" || { echo "FAIL: not-found reporting rule missing"; exit 1; }

echo "PASS: hm-detective rich package validation"
