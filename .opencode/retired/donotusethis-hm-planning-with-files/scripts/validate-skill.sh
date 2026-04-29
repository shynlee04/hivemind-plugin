#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

test -f "$ROOT/SKILL.md"
test -f "$ROOT/references/file-templates.md"
test -f "$ROOT/references/phase-schemas.md"
test -f "$ROOT/references/session-context-protocol.md"
test -f "$ROOT/references/rich-resource-rationale.md"
test -f "$ROOT/evals/evals.json"
python3 -m json.tool "$ROOT/evals/evals.json" >/dev/null
grep -q "Three-file" "$ROOT/references/rich-resource-rationale.md"

echo "[hm-planning-with-files] validation passed"
