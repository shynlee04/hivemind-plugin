#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check required files
[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -d "$DIR/references" ] || { echo "FAIL: references/ missing"; exit 1; }

# Check frontmatter
grep -q "^name: hm-opencode-project-inspection" "$DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "^description:" "$DIR/SKILL.md" || { echo "FAIL: description missing"; exit 1; }

echo "PASS: hm-opencode-project-inspection validation"
