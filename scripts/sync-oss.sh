#!/usr/bin/env bash
# scripts/sync-oss.sh — Sync whitelisted source to oss-dev branch
#
# Strategy: NUKE AND REPOPULATE
#   1. Create an orphan branch (completely empty)
#   2. Copy ONLY whitelisted files from the source branch
#   3. Commit and force-push to oss-dev
#
# This guarantees ZERO leakage — anything not in the whitelist simply
# does not exist on the target branch. Dot folders, session logs,
# dev scripts, runtime manifestations — all excluded by construction.
#
# Usage: bash scripts/sync-oss.sh
# Env:   DRY_RUN=1          — preview without pushing
#        PUBLIC_REMOTE_URL  — override default public remote URL
# Requires: git push access to public remote (GitHub PAT or SSH key)

set -euo pipefail

# ── WHITELIST — the ONLY things that go to the public branch ─────────────
# These are SOURCE files that ship via npm or are user-facing docs.
# Everything else is excluded by construction (orphan branch).
WHITELIST_DIRS=(
  src/
  assets/
  bin/
  scripts/
  tests/
  docs/
)

WHITELIST_FILES=(
  # Build config
  vitest.config.ts
  vitest.setup.ts
  tsconfig.json
  package.json

  # User-facing root docs only
  README.md
  CONTRIBUTING.md
  CHANGELOG.md
  LICENSE
  INSTALL.md
  .gitignore
  .npmignore
  .npmrc.example
)

# ── DENYLIST — even if somehow inside a whitelisted dir, exclude these ──
DENY_PATTERNS=(
  # Runtime manifestations (spawn during user operation)
  '\.opencode/'
  '\.hivemind/'
  '\.planning/'
  '\.hivefiver-meta-builder/'

  # Build output
  'dist/'
  'coverage/'
  'node_modules/'
  '\.tmp/'

  # Dev-only dot-dirs
  '\.scratch/'
  '\.research/'
  '\.debug/'
  '\.checkpoints/'
  '\.playwright-mcp/'
  '\.agent/'
  '\.backup/'
  '\.archive/'
  '\.bob/'
  '\.codexdisbaled/'
  '\.commandcode/'
  '\.coordination/'
  '\.qoder/'
  '\.qwen/'
  '\.roo/'
  '\.vscode/'

  # Secrets / local config
  '\.env'
  '\.mcp\.json'
  '\.npmrc$'
  '\.claudeignore'
  '\.ignore'

  # Session logs and dev scratch (root level)
  '^session-ses_'
  '^session-phase'
  '^qwen-code-export'
  '^_test_'

  # Dev-only root scripts
  '^add-hm-config'
  '^add-tooling'
  '^add-tools-to-agents'
  '^bulk-cross-ref'
)

# ── Paths that MUST exist in dev-private — proof we're in the right repo ──
PRIVATE_CANARY_FILES=(
  '.hivemind/AGENTS.md'
)

