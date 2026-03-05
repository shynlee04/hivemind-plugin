#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Allow-list: read-only plugin references.
ALLOW_LITERAL_RE='\\.opencode/plugins/hiveops-governance/hooks/(events|compaction)\\.ts:'

literal_refs="$(rg -n --glob '*.ts' '[\"'\"']\\.hivemind/state/' src .opencode/plugins/hiveops-governance/hooks || true)"
if [[ -n "$literal_refs" ]]; then
  filtered="$(printf '%s\n' "$literal_refs" | rg -v "$ALLOW_LITERAL_RE" || true)"
  if [[ -n "$filtered" ]]; then
    echo "❌ Direct .hivemind/state literal paths are restricted to approved read-only hooks."
    echo "$filtered"
    exit 1
  fi
fi

write_ops="$(rg -n --glob '*.ts' '(writeFileSync|writeFile|appendFile|rename|unlink|rm)\([^\n]*\.hivemind/state/' src .opencode/plugins/hiveops-governance/hooks || true)"
if [[ -n "$write_ops" ]]; then
  echo "❌ Direct write operations targeting .hivemind/state are forbidden."
  echo "$write_ops"
  exit 1
fi

echo "✅ State write boundary clean (.hivemind/state direct writes not detected)."
