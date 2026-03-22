#!/bin/bash
# memory-retrieve.sh - Git-based memory retrieval
#
# Retrieves semantic memory from git commits based on query.
# Usage: ./memory-retrieve.sh <query> [limit]

set -e

QUERY="${1:-}"
LIMIT="${2:-10}"

if [ -z "$QUERY" ]; then
  echo "Usage: memory-retrieve.sh <query> [limit]"
  exit 1
fi

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo '{"error": "Not a git repository"}'
  exit 1
fi

# Search commits for semantic memory
RESULTS=$(git log --all --pretty=format:'%H|%s|%ai' --grep="$QUERY" -n "$LIMIT" 2>/dev/null || echo "")

if [ -z "$RESULTS" ]; then
  echo '{"memory": [], "query": "'"$QUERY"'", "count": 0}'
  exit 0
fi

echo "$RESULTS" | while IFS= read -r line; do
  HASH=$(echo "$line" | cut -d'|' -f1)
  SUBJECT=$(echo "$line" | cut -d'|' -f2)
  DATE=$(echo "$line" | cut -d'|' -f3)
  echo "{\"hash\": \"$HASH\", \"subject\": \"$SUBJECT\", \"date\": \"$DATE\"}"
done | jq -s '{memory: ., query: "'"$QUERY"'", count: length}'
