#!/bin/bash
# memory-encode.sh - Encode intent as semantic anchors
#
# Creates a semantic commit with proper intent encoding.
# Usage: ./memory-encode.sh <intent> <session-id>

set -e

INTENT="${1:-}"
SESSION_ID="${2:-$(git config user.email 2>/dev/null || echo 'unknown')}"

if [ -z "$INTENT" ]; then
  echo "Usage: memory-encode.sh <intent> <session-id>"
  exit 1
fi

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"error": "Not a git repository"}'
  exit 1
fi

# Create semantic commit
COMMIT_MSG="intent: ${INTENT}

Session: ${SESSION_ID}
Type: semantic-anchor
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Stage a marker file for the intent
MARKER_FILE=".hivemind/memory-$(date +%s).md"
mkdir -p "$(dirname "$MARKER_FILE")"
echo "# Semantic Intent Anchor

$COMMIT_MSG" > "$MARKER_FILE"

git add "$MARKER_FILE"
git commit -m "$COMMIT_MSG" --no-verify 2>/dev/null || true

HASH=$(git rev-parse HEAD 2>/dev/null || echo "")

echo "{
  \"hash\": \"$HASH\",
  \"intent\": \"$INTENT\",
  \"session_id\": \"$SESSION_ID\",
  \"marker_file\": \"$MARKER_FILE\"
}"
