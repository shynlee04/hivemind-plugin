#!/usr/bin/env bash
# L8 Guard: hook files must not perform direct state writes.
# Hooks observe and delegate — they never write to .hivemind/state/ directly.
# State mutations go through store modules (trajectory-store, workflow-authority, etc.).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

# Hooks directory must not contain direct file-writing imports or state path references
HOOK_DIRS=(src/hooks src/hooks/runtime-bridge)

for hook_dir in "${HOOK_DIRS[@]}"; do
  if [[ ! -d "$hook_dir" ]]; then
    continue
  fi

  # Check for direct fs write operations in hook files
  write_ops="$(rg -n --glob '*.ts' '(writeFileSync|writeFile|appendFile|mkdirSync|mkdir)\(' "$hook_dir" 2>/dev/null || true)"
  if [[ -n "$write_ops" ]]; then
    echo "❌ Hook files must not perform direct filesystem writes:"
    echo "$write_ops"
    status=1
  fi

  # Check for direct .hivemind/state path references
  state_refs="$(rg -n --glob '*.ts' '\.hivemind/state/' "$hook_dir" 2>/dev/null || true)"
  if [[ -n "$state_refs" ]]; then
    echo "❌ Hook files must not reference .hivemind/state/ paths directly:"
    echo "$state_refs"
    status=1
  fi
done

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ Hook files are read-only (no direct state writes)."
