#!/bin/bash
# GCC v2 Context — reconstructs context from index.yaml hashes
#
# Usage:
#   gcc_context.sh                  # last 5 entries
#   gcc_context.sh --last N         # last N entries
#   gcc_context.sh --hash abc123    # specific commit details
#   gcc_context.sh --full           # full timeline + git details
#   gcc_context.sh --decisions      # only decisions/notes
#   gcc_context.sh --summary        # one-line per entry (cheap)

set -e

GCC_DIR=".GCC"
INDEX="$GCC_DIR/index.yaml"

if [ ! -f "$INDEX" ]; then
  echo "Error: GCC not initialized. Run gcc_init.sh first."
  exit 1
fi

MODE=$(grep '^mode:' "$INDEX" | awk '{print $2}')

# Parse args
CMD="${1:---last}"
ARG="${2:-5}"

case "$CMD" in
  --summary)
    echo "# GCC Timeline (summary)"
    echo "Mode: $MODE"
    echo "---"
    # Extract lean entries: id, hash, intent, date
    awk '
      /^  - id:/ { id=$3 }
      /hash:/ { hash=$2 }
      /intent:/ { gsub(/^[^"]*"|"$/, "", $0); intent=$0 }
      /date:/ { date=$2; gsub(/"/, "", date); printf "%s  %s  %s  %s\n", date, id, hash, intent }
    ' "$INDEX"
    ;;

  --last)
    N="$ARG"
    echo "# GCC Context (last $N)"
    echo "Mode: $MODE"
    echo "---"

    # Parse all entries into blocks separated by null bytes, take last N
    awk '
      /^  - id:/ {
        if (id) { printf "%s|%s|%s|%s|%s|%s\n", id, hash, intent, note, branch, date }
        id=$3; hash=""; intent=""; note=""; branch=""; date=""
      }
      /^    hash:/ { hash=$2 }
      /^    intent:/ { gsub(/^[^"]*"|"[[:space:]]*$/, "", $0); intent=$0 }
      /^    note:/ { gsub(/^[^"]*"|"[[:space:]]*$/, "", $0); note=$0 }
      /^    branch:/ { branch=$2 }
      /^    date:/ { date=$2; gsub(/"/, "", date) }
      END { if (id) printf "%s|%s|%s|%s|%s|%s\n", id, hash, intent, note, branch, date }
    ' "$INDEX" | tail -n "$N" | while IFS='|' read -r id hash intent note branch date; do
      [ -z "$id" ] && continue
      echo ""
      echo "## [$id]"
      if [ "$MODE" = "git" ] && [ "$hash" != "null" ] && [ -n "$hash" ]; then
        echo "Hash: $hash"
        git show --stat --format="Author: %an%nDate: %ad%nMessage: %s%n" "$hash" 2>/dev/null || echo "(commit not found in history)"
      fi
      [ -n "$intent" ] && echo "Intent: $intent"
      [ -n "$note" ] && echo "Note: $note"
      [ -n "$branch" ] && echo "Branch: $branch"
      [ -n "$date" ] && echo "Date: $date"
    done
    ;;

  --hash)
    HASH="$ARG"
    if [ -z "$HASH" ]; then
      echo "Usage: gcc_context.sh --hash <hash>"
      exit 1
    fi

    echo "# GCC Context for $HASH"
    echo "---"

    # Find entry in index
    awk -v h="$HASH" '
      /^  - id:/ { id=$3; found=0 }
      /hash:/ && $2 == h { found=1 }
      /intent:/ && found { gsub(/^[^"]*"|"$/, "", $0); print "Intent: " $0 }
      /note:/ && found { gsub(/^[^"]*"|"$/, "", $0); print "Note: " $0 }
    ' "$INDEX"

    # Git details
    if [ "$MODE" = "git" ]; then
      echo ""
      echo "## Git Details"
      git show --stat --format="Author: %an%nDate: %ad%nMessage: %s%n%b" "$HASH" 2>/dev/null || echo "(commit not found)"
      echo ""
      echo "## Diff"
      if git rev-parse "$HASH~1" >/dev/null 2>&1; then
        git diff "$HASH~1".."$HASH" --stat 2>/dev/null || true
      else
        echo "(initial commit — no parent to diff against)"
      fi
    fi
    ;;

  --full)
    echo "# GCC Full Context"
    echo "Mode: $MODE"
    echo "Created: $(grep '^created:' "$INDEX" | awk '{print $2}' | tr -d '"')"
    echo "Branch: $(grep '^current_branch:' "$INDEX" | awk '{print $2}')"
    echo "---"

    # Dump all timeline with git reconstruction
    "$0" --last 999
    ;;

  --decisions)
    echo "# GCC Decisions"
    echo "---"
    # Extract only entries with notes (these are the decisions)
    awk '
      /^  - id:/ { id=$3; hash=""; intent=""; note="" }
      /hash:/ { hash=$2 }
      /intent:/ { gsub(/^[^"]*"|"$/, "", $0); intent=$0 }
      /note:/ { gsub(/^[^"]*"|"$/, "", $0); note=$0 }
      /date:/ && note != "" {
        date=$2; gsub(/"/, "", date)
        printf "%s [%s] %s — %s\n  → %s\n\n", date, id, hash, intent, note
      }
    ' "$INDEX"
    ;;

  *)
    echo "Usage: gcc_context.sh [--summary|--last N|--hash HASH|--full|--decisions]"
    exit 1
    ;;
esac
