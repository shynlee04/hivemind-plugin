#!/bin/bash
# update.sh — Refresh @json-render/react stack skill
# Usage: bash scripts/update.sh

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Refreshing @json-render/react stack skill..."
echo "Skill dir: $SKILL_DIR"

# Repomix re-download
echo ""
echo "To re-download the repo, run:"
echo "  repomix --remote vercel-labs/json-render --include 'packages/react/**,packages/core/**' --style xml"
echo ""
echo "Then update metadata.json with the new outputId."

# Verify Context7 access
echo ""
echo "Context7 library ID: /vercel-labs/json-render"
echo "Docs site: https://json-render.dev"
echo "Repo: https://github.com/vercel-labs/json-render"

echo ""
echo "Done. Review and update reference files manually if API changed."
