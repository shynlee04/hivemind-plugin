#!/usr/bin/env bash
# Architecture boundary check: src/lib/ must never import @opencode-ai
# This enforces the SDK = materialization layer principle.
# Core concepts in src/lib/ must be platform-portable.

set -euo pipefail

VIOLATIONS=$(grep -rn '@opencode-ai' src/lib/ 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ Architecture boundary violation: src/lib/ imports @opencode-ai"
  echo ""
  echo "src/lib/ must NEVER import from @opencode-ai/*."
  echo "Only src/hooks/ may touch SDK types."
  echo ""
  echo "Violations found:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "✅ Architecture boundary clean: src/lib/ has zero @opencode-ai imports"
exit 0
