#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check required files
[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -d "$DIR/references" ] || { echo "FAIL: references/ missing"; exit 1; }

# Check frontmatter
grep -q "^name: hm-subagent-delegation-patterns" "$DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "^description:" "$DIR/SKILL.md" || { echo "FAIL: description missing"; exit 1; }

# Check Phase 30 handoff guardrail requirements
grep -q "Handoff Metadata Required" "$DIR/SKILL.md" || { echo "FAIL: handoff metadata section missing"; exit 1; }
grep -q "Handoff Edge Guardrails" "$DIR/SKILL.md" || { echo "FAIL: edge guardrail table missing"; exit 1; }
[ -f "$DIR/references/handoff-edge-guardrails.md" ] || { echo "FAIL: handoff edge reference missing"; exit 1; }

echo "PASS: hm-subagent-delegation-patterns validation"
