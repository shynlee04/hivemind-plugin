#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check required files
[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -d "$DIR/references" ] || { echo "FAIL: references/ missing"; exit 1; }

# Check frontmatter
grep -q "^name: hm-phase-execution" "$DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "^description:" "$DIR/SKILL.md" || { echo "FAIL: description missing"; exit 1; }

# Check Phase 29 RICH-gate hardening markers
grep -q "File-Backed Execution State Machine" "$DIR/SKILL.md" || { echo "FAIL: file-backed state machine missing"; exit 1; }
grep -q "RICH Gate Source Decisions" "$DIR/SKILL.md" || { echo "FAIL: RICH source decisions missing"; exit 1; }
[ -f "$DIR/references/execution-state-template.md" ] || { echo "FAIL: execution state template missing"; exit 1; }
[ -f "$DIR/evals/evals.json" ] || { echo "FAIL: evals missing"; exit 1; }
grep -q "pressure_scenarios" "$DIR/evals/evals.json" || { echo "FAIL: pressure scenarios missing"; exit 1; }

echo "PASS: hm-phase-execution validation"
