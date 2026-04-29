#!/usr/bin/env bash
# update.sh — Refresh stack-vitest skill from latest sources
# Usage: bash scripts/update.sh

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "[stack-vitest] Updating skill at: $SKILL_DIR"

# 1. Context7 — query latest docs
echo "[stack-vitest] Note: Use context7_query-docs with libraryId=/vitest-dev/vitest to refresh API docs"

# 2. DeepWiki — query latest API surface  
echo "[stack-vitest] Note: Use deepwiki_ask_question for vitest-dev/vitest to refresh API surface"

# 3. Check current version
CURRENT_VERSION=$(node -e "
  try {
    const pkg = require(require('path').join('$SKILL_DIR', '../../node_modules/vitest/package.json'));
    console.log(pkg.version);
  } catch { console.log('unknown'); }
" 2>/dev/null || echo "unknown")

echo "[stack-vitest] Installed Vitest version: $CURRENT_VERSION"
echo "[stack-vitest] Skill documents version: $(grep 'version:' "$SKILL_DIR/SKILL.md" | head -1 | awk '{print $2}')"

# 4. Verify skill files exist
FILES=(
  "SKILL.md"
  "TOC.md"
  "metadata.json"
  "references/api/assertions.md"
  "references/api/mocking.md"
  "references/api/lifecycle.md"
  "references/api/configuration.md"
  "references/api/coverage.md"
  "references/patterns/testing.md"
  "references/patterns/mocking.md"
)

echo ""
echo "[stack-vitest] File status:"
for f in "${FILES[@]}"; do
  if [ -f "$SKILL_DIR/$f" ]; then
    SIZE=$(wc -l < "$SKILL_DIR/$f")
    echo "  ✓ $f ($SIZE lines)"
  else
    echo "  ✗ $f (MISSING)"
  fi
done

echo ""
echo "[stack-vitest] To fully update, run Context7 and DeepWiki queries manually"
echo "[stack-vitest] then regenerate the reference files."
