#!/bin/bash
# GCC v2 Cleanup — TTL-based worktree cleanup + index pruning
#
# Usage:
#   gcc_cleanup.sh                  # interactive: list expired, ask before removing
#   gcc_cleanup.sh --dry-run        # show what would be cleaned
#   gcc_cleanup.sh --force          # clean without asking
#   gcc_cleanup.sh --prune-index N  # keep only last N timeline entries in index

set -e

GCC_DIR=".GCC"
INDEX="$GCC_DIR/index.yaml"

if [ ! -f "$INDEX" ]; then
  echo "Error: GCC not initialized."
  exit 1
fi

MODE=$(grep '^mode:' "$INDEX" | awk '{print $2}')
TTL_RAW=$(grep 'worktree_ttl:' "$INDEX" | awk '{print $2}' | tr -d '"')

# Parse TTL to seconds
ttl_to_seconds() {
  local val="$1"
  local num="${val%[hHdDwW]*}"
  local unit="${val##*[0-9]}"
  case "$unit" in
    h|H) echo $((num * 3600)) ;;
    d|D) echo $((num * 86400)) ;;
    w|W) echo $((num * 604800)) ;;
    *)   echo $((num * 3600)) ;;  # default hours
  esac
}

TTL_SECS=$(ttl_to_seconds "${TTL_RAW:-24h}")
NOW_EPOCH=$(date +%s)
DRY_RUN=false
FORCE=false

case "${1:-}" in
  --dry-run) DRY_RUN=true ;;
  --force) FORCE=true ;;
  --prune-index)
    KEEP="${2:-50}"
    echo "Pruning index to last $KEEP entries..."

    # Count timeline entries
    TOTAL=$(grep -c '^\s*- id:' "$INDEX" 2>/dev/null || echo "0")
    if [ "$TOTAL" -le "$KEEP" ]; then
      echo "Only $TOTAL entries, nothing to prune."
      exit 0
    fi

    REMOVE=$((TOTAL - KEEP))
    echo "Removing $REMOVE oldest entries (keeping $KEEP)."

    # Create temp file with pruned timeline
    # Keep everything before timeline:, then skip first $REMOVE entries
    awk -v skip="$REMOVE" '
      /^timeline:/ { in_timeline=1; print; skipped=0; next }
      in_timeline && /^  - id:/ {
        skipped++
        if (skipped <= skip) { skipping=1; next }
        skipping=0
      }
      in_timeline && skipping { next }
      /^[a-z]/ && !/^  / { in_timeline=0 }
      { print }
    ' "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"

    echo "Done. Pruned $REMOVE entries."
    exit 0
    ;;
  "") ;;
  *)
    echo "Usage: gcc_cleanup.sh [--dry-run|--force|--prune-index N]"
    exit 1
    ;;
esac

if [ "$MODE" != "git" ]; then
  echo "Worktree cleanup only available in git mode."
  echo "Use --prune-index to clean standalone index."
  exit 0
fi

# List worktrees from index.yaml
echo "# GCC Worktree Cleanup"
echo "TTL: ${TTL_RAW:-24h} ($TTL_SECS seconds)"
echo "---"

EXPIRED=0
ACTIVE=0

# Parse worktrees section
awk '
  /^worktrees:/ { in_wt=1; next }
  /^[a-z]/ && !/^  / { in_wt=0 }
  in_wt && /name:/ { name=$2 }
  in_wt && /path:/ { path=$2 }
  in_wt && /branch:/ { branch=$2 }
  in_wt && /created:/ { created=$2; gsub(/"/, "", created) }
  in_wt && /status:/ {
    status=$2
    if (status == "active") {
      printf "%s|%s|%s|%s\n", name, path, branch, created
    }
  }
' "$INDEX" | while IFS='|' read -r name path branch created; do
  [ -z "$name" ] && continue

  # Calculate age
  if [ "$(uname)" = "Darwin" ]; then
    CREATED_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created" +%s 2>/dev/null || echo "0")
  else
    CREATED_EPOCH=$(date -d "$created" +%s 2>/dev/null || echo "0")
  fi

  AGE=$((NOW_EPOCH - CREATED_EPOCH))
  AGE_HOURS=$((AGE / 3600))

  if [ "$AGE" -gt "$TTL_SECS" ]; then
    EXPIRED=$((EXPIRED + 1))

    # Check for uncommitted changes in worktree
    HAS_CHANGES=false
    if [ -d "$path" ]; then
      CHANGES=$(cd "$path" && git status --porcelain 2>/dev/null | head -5)
      [ -n "$CHANGES" ] && HAS_CHANGES=true
    fi

    echo ""
    echo "EXPIRED: $name (${AGE_HOURS}h old, TTL: ${TTL_RAW:-24h})"
    echo "  Path: $path"
    echo "  Branch: $branch"

    if [ "$HAS_CHANGES" = true ]; then
      echo "  WARNING: Has uncommitted changes!"
      echo "$CHANGES" | sed 's/^/    /'

      if [ "$DRY_RUN" = true ]; then
        echo "  [dry-run] Would SKIP (has changes)"
        continue
      fi

      if [ "$FORCE" = false ]; then
        echo -n "  Remove anyway? (y/N): "
        read -r confirm
        [ "$confirm" != "y" ] && echo "  Skipped." && continue
      else
        echo "  Force removing despite changes."
      fi
    else
      if [ "$DRY_RUN" = true ]; then
        echo "  [dry-run] Would remove"
        continue
      fi
    fi

    # Remove worktree
    if [ -d "$path" ]; then
      git worktree remove "$path" --force 2>/dev/null || rm -rf "$path"
    fi

    # Update index: mark as expired (awk for cross-platform compat)
    awk -v wt="$name" '
      /name:/ && $2 == wt { found=1 }
      found && /status: active/ { sub(/active/, "expired"); found=0 }
      { print }
    ' "$INDEX" > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"

    echo "  Removed."
  else
    ACTIVE=$((ACTIVE + 1))
    echo "ACTIVE: $name (${AGE_HOURS}h old, TTL in $((($TTL_SECS - $AGE) / 3600))h)"
  fi
done

# Also prune orphan git worktrees
echo ""
echo "---"
echo "Pruning orphan git worktrees..."
git worktree prune 2>/dev/null && echo "Done." || echo "No orphans found."