SYNC_BRANCH_PREFIX="oss-sync"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " OSS Sync — Nuke & Repopulate Strategy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Pre-flight checks ────────────────────────────────────────────────────
command -v git >/dev/null 2>&1 || { echo "❌ git not found in PATH"; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { echo "❌ not inside a git repo"; exit 1; }

# Canary check — verify this is the dev-private repo
CANARY_FAIL=0
for canary in "${PRIVATE_CANARY_FILES[@]}"; do
  if [ ! -f "$canary" ]; then
    echo "⚠️  Canary missing: $canary"
    CANARY_FAIL=1
  fi
done
if [ "$CANARY_FAIL" -eq 1 ]; then
  echo "❌ ABORT: One or more dev-private canary files are missing."
  echo "   This script must run inside the dev-private repo with governance artifacts intact."
  echo "   If files were lost, restore them before running sync."
  exit 1
fi

# Branch check — only block detached HEAD (any named branch is fine)
SOURCE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$SOURCE_BRANCH" = "HEAD" ]; then
  echo "❌ ABORT: Detached HEAD state. Switch to a named branch first."
  exit 1
fi

# Refuse to run if already on an oss-sync branch
if [[ "$SOURCE_BRANCH" == ${SYNC_BRANCH_PREFIX}* ]]; then
  echo "❌ ABORT: Already on an oss-sync branch ($SOURCE_BRANCH). Switch to a dev branch first."
  exit 1
fi

# Working tree must be clean
if ! git diff --quiet HEAD 2>/dev/null; then
  echo "❌ Working tree is dirty. Commit or stash before syncing."
  git status --short
  exit 1
fi

# Ensure the public remote exists
if ! git remote get-url public >/dev/null 2>&1; then
  PUBLIC_REMOTE_URL="${PUBLIC_REMOTE_URL:-https://github.com/shynlee04/hivemind-plugin.git}"
  echo "ℹ️  Adding 'public' remote → $PUBLIC_REMOTE_URL"
  git remote add public "$PUBLIC_REMOTE_URL"
fi

SOURCE_SHA=$(git rev-parse HEAD)
SOURCE_SHA_SHORT="${SOURCE_SHA:0:8}"

# ── Use an isolated worktree so we never touch the working directory ──────
SYNC_BRANCH="${SYNC_BRANCH_PREFIX}-$(date +%Y%m%dT%H%M%SZ)"
WORKTREE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/oss-sync-XXXXXX")

cleanup() {
  cd "${GIT_PREFIX:-.}" 2>/dev/null || cd /Users/apple/hivemind-plugin-private
  git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || rm -rf "$WORKTREE_DIR"
  git branch -D "$SYNC_BRANCH" 2>/dev/null || true
}
trap cleanup EXIT

echo "🔒 Using isolated worktree: $WORKTREE_DIR"

# ── Step 1: Create orphan branch (completely empty) ─────────────────────
echo ""
echo "📦 Step 1: Creating orphan branch '$SYNC_BRANCH' (empty slate)..."
git worktree add --detach "$WORKTREE_DIR" "$SOURCE_SHA"
cd "$WORKTREE_DIR"

# Create an orphan branch — no history, no files
git checkout --orphan "$SYNC_BRANCH"
# Remove ALL tracked files from the index (orphan starts with parent's index)
git rm -rf --cached . 2>/dev/null || true
# Remove ALL working tree files/dirs except .git
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

echo "  ✅ Orphan branch created — completely empty slate"

# ── Step 2: Copy ONLY whitelisted content from source ────────────────────
echo ""
echo "📦 Step 2: Copying whitelisted content from $SOURCE_SHA_SHORT..."

# Copy whitelisted directories
for dir in "${WHITELIST_DIRS[@]}"; do
  dir_clean="${dir%/}"
  # Extract from the source commit
  if git ls-tree "$SOURCE_SHA" -- "$dir" >/dev/null 2>&1; then
    git checkout "$SOURCE_SHA" -- "$dir" 2>/dev/null || true
    echo "  ✅ $dir"
  else
    echo "  ⚠️  $dir (not in source — skipping)"
  fi
done

# Copy whitelisted individual files
for file in "${WHITELIST_FILES[@]}"; do
  if git ls-tree "$SOURCE_SHA" -- "$file" >/dev/null 2>&1; then
    git checkout "$SOURCE_SHA" -- "$file" 2>/dev/null || true
    echo "  ✅ $file"
  else
    echo "  ⚠️  $file (not in source — skipping)"
  fi
done

# ── Step 3: Post-copy denylist sweep — nuclear cleanup ─────────────────────
echo ""
echo "📦 Step 3: Post-copy denylist sweep (removing any leaked artifacts)..."

DENY_RE=$(printf '%s|' "${DENY_PATTERNS[@]}")
DENY_RE="${DENY_RE%|}"

REMOVED=0
KEPT=0

# Build list of all files currently in the index
ALL_FILES=$(git ls-files 2>/dev/null || true)

for f in $ALL_FILES; do
  if printf '%s' "$f" | grep -qE "($DENY_RE)"; then
    git rm --cached "$f" 2>/dev/null || true
    rm -f "$f" 2>/dev/null || true
    REMOVED=$((REMOVED + 1))
  else
    KEPT=$((KEPT + 1))
  fi
done

# Also do a blanket removal of ANY dot-file/dot-dir at root level
# (except the explicitly whitelisted .gitignore, .npmignore, .npmrc.example)
ROOT_DOT_EXCEPTIONS=(".gitignore" ".npmignore" ".npmrc.example")
for entry in .*; do
  [ "$entry" = "." ] && continue
  [ "$entry" = ".." ] && continue
  [ "$entry" = ".git" ] && continue

  IS_EXCEPTED=0
  for exc in "${ROOT_DOT_EXCEPTIONS[@]}"; do
    if [ "$entry" = "$exc" ]; then
      IS_EXCEPTED=1
      break
    fi
  done

  if [ "$IS_EXCEPTED" -eq 0 ] && [ -e "$entry" ]; then
    echo "  🗑️  Removing leaked dot-entry: $entry"
    if [ -d "$entry" ]; then
      git rm -rf --cached "$entry" 2>/dev/null || true
      rm -rf "$entry"
    else
      git rm --cached "$entry" 2>/dev/null || true
      rm -f "$entry"
    fi
    REMOVED=$((REMOVED + 1))
  fi
done

# Remove empty directories
find . -type d -empty -not -path './.git/*' -not -path './.git' -delete 2>/dev/null || true

echo "  📊 Kept: $KEPT files | Removed in sweep: $REMOVED"

# ── Step 4: Verify no banned artifacts survived ──────────────────────────
echo ""
echo "📦 Step 4: Verification scan for banned artifacts..."

BANNED_FOUND=0
REMAINING_FILES=$(git ls-files 2>/dev/null || true)

for f in $REMAINING_FILES; do
  # Check against deny patterns
  if printf '%s' "$f" | grep -qE "($DENY_RE)"; then
    echo "  ❌ LEAK: $f"
    BANNED_FOUND=1
  fi
  # Check for any root-level dot file/dir (except whitelisted)
  case "$f" in
    .opencode/*|.hivemind/*|.planning/*|.hivefiver-meta-builder/*)
      echo "  ❌ RUNTIME MANIFEST LEAK: $f"
      BANNED_FOUND=1
      ;;
  esac
done

if [ "$BANNED_FOUND" -eq 1 ]; then
  echo ""
  echo "❌ ABORT: Banned artifacts survived the sweep. Manual investigation needed."
  exit 1
fi
echo "  ✅ No banned artifacts in sync set"

# ── Step 5: Report and push ──────────────────────────────────────────────
echo ""

# Final file count and stats
TOTAL_FILES=$(git ls-files | wc -l | tr -d ' ')
TOP_LEVEL=$(git ls-files | sed 's|/.*||' | sort -u | tr '\n' ' ')

echo "📦 Step 5: Sync summary"
echo "  Source: $SOURCE_BRANCH @ $SOURCE_SHA_SHORT"
echo "  Files to sync: $TOTAL_FILES"
echo "  Top-level entries: $TOP_LEVEL"

git add -A

if git diff --cached --quiet; then
  echo ""
  echo "ℹ️  No changes to sync (empty commit after filtering)."
  exit 0
fi

git commit -m "sync: clean production snapshot from $SOURCE_SHA_SHORT

Whitelisted source from dev-private branch.
Files: $TOTAL_FILES | Strategy: orphan nuke-and-repopulate
Source: $SOURCE_BRANCH @ $SOURCE_SHA"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo ""
  echo "🧪 DRY RUN — would push to oss-dev:"
  echo "   git push public ${SYNC_BRANCH}:oss-dev --force"
  echo ""
  echo "📋 Files that would be on oss-dev:"
  git ls-files | head -50
  if [ "$TOTAL_FILES" -gt 50 ]; then
    echo "   ... and $((TOTAL_FILES - 50)) more"
  fi
else
  echo ""
  echo "🚀 Force-pushing to oss-dev (replaces all previous content)..."
  git push public "${SYNC_BRANCH}:oss-dev" --force 2>&1
  echo "✅ oss-dev updated: https://github.com/shynlee04/hivemind-plugin/tree/oss-dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Sync complete"
echo " 📦 $TOTAL_FILES production files synced"
echo " 🔗 https://github.com/shynlee04/hivemind-plugin/tree/oss-dev"
echo " 💡 Verify: git fetch public && git log public/oss-dev --oneline -1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
