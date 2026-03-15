#!/usr/bin/env bash
# L8 Guard: no dangling references to removed modules.
# After L1 dead-code removal and L4 tool extraction, certain import paths
# must never appear in source or test files.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

# Removed modules that must never be imported
FORBIDDEN_IMPORTS=(
  "src/core/session"
  "src/schemas/"
  "src/lib/hooks"
  "src/hooks/session-lifecycle"
  "src/hooks/messages-transform"
  "shared/event-bus"
)

# Only scan src/ — test files may legitimately reference removed paths as test data
SCAN_DIRS="src"

for forbidden in "${FORBIDDEN_IMPORTS[@]}"; do
  refs="$(rg -n --glob '*.ts' "$forbidden" $SCAN_DIRS 2>/dev/null || true)"
  if [[ -n "$refs" ]]; then
    echo "❌ Dangling reference to removed module '$forbidden':"
    echo "$refs"
    status=1
  fi
done

if [[ "$status" -ne 0 ]]; then
  echo ""
  echo "These modules were removed during the 2.9.5 refactor."
  echo "Update imports to use current module paths."
  exit 1
fi

echo "✅ No dangling references to removed modules."
