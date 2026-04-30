#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

test -f "$ROOT/SKILL.md"
test -f "$ROOT/references/parsing-rules.md"
test -f "$ROOT/references/rich-resource-rationale.md"
test -f "$ROOT/evals/evals.json"
python3 -m json.tool "$ROOT/evals/evals.json" >/dev/null
grep -q "RICH Exit Score" "$ROOT/references/rich-resource-rationale.md"
grep -q "command string" "$ROOT/SKILL.md"

echo "[hm-command-parser] validation passed"
