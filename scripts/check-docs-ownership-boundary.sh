#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

hivefiver_file="agents/hivefiver.md"
hivemaker_file="agents/hivemaker.md"
hivehealer_file="agents/hivehealer.md"
reserved_hivefiver_file="agents/hivefiver-reserved.md"

extract_frontmatter() {
  local file="$1"
  awk '
    BEGIN { sep=0 }
    /^---[[:space:]]*$/ { sep+=1; next }
    sep==1 { print }
    sep>=2 { exit }
  ' "$file"
}

hivefiver_frontmatter="$(extract_frontmatter "$hivefiver_file")"
hivefiver_reserved_frontmatter="$(extract_frontmatter "$reserved_hivefiver_file")"
hivemaker_frontmatter="$(extract_frontmatter "$hivemaker_file")"
hivehealer_frontmatter="$(extract_frontmatter "$hivehealer_file")"

if ! printf '%s\n' "$hivefiver_frontmatter" | rg -q 'docs/framework/\*\*'; then
  echo "❌ hivefiver must be scoped to docs/framework/**"
  status=1
fi

if printf '%s\n' "$hivefiver_frontmatter" | rg -q 'docs/\*\*'; then
  echo "❌ hivefiver has broad docs/** ownership (must be docs/framework/** only)"
  status=1
fi

if ! printf '%s\n' "$hivefiver_reserved_frontmatter" | rg -q 'docs/framework/\*\*'; then
  echo "❌ hivefiver-reserved must be scoped to docs/framework/**"
  status=1
fi

if printf '%s\n' "$hivefiver_reserved_frontmatter" | rg -q 'docs/\*\*'; then
  echo "❌ hivefiver-reserved has broad docs/** ownership (must be docs/framework/** only)"
  status=1
fi

if ! printf '%s\n' "$hivemaker_frontmatter" | rg -q 'docs/implementation/\*\*'; then
  echo "❌ hivemaker must be scoped to docs/implementation/**"
  status=1
fi

if ! printf '%s\n' "$hivehealer_frontmatter" | rg -q 'docs/implementation/\*\*'; then
  echo "❌ hivehealer must be scoped to docs/implementation/**"
  status=1
fi

if [[ "$status" -ne 0 ]]; then
  exit 1
fi

echo "✅ Docs ownership boundary clean (framework vs implementation split enforced)."
