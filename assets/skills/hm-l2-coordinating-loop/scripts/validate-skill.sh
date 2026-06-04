#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for file in \
  "$skill_dir/SKILL.md" \
  "$skill_dir/references/01-handoff-protocols.md" \
  "$skill_dir/references/05-edge-guardrails.md"; do
  if [[ ! -f "$file" ]]; then
    printf '[hm-coordinating-loop] missing required file: %s\n' "$file" >&2
    exit 1
  fi
done

for token in "Rich Coordination Guardrails" "source_agent" "Per-edge guardrails"; do
  if ! grep -q "$token" "$skill_dir/SKILL.md" "$skill_dir/references/05-edge-guardrails.md"; then
    printf '[hm-coordinating-loop] missing rich-lineage token: %s\n' "$token" >&2
    exit 1
  fi
done

printf '[hm-coordinating-loop] validation passed\n'
