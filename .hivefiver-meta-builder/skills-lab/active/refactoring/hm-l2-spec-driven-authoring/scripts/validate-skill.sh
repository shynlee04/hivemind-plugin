#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILL="$DIR/SKILL.md"
EVALS="$DIR/evals/evals.json"

require_file() {
  [ -f "$1" ] || { echo "FAIL: missing $1"; exit 1; }
}

require_text() {
  local pattern="$1"
  local file="$2"
  grep -q "$pattern" "$file" || { echo "FAIL: missing pattern '$pattern' in $file"; exit 1; }
}

require_file "$SKILL"
require_file "$EVALS"
require_file "$DIR/references/spec-to-req-mapping.md"
require_file "$DIR/references/acceptance-test-patterns.md"

require_text "^name: hm-spec-driven-authoring" "$SKILL"
require_text "Use when" "$SKILL"
require_text "hm-test-driven-execution" "$SKILL"
require_text "hm-planning-with-files" "$SKILL"
require_text "prompt-skim" "$SKILL"
require_text "prompt-analyze" "$SKILL"
require_text "6-NON Defence Table" "$SKILL"
require_text "Integration Wiring" "$SKILL"
require_text "Cross-Platform Adapters" "$SKILL"
require_text "Self-Correction" "$SKILL"
require_text "blocked" "$SKILL"
require_text "stacked_scenario" "$EVALS"
require_text "assertions" "$EVALS"
require_text "negative" "$EVALS"
require_text "boundary" "$EVALS"

echo "PASS: hm-spec-driven-authoring validation"
