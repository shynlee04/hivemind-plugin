#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Check required files
[ -f "$DIR/SKILL.md" ] || { echo "FAIL: SKILL.md missing"; exit 1; }
[ -d "$DIR/references" ] || { echo "FAIL: references/ missing"; exit 1; }

# Check frontmatter
grep -q "^name: hm-research-chain" "$DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "^description:" "$DIR/SKILL.md" || { echo "FAIL: description missing"; exit 1; }

# Check research-chain gates and provenance resources
grep -q "Stage 4: Artifact + Continuation" "$DIR/SKILL.md" || { echo "FAIL: continuation stage missing"; exit 1; }
grep -q "Stop rule" "$DIR/SKILL.md" || { echo "FAIL: stage stop rule missing"; exit 1; }
[ -f "$DIR/templates/chain-continuation.md" ] || { echo "FAIL: chain continuation template missing"; exit 1; }
[ -f "$DIR/evals/evals.json" ] || { echo "FAIL: evals missing"; exit 1; }

echo "PASS: hm-research-chain validation"
