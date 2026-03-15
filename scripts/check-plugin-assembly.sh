#!/usr/bin/env bash
# L8 Guard: plugin entry must be assembly-only.
# opencode-plugin.ts must not define inline tools — all tools live in src/tools/.
# This prevents the plugin entry from re-accumulating business logic.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_ENTRY="src/plugin/opencode-plugin.ts"
status=0

if [[ ! -f "$PLUGIN_ENTRY" ]]; then
  echo "❌ Plugin entry not found: $PLUGIN_ENTRY"
  exit 1
fi

# No inline tool({}) definitions — tools must be imported from src/tools/
inline_tools="$(rg -n 'tool\(\s*\{' "$PLUGIN_ENTRY" 2>/dev/null || true)"
if [[ -n "$inline_tools" ]]; then
  echo "❌ Plugin entry has inline tool definitions (must import from src/tools/):"
  echo "$inline_tools"
  status=1
fi

# No direct state file operations
state_ops="$(rg -n '(writeFileSync|readFileSync|writeFile).*\.hivemind' "$PLUGIN_ENTRY" 2>/dev/null || true)"
if [[ -n "$state_ops" ]]; then
  echo "❌ Plugin entry must not perform direct state file operations:"
  echo "$state_ops"
  status=1
fi

# Verify it imports tool factories from src/tools/
if ! rg -q "from.*['\"].*tools/" "$PLUGIN_ENTRY"; then
  echo "❌ Plugin entry must import tool factories from src/tools/."
  status=1
fi

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ Plugin entry is assembly-only (no inline tools, imports from src/tools/)."
