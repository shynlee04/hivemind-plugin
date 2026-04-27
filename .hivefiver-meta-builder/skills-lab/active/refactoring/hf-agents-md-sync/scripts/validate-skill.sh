#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

test -f "$ROOT/SKILL.md"
test -f "$ROOT/references/rich-resource-rationale.md"
test -f "$ROOT/evals/evals.json"
python3 -m json.tool "$ROOT/evals/evals.json" >/dev/null
grep -q "AGENTS.md" "$ROOT/SKILL.md"
grep -q "RICH Exit Score" "$ROOT/references/rich-resource-rationale.md"

echo "[hm-agents-md-sync] validation passed"
