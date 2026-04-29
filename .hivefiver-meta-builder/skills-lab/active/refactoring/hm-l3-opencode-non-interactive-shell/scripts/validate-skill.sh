#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

[[ -f "$SKILL_DIR/SKILL.md" ]] || { echo "FAIL: SKILL.md missing"; exit 1; }
[[ -d "$SKILL_DIR/references" ]] || { echo "FAIL: references missing"; exit 1; }
[[ -f "$SKILL_DIR/evals/evals.json" ]] || { echo "FAIL: evals missing"; exit 1; }

grep -q "^name: hm-opencode-non-interactive-shell" "$SKILL_DIR/SKILL.md" || { echo "FAIL: name mismatch"; exit 1; }
grep -q "Danger Tier Matrix" "$SKILL_DIR/SKILL.md" || { echo "FAIL: danger tier matrix missing"; exit 1; }
grep -q "RICH Gate Source Decisions" "$SKILL_DIR/SKILL.md" || { echo "FAIL: RICH decisions missing"; exit 1; }
grep -q "pressure_scenarios" "$SKILL_DIR/evals/evals.json" || { echo "FAIL: pressure scenarios missing"; exit 1; }

echo "PASS: hm-opencode-non-interactive-shell validation"
