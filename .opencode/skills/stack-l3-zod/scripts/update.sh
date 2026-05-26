#!/usr/bin/env bash
# Refresh Zod stack skill from source repo
# Usage: bash scripts/update.sh

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="/tmp/stack-zod-repomix"

echo "=== Zod Stack Skill Update ==="
echo "Skill dir: $SKILL_DIR"
echo ""

# Step 1: Download fresh repomix output
echo "[1/3] Downloading colinhacks/zod via repomix..."
if command -v npx &>/dev/null; then
  npx repomix --remote colinhacks/zod \
    --style xml \
    --include "src/**,packages/**,README.md,CHANGELOG.md,package.json" \
    --output "$OUTPUT_DIR/repomix-output.xml" \
    2>/dev/null || echo "  Warning: repomix CLI failed. Use MCP tool instead."
  echo "  Output: $OUTPUT_DIR/repomix-output.xml"
else
  echo "  npx not found. Use repomix MCP tool to download:"
  echo '  repomix_pack_remote_repository(remote: "colinhacks/zod", style: "xml")'
fi

# Step 2: Update metadata
echo ""
echo "[2/3] Updating metadata.json..."
DATE=$(date +%Y-%m-%d)
if [ -f "$OUTPUT_DIR/repomix-output.xml" ]; then
  TOKENS=$(wc -c < "$OUTPUT_DIR/repomix-output.xml" | awk '{printf "%d", $1/4}')
  echo "  Approximate tokens: $TOKENS"
fi

# Step 3: Reminder
echo ""
echo "[3/3] Skill files at: $SKILL_DIR"
echo ""
echo "Next steps:"
echo "  1. Review repomix output for API changes"
echo "  2. Update references/api/*.md files if needed"
echo "  3. Update references/migration/v3-to-v4.md for new breaking changes"
echo "  4. Update metadata.json downloadDate to $DATE"
echo ""
echo "=== Done ==="
