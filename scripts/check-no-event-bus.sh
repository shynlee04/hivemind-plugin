#!/usr/bin/env bash
# L8 Guard: event-bus must stay deleted.
# The SDK event system replaces any custom event bus.
# No source file may import, re-export, or reference event-bus.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

# 1. The file itself must not exist
if [[ -f "src/shared/event-bus.ts" ]]; then
  echo "❌ src/shared/event-bus.ts has been re-created — it was removed in L1."
  status=1
fi

# 2. No source file may import event-bus
refs="$(rg -n --glob '*.ts' 'event-bus' src/ 2>/dev/null || true)"
if [[ -n "$refs" ]]; then
  echo "❌ Source files reference event-bus (removed in L1):"
  echo "$refs"
  status=1
fi

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ No event-bus references (L1 removal enforced)."
