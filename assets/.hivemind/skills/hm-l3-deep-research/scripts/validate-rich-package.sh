#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"

for path in \
  "$DIR/SKILL.md" \
  "$DIR/templates/source-evaluation.md" \
  "$DIR/templates/contradiction-matrix.md" \
  "$DIR/workflows/sequential-research-gates.md" \
  "$DIR/evals/evals.json"; do
  [ -e "$path" ] || { echo "FAIL: missing $path"; exit 1; }
done

grep -q "High-Stakes Sequential Gate" "$DIR/SKILL.md" || { echo "FAIL: sequential gate missing"; exit 1; }
grep -q "Contradiction Matrix" "$DIR/SKILL.md" || { echo "FAIL: contradiction matrix not wired"; exit 1; }
grep -q "BLOCKED" "$DIR/templates/source-evaluation.md" || { echo "FAIL: blocked-source rule missing"; exit 1; }

echo "PASS: hm-deep-research rich package validation"
