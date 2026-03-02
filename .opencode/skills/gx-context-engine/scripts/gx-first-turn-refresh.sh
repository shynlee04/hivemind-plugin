#!/usr/bin/env bash
# gx-first-turn-refresh.sh — Mandatory first-turn state refresh (CR-17)
# USAGE: gx-first-turn-refresh.sh <workdir>
# OUTPUT: JSON with status, file details, and block decision

set -euo pipefail

# Pre-flight: jq required
if ! command -v jq >/dev/null 2>&1; then
  printf '{"status":"error","block":true,"block_reason":"jq not installed","files_checked":0,"files_read":0,"fresh_files":[],"stale_files":[],"missing_files":[],"corrupt_files":[],"recommendation":"Install jq to use GX-Pack state management"}\n'
  exit 0
fi

WORKDIR="${1:-.}"
STATE_DIR="$WORKDIR/.hivemind/state"
STALE_THRESHOLD_SECONDS=86400
NOW_EPOCH="$(date +%s)"

CRITICAL_FILES=(
  "hierarchy.json"
  "runtime-profile.json"
)

IMPORTANT_FILES=(
  "health-metrics.json"
  "todo.json"
)

OPTIONAL_FILES=(
  "decisions.jsonl"
  "enforcement.json"
)

ALL_FILES=(
  "hierarchy.json"
  "runtime-profile.json"
  "health-metrics.json"
  "todo.json"
  "decisions.jsonl"
  "enforcement.json"
)

fresh_files_json='[]'
stale_files_json='[]'
missing_files_json='[]'
corrupt_files_json='[]'

files_checked=0
files_read=0
fresh_count=0
stale_count=0
missing_count=0
corrupt_count=0

block=false
block_reason=""

file_level() {
  local file_name="$1"

  case "$file_name" in
    hierarchy.json|runtime-profile.json)
      printf 'critical\n'
      ;;
    health-metrics.json|todo.json)
      printf 'important\n'
      ;;
    *)
      printf 'optional\n'
      ;;
  esac
}

append_string_json() {
  local array_json="$1"
  local value="$2"

  jq --arg value "$value" '. + [$value]' <<<"$array_json"
}

append_stale_json() {
  local array_json="$1"
  local name="$2"
  local age_hours="$3"

  jq --arg name "$name" --argjson age_hours "$age_hours" '. + [{name: $name, age_hours: $age_hours}]' <<<"$array_json"
}

get_mtime_epoch() {
  local file_path="$1"
  local mtime

  if mtime="$(stat -f %m "$file_path" 2>/dev/null)"; then
    printf '%s\n' "$mtime"
    return 0
  fi

  if mtime="$(stat -c %Y "$file_path" 2>/dev/null)"; then
    printf '%s\n' "$mtime"
    return 0
  fi

  return 1
}

validate_json_file() {
  local file_path="$1"
  jq -e '.' "$file_path" >/dev/null 2>&1
}

validate_jsonl_file() {
  local file_path="$1"
  local line

  # Empty file is valid (no decisions made yet)
  if [ ! -s "$file_path" ]; then
    return 0
  fi

  # Validate ALL non-empty lines
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines
    [ -z "$line" ] && continue
    if ! printf '%s\n' "$line" | jq -e '.' >/dev/null 2>&1; then
      return 1
    fi
  done < "$file_path"

  return 0
}

for file_name in "${ALL_FILES[@]}"; do
  files_checked=$((files_checked + 1))
  file_path="$STATE_DIR/$file_name"
  level="$(file_level "$file_name")"

  if [ ! -f "$file_path" ]; then
    missing_count=$((missing_count + 1))
    missing_files_json="$(append_string_json "$missing_files_json" "$file_name")"

    if [ "$level" = "critical" ] && [ "$block" = false ]; then
      block=true
      block_reason="Critical file missing: $file_name"
    fi
    continue
  fi

  is_stale=false
  is_corrupt=false

  if mtime_epoch="$(get_mtime_epoch "$file_path")"; then
    age_seconds=$((NOW_EPOCH - mtime_epoch))
    if [ "$age_seconds" -gt "$STALE_THRESHOLD_SECONDS" ]; then
      is_stale=true
      stale_count=$((stale_count + 1))
      age_hours=$((age_seconds / 3600))
      stale_files_json="$(append_stale_json "$stale_files_json" "$file_name" "$age_hours")"

      if [ "$level" = "critical" ] && [ "$block" = false ]; then
        block=true
        block_reason="Critical file stale: $file_name"
      fi
    fi
  fi

  if [ "$file_name" = "decisions.jsonl" ]; then
    if ! validate_jsonl_file "$file_path"; then
      is_corrupt=true
    fi
  else
    if ! validate_json_file "$file_path"; then
      is_corrupt=true
    fi
  fi

  if [ "$is_corrupt" = true ]; then
    corrupt_count=$((corrupt_count + 1))
    corrupt_files_json="$(append_string_json "$corrupt_files_json" "$file_name")"

    if [ "$level" = "critical" ] && [ "$block" = false ]; then
      block=true
      block_reason="Critical file corrupt: $file_name"
    fi
  else
    files_read=$((files_read + 1))
  fi

  if [ "$is_stale" = false ] && [ "$is_corrupt" = false ]; then
    fresh_count=$((fresh_count + 1))
    fresh_files_json="$(append_string_json "$fresh_files_json" "$file_name")"
  fi
done

status="fresh"
if [ "$corrupt_count" -gt 0 ]; then
  status="corrupt"
elif [ "$missing_count" -gt 0 ]; then
  status="missing"
elif [ "$stale_count" -gt 0 ]; then
  status="stale"
fi

recommendation="State files are fresh"
if [ "$missing_count" -gt 0 ]; then
  recommendation="Run gx-entry-guard.sh to create missing state files"
elif [ "$corrupt_count" -gt 0 ]; then
  recommendation="Repair corrupt state files or run gx-entry-guard.sh to rebuild state"
elif [ "$stale_count" -gt 0 ]; then
  recommendation="Refresh stale state files before proceeding"
fi

jq -n \
  --arg status "$status" \
  --argjson block "$block" \
  --arg block_reason "$block_reason" \
  --argjson files_checked "$files_checked" \
  --argjson files_read "$files_read" \
  --argjson fresh_files "$fresh_files_json" \
  --argjson stale_files "$stale_files_json" \
  --argjson missing_files "$missing_files_json" \
  --argjson corrupt_files "$corrupt_files_json" \
  --arg recommendation "$recommendation" \
  '{
    status: $status,
    block: $block,
    block_reason: (if $block then $block_reason else null end),
    files_checked: $files_checked,
    files_read: $files_read,
    fresh_files: $fresh_files,
    stale_files: $stale_files,
    missing_files: $missing_files,
    corrupt_files: $corrupt_files,
    recommendation: $recommendation
  }'
