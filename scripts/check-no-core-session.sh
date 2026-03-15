#!/usr/bin/env bash
# L8 Guard: src/core/session/ must stay deleted.
# Session lifecycle is now handled exclusively by SDK hooks and start-work.
# No developer may recreate this directory or import from it.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

# 1. The directory must not exist
if [[ -d "src/core/session" ]]; then
  echo "❌ src/core/session/ has been re-created — it was removed in L1."
  status=1
fi

# 2. No source file may import from core/session
refs="$(rg -n --glob '*.ts' 'core/session' src/ 2>/dev/null || true)"
if [[ -n "$refs" ]]; then
  echo "❌ Source files reference core/session (removed in L1):"
  echo "$refs"
  status=1
fi

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ No core/session references (L1 removal enforced)."
