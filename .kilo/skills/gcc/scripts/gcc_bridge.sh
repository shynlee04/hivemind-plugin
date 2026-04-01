#!/bin/bash
# GCC v2 Bridge — feeds commit data to aiyoucli vector memory if available
#
# Usage (called automatically by gcc_commit.sh):
#   gcc_bridge.sh <hash> <intent> [note]
#
# Manual usage:
#   gcc_bridge.sh --sync          # sync all unsynced timeline entries
#   gcc_bridge.sh --status        # check bridge status
#
# Requires: aiyoucli or aiyoucli-mcp in PATH
# If not available, exits silently (no error)

set -e

GCC_DIR=".GCC"
INDEX="$GCC_DIR/index.yaml"
BRIDGE_LOG="$GCC_DIR/.bridge-log"

# Check if aiyoucli is available
has_aiyoucli() {
  command -v aiyoucli >/dev/null 2>&1 || command -v aiyoucli-mcp >/dev/null 2>&1
}

# Escape string for JSON value
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr -d '\n'
}

# Store a memory entry via aiyoucli CLI
store_memory() {
  local hash="$1"
  local intent_raw="$2"
  local note_raw="${3:-}"
  local branch="${4:-main}"
  local date="${5:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"

  # Escape for JSON
  local intent
  intent=$(json_escape "$intent_raw")
  local note
  note=$(json_escape "$note_raw")

  # Build metadata JSON
  local metadata
  metadata="{\"type\":\"gcc-commit\",\"hash\":\"$hash\",\"intent\":\"$intent\",\"branch\":\"$branch\",\"date\":\"$date\""
  [ -n "$note" ] && metadata="$metadata,\"note\":\"$note\""
  metadata="$metadata}"

  # Build value
  local value="$intent_raw"
  [ -n "$note_raw" ] && value="$value | $note_raw"

  # Try aiyoucli memory store
  if command -v aiyoucli >/dev/null 2>&1; then
    aiyoucli memory store \
      --key "gcc:$hash" \
      --value "$value" \
      --namespace "gcc" \
      --tags "commit,$branch" \
      --metadata "$metadata" 2>/dev/null && {
        echo "$hash" >> "$BRIDGE_LOG"
        return 0
      }
  fi

  return 1
}

# Check if a hash was already synced
is_synced() {
  local hash="$1"
  [ -f "$BRIDGE_LOG" ] && grep -q "^$hash$" "$BRIDGE_LOG" 2>/dev/null
}

case "${1:---help}" in
  --status)
    echo "# GCC Bridge Status"
    if has_aiyoucli; then
      echo "aiyoucli: available"
    else
      echo "aiyoucli: not found (bridge inactive)"
    fi

    TOTAL=$(grep -c '^\s*- id:' "$INDEX" 2>/dev/null || echo "0")
    SYNCED=$(wc -l < "$BRIDGE_LOG" 2>/dev/null || echo "0")
    echo "Timeline entries: $TOTAL"
    echo "Synced to memory: $SYNCED"
    echo "Pending: $((TOTAL - SYNCED))"
    ;;

  --sync)
    if ! has_aiyoucli; then
      echo "aiyoucli not found — nothing to sync"
      exit 0
    fi

    echo "Syncing unsynced entries..."
    SYNCED=0

    # Parse index.yaml and sync entries with hashes
    awk '
      /^  - id:/ { id=$3 }
      /hash:/ { hash=$2 }
      /intent:/ { gsub(/^[^"]*"|"$/, "", $0); intent=$0 }
      /note:/ { gsub(/^[^"]*"|"$/, "", $0); note=$0 }
      /branch:/ && !/current_branch/ { branch=$2 }
      /date:/ && !/created:/ {
        date=$2; gsub(/"/, "", date)
        if (hash != "null" && hash != "") {
          printf "%s|%s|%s|%s|%s\n", hash, intent, note, branch, date
        }
        note=""
      }
    ' "$INDEX" | while IFS='|' read -r hash intent note branch date; do
      if ! is_synced "$hash"; then
        if store_memory "$hash" "$intent" "$note" "$branch" "$date"; then
          SYNCED=$((SYNCED + 1))
          echo "  Synced: $hash — $intent"
        fi
      fi
    done

    echo "Done."
    ;;

  --help)
    echo "Usage: gcc_bridge.sh <hash> <intent> [note]"
    echo "       gcc_bridge.sh --sync"
    echo "       gcc_bridge.sh --status"
    exit 0
    ;;

  *)
    # Direct call: store single entry
    HASH="$1"
    INTENT="$2"
    NOTE="${3:-}"

    if [ -z "$HASH" ] || [ -z "$INTENT" ]; then
      exit 0
    fi

    if ! has_aiyoucli; then
      exit 0  # Silent skip
    fi

    if is_synced "$HASH"; then
      exit 0
    fi

    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    store_memory "$HASH" "$INTENT" "$NOTE" "$BRANCH" && \
      echo "Bridged to aiyoucli: $HASH" || true
    ;;
esac
