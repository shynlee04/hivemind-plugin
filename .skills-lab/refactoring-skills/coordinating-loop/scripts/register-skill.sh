#!/usr/bin/env bash
# register-skill.sh — Records a skill load in loaded-skills.json
# Usage: bash .opencode/state/register-skill.sh <skill-name>
# Exit 0 on success, Exit 1 on failure

set -euo pipefail

# --- Resolve project root ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

STATE_DIR="$PROJECT_ROOT/.opencode/state"
LOADED_SKILLS="$STATE_DIR/loaded-skills.json"

# --- Argument validation ---
if [ $# -lt 1 ]; then
  echo "[register] FAIL: missing <skill-name> argument"
  echo "Usage: bash register-skill.sh <skill-name>"
  exit 1
fi

SKILL_NAME="$1"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# --- Ensure state directory and file exist ---
mkdir -p "$STATE_DIR"

if [ ! -f "$LOADED_SKILLS" ]; then
  echo '{"loading_order":[],"skills":{},"last_updated":""}' > "$LOADED_SKILLS"
fi

# --- Update loaded-skills.json ---
if command -v jq &>/dev/null; then
  # Use jq for reliable JSON manipulation
  tmp_file=$(mktemp)
  jq --arg skill "$SKILL_NAME" \
     --arg ts "$TIMESTAMP" \
     '
     .loading_order += [$skill] |
     .skills[$skill] = {
       "status": "loaded",
       "loaded_at": $ts,
       "order": (.loading_order | length)
     } |
     .last_updated = $ts
     ' "$LOADED_SKILLS" > "$tmp_file"

  mv "$tmp_file" "$LOADED_SKILLS"
else
  # Pure bash/sed fallback — works for simple cases
  # This approach rebuilds the JSON manually to avoid jq dependency

  # Read existing loading_order entries
  existing_order=""
  if grep -q '"loading_order"' "$LOADED_SKILLS" 2>/dev/null; then
    # Extract existing order array content
    existing_order=$(sed -n '/"loading_order"/,/\]/p' "$LOADED_SKILLS" | \
      grep '"[a-z]' | \
      sed 's/.*"\([^"]*\)".*/\1/' | \
      tr '\n' ',' | \
      sed 's/,$//')
  fi

  # Build new loading_order array
  if [ -n "$existing_order" ]; then
    new_order="\"$existing_order\", \"$SKILL_NAME\""
  else
    new_order="\"$SKILL_NAME\""
  fi

  # Check if skill already has an entry
  if grep -q "\"$SKILL_NAME\"" "$LOADED_SKILLS" 2>/dev/null; then
    # Update existing entry's timestamp
    sed -i '' "s/\"$SKILL_NAME\"[^}]*/\"$SKILL_NAME\": { \"status\": \"loaded\", \"loaded_at\": \"$TIMESTAMP\" }/" "$LOADED_SKILLS" 2>/dev/null || true
  else
    # Add new skill entry — insert before the closing brace of "skills"
    # Find the "skills": {} or "skills": { ... } block and add entry
    if grep -q '"skills": {}' "$LOADED_SKILLS" 2>/dev/null; then
      # Empty skills object — replace with populated one
      sed -i '' "s/\"skills\": {}/\"skills\": { \"$SKILL_NAME\": { \"status\": \"loaded\", \"loaded_at\": \"$TIMESTAMP\", \"order\": 1 } }/" "$LOADED_SKILLS"
    else
      # Non-empty skills object — add entry before closing }
      # Find the last } before "last_updated" and insert before it
      sed -i '' "/\"last_updated\"/i\\
    \"$SKILL_NAME\": { \"status\": \"loaded\", \"loaded_at\": \"$TIMESTAMP\" },
" "$LOADED_SKILLS"
    fi
  fi

  # Update loading_order
  sed -i '' "s/\"loading_order\": \[[^]]*\]/\"loading_order\": [$new_order]/" "$LOADED_SKILLS"

  # Update last_updated
  sed -i '' "s/\"last_updated\": \"[^\"]*\"/\"last_updated\": \"$TIMESTAMP\"/" "$LOADED_SKILLS"
fi

echo "[register] OK: $SKILL_NAME recorded at $TIMESTAMP"
exit 0
