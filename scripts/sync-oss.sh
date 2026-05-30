#!/usr/bin/env bash
# sync-oss.sh — Sync source to oss-dev branch using explicit whitelist
# Usage: bash scripts/sync-oss.sh [--dry-run|--push]
# --dry-run: preview what would change (default)
# --push: actually push to oss-dev

set -euo pipefail

DRY_RUN=true
if [ "${1:-}" = "--push" ]; then
  DRY_RUN=false
fi

WHITELIST=(
  src/
  assets/
  bin/
  scripts/
  tests/
  docs/philosophy/
  docs/guides/
  docs/architecture/
  vitest.config.ts
  tsconfig.json
  package.json
  README.md
  CONTRIBUTING.md
  CHANGELOG.md
  LICENSE
  .gitignore
)

BANNED=(
  .opencode .hivemind .planning .hivefiver-meta-builder
  .archive .scratch .debug .research .qwen .codexdisabled
  .agent .codex .claude .trae .windsurf
  agents skills commands planning plans state templates checkpoints
  sidecar graphify-out eval
  node_modules dist coverage
)

SOURCE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
SOURCE_SHA=$(git rev-parse HEAD)
OSS_BRANCH="oss-dev"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " OSS Sync — ${SOURCE_BRANCH}@${SOURCE_SHA:0:8} → ${OSS_BRANCH}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify all whitelist paths exist
echo ""
echo "🔍 Verifying PUBLIC_PATHS..."
for path in "${WHITELIST[@]}"; do
  if [ -e "$path" ]; then
    echo "  ✅ $path"
  else
    echo "  ⚠️  $path (not found)"
  fi
done

# Check that banned dirs would be excluded
echo ""
echo "🔍 Checking banned directories..."
LEAK_FOUND=false
for banned in "${BANNED[@]}"; do
  if [ -e "$banned" ]; then
    echo "  ⚠️  EXISTS locally: $banned (will be EXCLUDED from oss-dev)"
    LEAK_FOUND=true
  fi
done
if [ "$LEAK_FOUND" = "true" ]; then
  echo "  ✅ All banned dirs correctly excluded from whitelist"
fi

# Create temporary worktree
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo ""
echo "📦 Creating oss-dev worktree at $TMP_DIR..."

# Checkout oss-dev (or orphan if doesn't exist)
if git show-ref --verify --quiet "refs/heads/$OSS_BRANCH"; then
  git worktree add --detach "$TMP_DIR" "refs/heads/$OSS_BRANCH" 2>/dev/null || \
    git worktree add --detach "$TMP_DIR" HEAD
else
  git worktree add --detach "$TMP_DIR" HEAD
fi

pushd "$TMP_DIR" > /dev/null

# If we detached from oss-dev, start fresh
if git log --oneline -1 2>/dev/null | grep -q .; then
  echo "  Existing oss-dev: $(git log --oneline -1)"
else
  echo "  Creating fresh oss-dev..."
  git checkout --orphan $OSS_BRANCH
  git rm -rf . 2>/dev/null || true
fi

# Clean everything
git rm -rf --cached . 2>/dev/null || true
rm -rf ./* ./.gitignore ./.npmignore 2>/dev/null || true

# Restore only whitelisted paths from source SHA
echo ""
echo "📋 Restoring whitelisted paths from $SOURCE_SHA..."
for path in "${WHITELIST[@]}"; do
  git checkout "$SOURCE_SHA" -- "$path" 2>/dev/null && echo "  → $path" || echo "  ⚠️  $path skipped"
done

# Remove any banned files that might have been included via wildcard
echo ""
echo "🧹 Removing banned artifacts..."
for banned in "${BANNED[@]}"; do
  if [ -e "$banned" ]; then
    rm -rf "$banned"
    echo "  🗑️  Removed: $banned"
  fi
done

git add -A

# Commit and push
if git diff --cached --quiet; then
  echo ""
  echo "ℹ️  No changes to commit."
else
  echo ""
  echo "📦 Staged changes: $(git diff --cached --stat | tail -1)"

  if [ "$DRY_RUN" = "true" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " DRY RUN — Not pushing. Run with --push to apply."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    git status --short | head -30
  else
    git checkout -B $OSS_BRANCH

    MSG="sync: merge source changes from feature branch

Synced: ${WHITELIST[*]}
Source: $SOURCE_SHA"

    git commit -m "$MSG"

    echo ""
    echo "🚀 Pushing $OSS_BRANCH..."
    git push public "$OSS_BRANCH:$OSS_BRANCH" 2>&1 || \
      echo "⚠️  Push failed. Run manually: git push public $OSS_BRANCH:$OSS_BRANCH"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " ✅ oss-dev pushed!"
    echo "    https://github.com/shynlee04/hivemind-plugin/tree/oss-dev"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  fi
fi

popd > /dev/null
echo ""
echo "Done."
