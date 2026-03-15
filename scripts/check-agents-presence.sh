#!/usr/bin/env bash
# L8 Guard: every implementation sector must have an AGENTS.md charter.
# These charters define ownership, boundaries, and mutation rules.
# Missing charters mean ungoverned code — a root cause of drift.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

status=0

# Required sector charters (directories that must have AGENTS.md)
REQUIRED_SECTORS=(
  "src/core/trajectory"
  "src/core/workflow"
  "src/context/prompt-packet"
  "src/delegation"
  "src/governance"
  "src/hooks"
  "src/intelligence/doc"
  "src/plugin"
  "src/recovery"
  "src/shared"
  "src/tools"
)

for sector in "${REQUIRED_SECTORS[@]}"; do
  if [[ -d "$sector" ]] && [[ ! -f "$sector/AGENTS.md" ]]; then
    echo "❌ Missing AGENTS.md charter: $sector/"
    status=1
  fi
done

# Root AGENTS.md must exist
if [[ ! -f "AGENTS.md" ]]; then
  echo "❌ Missing root AGENTS.md"
  status=1
fi

if [[ "$status" -ne 0 ]]; then
  echo ""
  echo "Every implementation sector needs an AGENTS.md charter."
  echo "See src/hooks/AGENTS.md for the expected format."
  exit 1
fi

echo "✅ All sector AGENTS.md charters present."
