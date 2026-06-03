#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required=(
  "$skill_dir/SKILL.md"
  "$skill_dir/references/revision-loop.md"
  "$skill_dir/evals/evals.json"
)

for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf '[hm-phase-loop] missing required file: %s\n' "$file" >&2
    exit 1
  fi
done

for token in "Durable Phase Cursor" "termination_predicates" "resume_pointer"; do
  if ! grep -q "$token" "$skill_dir/SKILL.md" "$skill_dir/references/revision-loop.md"; then
    printf '[hm-phase-loop] missing rich-lineage token: %s\n' "$token" >&2
    exit 1
  fi
done

python3 -m json.tool "$skill_dir/evals/evals.json" >/dev/null
printf '[hm-phase-loop] validation passed\n'
