#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

test -f "$ROOT/SKILL.md"
test -f "$ROOT/references/opencode-agents.md"
test -f "$ROOT/references/opencode-commands.md"
test -f "$ROOT/references/opencode-custom-tools.md"
test -f "$ROOT/references/opencode-plugins.md"
test -f "$ROOT/references/opencode-sdk.md"
test -f "$ROOT/references/repomix-opencode.md"
test -f "$ROOT/references/rich-resource-rationale.md"
test -f "$ROOT/evals/evals.json"
python3 -m json.tool "$ROOT/evals/evals.json" >/dev/null
grep -q "RICH Exit Score" "$ROOT/references/rich-resource-rationale.md"

echo "[hm-opencode-platform-reference] validation passed"
