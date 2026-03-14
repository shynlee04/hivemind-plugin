#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CANDIDATE_ROOTS=(src .opencode/tool)
SCAN_ROOTS=()

for root in "${CANDIDATE_ROOTS[@]}"; do
  if [[ -e "$root" ]]; then
    SCAN_ROOTS+=("$root")
  fi
done

literal_refs="$(rg -n --glob '*.ts' '[\"'\"']\\.hivemind/state/' "${SCAN_ROOTS[@]}" || true)"
if [[ -n "$literal_refs" ]]; then
  echo "❌ Direct .hivemind/state literal paths are forbidden outside canonical path helpers."
  echo "$literal_refs"
  exit 1
fi

write_ops="$(rg -n --glob '*.ts' '(writeFileSync|writeFile|appendFile|rename|unlink|rm)\([^\n]*\.hivemind/state/' "${SCAN_ROOTS[@]}" || true)"
if [[ -n "$write_ops" ]]; then
  echo "❌ Direct write operations targeting .hivemind/state are forbidden."
  echo "$write_ops"
  exit 1
fi

echo "✅ State write boundary clean (scan roots: ${SCAN_ROOTS[*]})."
