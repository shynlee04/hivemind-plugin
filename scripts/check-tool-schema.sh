#!/usr/bin/env bash
# L8 Guard: every tool definition must use Zod schemas via tool.schema.
# Raw TS interface args are forbidden — all tool inputs go through Zod validation.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

# Every tools.ts in src/tools/ must import from zod or @opencode-ai/sdk
for tool_file in src/tools/*/tools.ts; do
  if [[ ! -f "$tool_file" ]]; then
    continue
  fi

  if ! rg -q '(from.*zod|\.schema|z\.)' "$tool_file"; then
    echo "❌ $tool_file does not use Zod schema validation."
    status=1
  fi

  if ! rg -q '\.describe\(' "$tool_file"; then
    echo "⚠️  $tool_file has no .describe() — consider adding parameter descriptions."
  fi
done

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ All tool definitions use Zod schemas."
