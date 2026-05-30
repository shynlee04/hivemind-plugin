#!/bin/bash
# Update the stack-nextjs skill from latest Next.js docs
# Usage: bash scripts/update.sh

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "[stack-nextjs] Updating skill at: $SKILL_DIR"
echo "[stack-nextjs] Date: $(date -I)"

# Query Context7 for latest version
echo ""
echo "[stack-nextjs] Querying Context7 for latest Next.js version..."
echo "[stack-nextjs] Use: context7_resolve-library-id with libraryName='Next.js'"
echo "[stack-nextjs] Then: context7_query-docs with the resolved library ID"

# Repomix download (focused)
echo ""
echo "[stack-nextjs] To download fresh repo data:"
echo "  repomix_pack_remote_repository \\"
echo "    --remote 'vercel/next.js' \\"
echo "    --compress true \\"
echo "    --includePatterns 'packages/next/**,docs/**'"

echo ""
echo "[stack-nextjs] Manual update steps:"
echo "  1. Query Context7 with latest version ID"
echo "  2. Run deepwiki_ask_question for 'vercel/next.js'"
echo "  3. Tavily search for latest breaking changes"
echo "  4. Update references/ files with new findings"
echo "  5. Update metadata.json version and date"
echo ""
echo "[stack-nextjs] Done."
