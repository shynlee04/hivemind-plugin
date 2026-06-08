#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for file in \
  "$skill_dir/SKILL.md" \
  "$skill_dir/references/06-durable-human-interrupts.md" \
  "$skill_dir/scripts/intent-verify.sh"; do
  if [[ ! -f "$file" ]]; then
    printf '[hm-user-intent-interactive-loop] missing required file: %s\n' "$file" >&2
    exit 1
  fi
done

for token in "Durable Human Interrupt" "required_response_shape" "resume_pointer"; do
  if ! grep -q "$token" "$skill_dir/SKILL.md" "$skill_dir/references/06-durable-human-interrupts.md"; then
    printf '[hm-user-intent-interactive-loop] missing rich-lineage token: %s\n' "$token" >&2
    exit 1
  fi
done

printf '[hm-user-intent-interactive-loop] validation passed\n'
