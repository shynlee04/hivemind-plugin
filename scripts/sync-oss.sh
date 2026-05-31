#!/usr/bin/env bash
# scripts/sync-oss.sh — Sync whitelisted source to oss-dev branch
# Usage: bash scripts/sync-oss.sh
# Requires: git push access to public remote (GitHub PAT or SSH key)

set -euo pipefail

WHITELIST=(
  src/ assets/ bin/ scripts/ tests/
  docs/philosophy/ docs/guides/ docs/architecture/
  vitest.config.ts tsconfig.json package.json
  README.md CONTRIBUTING.md CHANGELOG.md LICENSE .gitignore
  .github/workflows/
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " OSS Sync — oss-dev branch"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SOURCE_SHA=$(git rev-parse HEAD)
SOURCE_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create fresh oss-dev branch from current HEAD
git checkout -f -b oss-sync HEAD

# Remove everything not in whitelist
for f in $(git ls-files | grep -vE "^($(IFS='|'; echo "${WHITELIST[*]}"))"); do
  git rm --cached "$f" 2>/dev/null || true
  rm -f "$f" 2>/dev/null || true
done

# Remove empty dirs
find . -type d -empty -not -path './.git/*' -delete 2>/dev/null || true

git add -A

if git diff --cached --quiet; then
  echo "ℹ️  No changes to sync."
else
  git commit -m "sync: merge source changes @${SOURCE_SHA:0:8}"
  echo "🚀 Pushing to oss-dev..."
  git push public oss-sync:oss-dev --force 2>&1
  echo "✅ oss-dev updated: https://github.com/shynlee04/hivemind-plugin/tree/oss-dev"
fi

git checkout -f "$SOURCE_BRANCH" 2>/dev/null || git checkout -f -
git branch -D oss-sync 2>/dev/null || true
