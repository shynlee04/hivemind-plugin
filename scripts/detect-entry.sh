#!/usr/bin/env bash
#
# detect-entry.sh - Deterministic state detection for HiveMind entry protocol
#
# Output: JSON object with exact keys:
#   - state_exists: boolean (true/false)
#   - lineage: string (hivefiver|hiveminder|unresolved)
#   - hierarchy_status: string (missing|empty|malformed|present|awaiting_intent|linked)
#   - trajectory_status: string (missing|empty|malformed|present|awaiting_intent|unknown)
#   - entry_condition: string (bootstrap_required|classify_required|ready)
#
# Entry condition logic (deterministic):
#   - bootstrap_required: any required state file is missing/empty/malformed
#   - classify_required: state exists but lineage=unresolved OR trajectory=awaiting_intent/unknown
#   - ready: all state present AND lineage resolved AND trajectory linked
#
# Priority for lineage: session profile > brain.json fallback

set -u

ROOT_DIR="${1:-.}"
STATE_DIR="$ROOT_DIR/.hivemind/state"
SESSIONS_ACTIVE_DIR="$ROOT_DIR/.hivemind/sessions/active"

BRAIN_FILE="$STATE_DIR/brain.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"

sanitize_token() {
  local value="$1"
  value="$(printf '%s' "$value" | tr -cd '[:alnum:]_.:-')"
  if [ -z "$value" ]; then
    printf '%s' "unresolved"
  else
    printf '%s' "$value"
  fi
}

json_file_state() {
  local file="$1"

  if [ ! -e "$file" ]; then
    printf '%s' "missing"
    return
  fi

  if [ ! -s "$file" ]; then
    printf '%s' "empty"
    return
  fi

  local raw
  raw="$(tr '\n' ' ' < "$file" 2>/dev/null || true)"

  if [ -z "$raw" ]; then
    printf '%s' "empty"
    return
  fi

  if [[ "$raw" != *"{"* ]] || [[ "$raw" != *"}"* ]]; then
    printf '%s' "malformed"
    return
  fi

  if ! printf '%s' "$raw" | grep -Eq '"[A-Za-z0-9_.:-]+"[[:space:]]*:'; then
    printf '%s' "malformed"
    return
  fi

  printf '%s' "present"
}

extract_json_string() {
  local file="$1"
  local key="$2"

  if [ ! -s "$file" ]; then
    return
  fi

  local raw
  raw="$(tr '\n' ' ' < "$file" 2>/dev/null || true)"
  if [ -z "$raw" ]; then
    return
  fi

  printf '%s' "$raw" | sed -nE "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"([^\"]*)\".*/\1/p" | head -n 1
}

brain_state="$(json_file_state "$BRAIN_FILE")"
hierarchy_raw_state="$(json_file_state "$HIERARCHY_FILE")"

profile_count=0
profile_path=""
if [ -d "$SESSIONS_ACTIVE_DIR" ]; then
  for candidate in "$SESSIONS_ACTIVE_DIR"/*/profile.json; do
    if [ -f "$candidate" ]; then
      profile_count=$((profile_count + 1))
      if [ -z "$profile_path" ]; then
        profile_path="$candidate"
      fi
    fi
  done
fi

profile_state="missing"
if [ -n "$profile_path" ]; then
  profile_state="$(json_file_state "$profile_path")"
fi

state_exists=false
if [ "$brain_state" = "present" ] && [ "$hierarchy_raw_state" = "present" ] && [ "$profile_state" = "present" ]; then
  state_exists=true
fi

lineage=""
if [ "$profile_state" = "present" ]; then
  lineage="$(extract_json_string "$profile_path" "lineage")"
fi
if [ -z "$lineage" ] && [ "$brain_state" = "present" ]; then
  lineage="$(extract_json_string "$BRAIN_FILE" "lineage")"
fi
lineage="$(sanitize_token "$lineage")"

hierarchy_status="$hierarchy_raw_state"
trajectory_status="$hierarchy_raw_state"

if [ "$hierarchy_raw_state" = "present" ]; then
  hierarchy_raw="$(tr '\n' ' ' < "$HIERARCHY_FILE" 2>/dev/null || true)"

  if [[ "$hierarchy_raw" == *"awaiting_intent"* ]]; then
    hierarchy_status="awaiting_intent"
    trajectory_status="awaiting_intent"
  elif [[ "$hierarchy_raw" == *"\"trajectory\""* ]]; then
    hierarchy_status="linked"
    trajectory_status="present"
  else
    hierarchy_status="present"
    trajectory_status="unknown"
  fi
fi

entry_condition="ready"
if [ "$state_exists" != "true" ] || [ "$brain_state" != "present" ] || [ "$hierarchy_raw_state" != "present" ] || [ "$profile_state" != "present" ]; then
  entry_condition="bootstrap_required"
elif [ "$lineage" = "unresolved" ] || [ "$trajectory_status" = "awaiting_intent" ] || [ "$trajectory_status" = "unknown" ]; then
  entry_condition="classify_required"
fi

cat <<EOF
{"state_exists":$state_exists,"lineage":"$lineage","hierarchy_status":"$hierarchy_status","trajectory_status":"$trajectory_status","entry_condition":"$entry_condition"}
EOF

