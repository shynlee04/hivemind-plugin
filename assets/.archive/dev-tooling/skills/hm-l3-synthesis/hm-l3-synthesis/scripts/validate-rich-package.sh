#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"

[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -f "$DIR/templates/contradiction-consensus.md" ] || { echo "FAIL: contradiction consensus template missing"; exit 1; }
[ -f "$DIR/evals/evals.json" ] || { echo "FAIL: evals missing"; exit 1; }
grep -q "Evidence-Backed Synthesis Gate" "$DIR/SKILL.md" || { echo "FAIL: synthesis gate not wired"; exit 1; }
grep -q "methodology" "$DIR/templates/contradiction-consensus.md" || { echo "FAIL: methodology limitations missing"; exit 1; }

echo "PASS: hm-synthesis rich package validation"
