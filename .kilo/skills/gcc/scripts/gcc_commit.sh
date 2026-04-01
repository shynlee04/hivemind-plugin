#!/bin/bash
# GCC v2 Commit — executes real git commit + appends lean entry to index.yaml
#
# Usage:
#   gcc_commit.sh "intent description" ["optional note about decisions"]
#   gcc_commit.sh "release prep" "descartamos semantic-release por overhead"
#   gcc_commit.sh --staged "intent"   # only commit already-staged files
#
# In standalone mode: appends markdown entry to log.md (v1 compat)

set -e

GCC_DIR=".GCC"
INDEX="$GCC_DIR/index.yaml"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Parse args
STAGED_ONLY=false
if [ "$1" = "--staged" ]; then
  STAGED_ONLY=true
  shift
fi

# Sanitize string for YAML double-quoted values
yaml_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

INTENT_RAW="$1"
NOTE_RAW="${2:-}"

if [ -z "$INTENT_RAW" ]; then
  echo "Usage: gcc_commit.sh [--staged] \"intent\" [\"note\"]"
  exit 1
fi

# Detect mode
if [ ! -f "$INDEX" ]; then
  echo "Error: GCC not initialized. Run gcc_init.sh first."
  exit 1
fi

MODE=$(grep '^mode:' "$INDEX" | awk '{print $2}')

if [ "$MODE" = "git" ]; then
  # Git mode: real commit + lean entry
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Error: index.yaml says mode:git but no git repo found"
    exit 1
  fi

  # Stage files if not --staged
  if [ "$STAGED_ONLY" = false ]; then
    # Check if there are changes to stage
    if [ -z "$(git status --porcelain)" ]; then
      echo "Nothing to commit (working tree clean)"
      exit 0
    fi
    # Stage all tracked changes (not untracked)
    git add -u
  fi

  # Check if there's anything staged
  if [ -z "$(git diff --cached --name-only)" ]; then
    echo "Nothing staged to commit"
    exit 0
  fi

  # Sanitize for YAML
  INTENT=$(yaml_escape "$INTENT_RAW")
  NOTE=$(yaml_escape "$NOTE_RAW")

  # Commit (use raw intent for git message)
  git commit -m "$INTENT_RAW"
  HASH=$(git rev-parse --short HEAD)
  BRANCH=$(git rev-parse --abbrev-ref HEAD)

  # Count existing timeline entries to generate ID
  COUNT=$(grep -c '^\s*- id:' "$INDEX" 2>/dev/null) || COUNT=0
  NEXT_ID="C$(printf '%03d' "$COUNT")"

  # Write entry to temp file
  ENTRY_FILE=$(mktemp)
  echo "  - id: $NEXT_ID" >> "$ENTRY_FILE"
  echo "    hash: $HASH" >> "$ENTRY_FILE"
  echo "    intent: \"$INTENT\"" >> "$ENTRY_FILE"
  [ -n "$NOTE" ] && echo "    note: \"$NOTE\"" >> "$ENTRY_FILE"
  echo "    branch: $BRANCH" >> "$ENTRY_FILE"
  echo "    date: \"$NOW\"" >> "$ENTRY_FILE"

  # Insert into timeline (before worktrees: line)
  if grep -q '^worktrees:' "$INDEX"; then
    LINE_NUM=$(grep -n '^worktrees:' "$INDEX" | head -1 | cut -d: -f1)
    { head -n $((LINE_NUM - 1)) "$INDEX"
      echo ""
      cat "$ENTRY_FILE"
      tail -n +$LINE_NUM "$INDEX"
    } > "$INDEX.tmp" && mv "$INDEX.tmp" "$INDEX"
  else
    echo "" >> "$INDEX"
    cat "$ENTRY_FILE" >> "$INDEX"
  fi
  rm -f "$ENTRY_FILE"

  echo "[$NEXT_ID] $HASH — $INTENT_RAW"
  [ -n "$NOTE_RAW" ] && echo "  Note: $NOTE_RAW"

  # Auto-bridge if aiyoucli available
  BRIDGE_SCRIPT="$(dirname "$0")/gcc_bridge.sh"
  if [ -x "$BRIDGE_SCRIPT" ]; then
    "$BRIDGE_SCRIPT" "$HASH" "$INTENT_RAW" "$NOTE_RAW" 2>/dev/null || true
  fi

else
  # Standalone mode: append to log.md
  LOG="$GCC_DIR/log.md"
  COUNT=$(grep -c '^\*\*\[OTA-' "$LOG" 2>/dev/null) || COUNT=0
  NEXT_NUM=$((COUNT + 1))
  NEXT_ID=$(printf 'OTA-%03d' "$NEXT_NUM")

  cat >> "$LOG" << EOF
**[$NEXT_ID]** $NOW | Branch: main
- **Observation**: Commit requested
- **Thought**: $INTENT_RAW
- **Action**: $( [ -n "$NOTE_RAW" ] && echo "$NOTE_RAW" || echo "Progress saved" )

---
EOF

  echo "[$NEXT_ID] standalone — $INTENT_RAW"
fi
