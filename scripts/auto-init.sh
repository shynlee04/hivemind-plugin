#!/usr/bin/env bash
#
# auto-init.sh - Idempotent minimal bootstrap for HiveMind state
#
# Creates minimal state files if missing:
#   - .hivemind/state/brain.json
#   - .hivemind/state/hierarchy.json
#   - .hivemind/sessions/active/<session-id>/profile.json
#
# Minimal values:
#   - brain.json: sessionId, lineage="unresolved", mode="exploration"
#   - hierarchy.json: trajectory awaiting intent marker
#   - profile.json: agent="unresolved"
#
# Uses safe write pattern (temp + move) for atomic writes.
# Idempotent: safe to run multiple times.

set -u

ROOT_DIR="${1:-.}"
STATE_DIR="$ROOT_DIR/.hivemind/state"
SESSIONS_ACTIVE_DIR="$ROOT_DIR/.hivemind/sessions/active"

BRAIN_FILE="$STATE_DIR/brain.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"

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

sanitize_session_id() {
  local value="$1"
  value="$(printf '%s' "$value" | tr -cd '[:alnum:]_.-')"
  if [ -z "$value" ]; then
    printf '%s' "ses_bootstrap"
  else
    printf '%s' "$value"
  fi
}

safe_write_json() {
  local target="$1"
  local content="$2"

  local parent
  parent="$(dirname "$target")"
  mkdir -p "$parent"

  local tmp
  tmp="$(mktemp "${target}.tmp.XXXXXX")"
  printf '%s\n' "$content" > "$tmp"
  mv "$tmp" "$target"
}

mkdir -p "$STATE_DIR" "$SESSIONS_ACTIVE_DIR"

session_id=""

if [ "$(json_file_state "$BRAIN_FILE")" = "present" ]; then
  session_id="$(extract_json_string "$BRAIN_FILE" "session_id")"
  if [ -z "$session_id" ]; then
    session_id="$(extract_json_string "$BRAIN_FILE" "sessionId")"
  fi
fi

if [ -z "$session_id" ] && [ -d "$SESSIONS_ACTIVE_DIR" ]; then
  for candidate in "$SESSIONS_ACTIVE_DIR"/*/profile.json; do
    if [ -f "$candidate" ]; then
      session_id="$(basename "$(dirname "$candidate")")"
      break
    fi
  done
fi

session_id="$(sanitize_session_id "$session_id")"

PROFILE_DIR="$SESSIONS_ACTIVE_DIR/$session_id"
PROFILE_FILE="$PROFILE_DIR/profile.json"

brain_state="$(json_file_state "$BRAIN_FILE")"
hierarchy_state="$(json_file_state "$HIERARCHY_FILE")"
profile_state="$(json_file_state "$PROFILE_FILE")"

if [ "$brain_state" != "present" ]; then
  safe_write_json "$BRAIN_FILE" "{\"session_id\":\"$session_id\",\"lineage\":\"unresolved\",\"mode\":\"exploration\"}"
fi

if [ "$hierarchy_state" != "present" ]; then
  safe_write_json "$HIERARCHY_FILE" "{\"trajectory\":{\"status\":\"awaiting_intent\"}}"
fi

if [ "$profile_state" != "present" ]; then
  safe_write_json "$PROFILE_FILE" "{\"session_id\":\"$session_id\",\"agent\":\"unresolved\",\"lineage\":\"unresolved\",\"mode\":\"exploration\"}"
fi

