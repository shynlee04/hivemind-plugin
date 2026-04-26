#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check required files
[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -d "$DIR/references" ] || { echo "FAIL: references/ missing"; exit 1; }

# Check frontmatter
grep -q "^name: hm-completion-looping" "$DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "^description:" "$DIR/SKILL.md" || { echo "FAIL: description missing"; exit 1; }

# Check Phase 30 rich-lineage requirements
grep -q "Durable cursor" "$DIR/SKILL.md" || { echo "FAIL: durable cursor guidance missing"; exit 1; }
grep -q "termination_predicates" "$DIR/SKILL.md" || { echo "FAIL: termination predicates missing"; exit 1; }
[ -f "$DIR/references/durable-completion-cursors.md" ] || { echo "FAIL: durable completion cursor reference missing"; exit 1; }
grep -q "Evidence Span" "$DIR/references/durable-completion-cursors.md" || { echo "FAIL: evidence span guidance missing"; exit 1; }

echo "PASS: hm-completion-looping validation"
