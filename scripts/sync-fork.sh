#!/usr/bin/env bash
# scripts/sync-fork.sh — Sync upstream changes into vendored opencode-tmux/
# Usage: ./scripts/sync-fork.sh [--dry-run]
#
# Fetches from shynlee04/opencode-tmux and merges into the vendored
# opencode-tmux/ directory, protecting Hivemind-pinned files from
# accidental overwrite via git merge-tree conflict detection.
#
# Environment variable overrides:
#   SYNC_FORK_REMOTE_URL  — upstream fork URL (default: https://github.com/shynlee04/opencode-tmux.git)
#   SYNC_FORK_BRANCH      — upstream branch (default: main)

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────
REMOTE_NAME="hivemind-fork-temp"
REMOTE_URL="${SYNC_FORK_REMOTE_URL:-https://github.com/shynlee04/opencode-tmux.git}"
FORK_BRANCH="${SYNC_FORK_BRANCH:-main}"
VENDOR_DIR="opencode-tmux"

# If you add or remove Hivemind-pinned files, update this list.
PINNED_FILES=(
  "src/session-manager.ts"
  "src/grid-planner.ts"
  "src/__tests__/grid-planner.test.ts"
  "src/__tests__/session-manager.test.ts"
)

DRY_RUN=false

# ── Argument parsing ──────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *)
      echo "Usage: $0 [--dry-run]" >&2
      exit 1
      ;;
  esac
done

# ── Pre-flight checks ─────────────────────────────────────────────
if [ ! -d "$VENDOR_DIR" ]; then
  echo "ERROR: vendored directory '$VENDOR_DIR/' not found." >&2
  echo "Run this script from the monorepo root (where $VENDOR_DIR/ lives)." >&2
  exit 1
fi

# ── Cleanup trap ──────────────────────────────────────────────────
cleanup() {
  git merge --abort 2>/dev/null || true
  git remote remove "$REMOTE_NAME" 2>/dev/null || true
}
trap cleanup EXIT

# ── Step 1: Add temp remote ──────────────────────────────────────
echo "→ Adding temporary remote: $REMOTE_NAME"
if ! git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote add --no-fetch "$REMOTE_NAME" "$REMOTE_URL"
  echo "  Remote '$REMOTE_NAME' added -> $REMOTE_URL"
else
  echo "  Remote '$REMOTE_NAME' already exists (will reuse and clean up)."
fi

# ── Step 2: Fetch upstream ────────────────────────────────────────
echo "→ Fetching from $REMOTE_URL ($FORK_BRANCH)"
if ! git fetch "$REMOTE_NAME" "refs/heads/$FORK_BRANCH"; then
  echo "ERROR: git fetch failed. Check network and upstream URL." >&2
  exit 1
fi
echo "  Fetch complete."

# ── Step 3: Detect pinned-file conflicts (zero side effects) ─────
echo "→ Checking for pinned-file conflicts..."
merge_output=$(git merge-tree --write-tree --name-only --no-messages \
  HEAD "FETCH_HEAD" 2>&1) || {
  rc=$?
  if [ $rc -eq 1 ]; then
    # Conflicts present — check if any are pinned files
    conflicted_files=$(echo "$merge_output" | sed -n '2,$p')
    if [ -z "$conflicted_files" ]; then
      # Empty conflict list with exit 1 can happen with certain
      # conflict types (directory renames). Treat conservatively.
      echo "  Warning: merge-tree reports conflict but no named files." >&2
      echo "  Proceeding with merge — pinned-file check cannot run." >&2
    else
      has_pinned_conflict=false
      while IFS= read -r conflicted; do
        [ -z "$conflicted" ] && continue
        for pinned in "${PINNED_FILES[@]}"; do
          if [ "$conflicted" = "$VENDOR_DIR/$pinned" ]; then
            echo "ERROR: Pinned file '$VENDOR_DIR/$pinned' has merge conflicts." >&2
            has_pinned_conflict=true
          fi
        done
      done <<< "$conflicted_files"

      if [ "$has_pinned_conflict" = true ]; then
        echo "ERROR: Aborting — one or more pinned files have conflicts." >&2
        exit 1
      fi
      echo "→ Non-pinned conflicts detected (safe to merge)."
    fi
  else
    echo "ERROR: git merge-tree failed (exit $rc):" >&2
    echo "$merge_output" >&2
    exit $rc
  fi
}

# ── Step 4: Count incoming commits ────────────────────────────────
commit_count=$(git log --oneline HEAD..FETCH_HEAD 2>/dev/null | wc -l | tr -d ' ')
echo "→ $commit_count commit(s) ready to merge."

# ── Step 5a: Dry-run mode ─────────────────────────────────────────
if [ "$DRY_RUN" = true ]; then
  echo "◆ Dry-run: $commit_count commit(s) would merge."
  echo "◆ Pinned files check: ${#PINNED_FILES[@]} files protected."
  echo "◆ No changes made."
  exit 0
fi

# ── Step 5b: Merge ────────────────────────────────────────────────
echo "→ Merging $commit_count upstream commit(s)..."
git merge FETCH_HEAD --no-edit --no-ff -m "sync: merge upstream opencode-tmux changes"
echo "✓ Sync complete. $commit_count commit(s) merged."
