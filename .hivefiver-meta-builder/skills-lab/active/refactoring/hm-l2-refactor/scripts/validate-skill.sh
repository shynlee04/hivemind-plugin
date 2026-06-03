#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check required files
[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -d "$DIR/references" ] || { echo "FAIL: references/ missing"; exit 1; }

# Check frontmatter
grep -q "^name: hm-refactor" "$DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "^description:" "$DIR/SKILL.md" || { echo "FAIL: description missing"; exit 1; }

# Check Phase 29 RICH-gate hardening markers
grep -q "Gated Refactor Protocol" "$DIR/SKILL.md" || { echo "FAIL: gated refactor protocol missing"; exit 1; }
grep -q "RICH Gate Source Decisions" "$DIR/SKILL.md" || { echo "FAIL: RICH source decisions missing"; exit 1; }
[ -f "$DIR/references/refactor-runbook.md" ] || { echo "FAIL: refactor runbook missing"; exit 1; }
[ -f "$DIR/evals/evals.json" ] || { echo "FAIL: evals missing"; exit 1; }
grep -q "pressure_scenarios" "$DIR/evals/evals.json" || { echo "FAIL: pressure scenarios missing"; exit 1; }

echo "PASS: hm-refactor validation"
