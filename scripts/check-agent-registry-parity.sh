#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

echo "== Agent Registry Parity Check =="
if [[ ! -d ".opencode/agents" ]]; then
  echo "ℹ️  Skipping runtime mirror parity in repo-time validation: .opencode/agents is a user-local runtime projection."
  exit 0
fi

while IFS= read -r canonical; do
  base="$(basename "$canonical")"
  runtime=".opencode/agents/$base"
  if [[ ! -f "$runtime" ]]; then
    echo "❌ Missing runtime mirror: $runtime"
    status=1
    continue
  fi

  if ! diff -q "$canonical" "$runtime" >/dev/null; then
    echo "❌ Parity mismatch: $canonical != $runtime"
    status=1
  fi
done < <(find agents -maxdepth 1 -type f -name '*.md' -print | sort)

while IFS= read -r runtime; do
  base="$(basename "$runtime")"
  if [[ "$base" == "REGISTRY.md" ]]; then
    continue
  fi

  canonical="agents/$base"
  if [[ ! -f "$canonical" ]]; then
    echo "❌ Runtime-only unmanaged agent file: $runtime"
    status=1
  fi
done < <(find .opencode/agents -maxdepth 1 -type f -name '*.md' -print | sort)

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ Agent registry parity clean (agents/** is canonical; .opencode/agents/** mirrors)."
