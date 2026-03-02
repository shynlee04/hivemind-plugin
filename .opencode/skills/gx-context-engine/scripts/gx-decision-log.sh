#!/usr/bin/env bash
# gx-decision-log.sh — Append-only decision log with supersession tracking
# USAGE:
#   gx-decision-log.sh <workdir> append <json>
#     json must have: content, rationale, module, topic.
#     Optional: hierarchy_node, agent, session_id, supersedes
#   gx-decision-log.sh <workdir> query --last <N>
#   gx-decision-log.sh <workdir> query --module <module>
#   gx-decision-log.sh <workdir> query --node <hierarchy_node>
#   gx-decision-log.sh <workdir> query --active
#   gx-decision-log.sh <workdir> supersede <old_id> <new_id>
#   gx-decision-log.sh <workdir> count

set -euo pipefail

WORKDIR="${1:-}"
COMMAND="${2:-}"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"ok":false,"error":"jq_not_found","message":"jq is required"}\n'
  exit 1
fi

json_error() {
  local code="$1"
  local message="$2"
  jq -cn --arg code "$code" --arg message "$message" '{ok: false, error: $code, message: $message}'
}

slugify() {
  local value="$1"
  printf '%s' "$value" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

if [ -z "$WORKDIR" ] || [ -z "$COMMAND" ]; then
  json_error "usage" "Usage: gx-decision-log.sh <workdir> <append|query|supersede|count> ..."
  exit 1
fi

STATE_DIR="$WORKDIR/.hivemind/state"
LOG_FILE="$STATE_DIR/decisions.jsonl"
LOCK_FILE="$STATE_DIR/decisions.lock"

ensure_state() {
  mkdir -p "$STATE_DIR"
  touch "$LOG_FILE"
  touch "$LOCK_FILE"
}

read_valid_lines() {
  jq -R 'try fromjson catch empty' "$LOG_FILE" 2>/dev/null
}

with_lock() {
  if command -v flock >/dev/null 2>&1; then
    exec 9>>"$LOCK_FILE"
    flock -x 9
    "$@"
    local status=$?
    flock -u 9 || true
    return "$status"
  fi

  # Fallback: mkdir-based locking (POSIX atomic)
  local lock_dir="${LOCK_FILE}.d"
  local max_wait=10
  local waited=0
  while ! mkdir "$lock_dir" 2>/dev/null; do
    waited=$((waited + 1))
    if [ "$waited" -ge "$max_wait" ]; then
      json_error "lock_timeout" "Could not acquire lock after ${max_wait}s"
      return 1
    fi
    sleep 1
  done
  # Safety net: clean up lock on abnormal exit (SIGINT/SIGTERM/ERR)
  # Use ${lock_dir:-} to avoid set -u errors when trap fires after local goes out of scope
  trap 'rmdir "${lock_dir:-}" 2>/dev/null || true' EXIT

  "$@"
  local status=$?
  rmdir "$lock_dir" 2>/dev/null || true
  # Reset EXIT trap so it doesn't reference the now-out-of-scope local
  trap - EXIT
  return "$status"
}

count_module_topic() {
  local module_slug="$1"
  local topic_slug="$2"

  # Use jq -R to read raw lines, attempt parsing each, skip bad lines
  jq -R --arg module "$module_slug" --arg topic "$topic_slug" '
    try fromjson catch empty
    | select((.id? // "") as $id
      | ($id | split("/")) as $parts
      | (($parts | length) == 4 and $parts[1] == $module and $parts[2] == $topic)
    )
  ' "$LOG_FILE" 2>/dev/null | jq -s 'length' 2>/dev/null || echo "0"
}

append_decision() {
  local input_json="$1"
  local parsed_json=""
  local field=""
  local value=""
  local content=""
  local rationale=""
  local module_raw=""
  local topic_raw=""
  local module_slug=""
  local topic_slug=""
  local hierarchy_node=""
  local agent=""
  local session_id=""
  local supersedes=""
  local timestamp=""
  local seq_count=""
  local seq=""
  local id=""
  local new_line=""
  local missing_fields=()

  if ! parsed_json=$(printf '%s' "$input_json" | jq -c '.'); then
    json_error "invalid_json" "append payload must be valid JSON"
    return 1
  fi

  for field in content rationale module topic; do
    value=$(printf '%s' "$parsed_json" | jq -r --arg field "$field" '.[$field] // ""')
    if [ -z "$value" ]; then
      missing_fields+=("$field")
    fi
  done

  if [ "${#missing_fields[@]}" -gt 0 ]; then
    local missing_csv
    missing_csv=$(IFS=,; printf '%s' "${missing_fields[*]}")
    json_error "missing_fields" "Missing required fields: $missing_csv"
    return 1
  fi

  content=$(printf '%s' "$parsed_json" | jq -r '.content')
  rationale=$(printf '%s' "$parsed_json" | jq -r '.rationale')
  module_raw=$(printf '%s' "$parsed_json" | jq -r '.module')
  topic_raw=$(printf '%s' "$parsed_json" | jq -r '.topic')
  hierarchy_node=$(printf '%s' "$parsed_json" | jq -r '.hierarchy_node // empty')
  agent=$(printf '%s' "$parsed_json" | jq -r '.agent // empty')
  session_id=$(printf '%s' "$parsed_json" | jq -r '.session_id // empty')
  supersedes=$(printf '%s' "$parsed_json" | jq -r '.supersedes // empty')

  module_slug=$(slugify "$module_raw")
  topic_slug=$(slugify "$topic_raw")

  if [ -z "$module_slug" ] || [ -z "$topic_slug" ]; then
    json_error "invalid_slug" "module and topic must contain at least one alphanumeric character"
    return 1
  fi

  timestamp=$(date +%s)

  append_with_lock() {
    seq_count=$(count_module_topic "$module_slug" "$topic_slug")
    seq=$(printf '%03d' "$((seq_count + 1))")
    id="dec/$module_slug/$topic_slug/$seq"

    new_line=$(jq -cn \
      --arg id "$id" \
      --argjson timestamp "$timestamp" \
      --arg content "$content" \
      --arg rationale "$rationale" \
      --arg hierarchy_node "$hierarchy_node" \
      --arg agent "$agent" \
      --arg session_id "$session_id" \
      --arg supersedes "$supersedes" \
      '{
        id: $id,
        timestamp: $timestamp,
        content: $content,
        rationale: $rationale,
        supersedes: (if $supersedes == "" then null else $supersedes end),
        superseded_by: null,
        hierarchy_node: (if $hierarchy_node == "" then null else $hierarchy_node end),
        agent: (if $agent == "" then null else $agent end),
        session_id: (if $session_id == "" then null else $session_id end)
      }')

    printf '%s\n' "$new_line" >> "$LOG_FILE"
    printf '%s\n' "$new_line"
  }

  with_lock append_with_lock
}

query_last() {
  local n="$1"

  if ! [[ "$n" =~ ^[0-9]+$ ]]; then
    json_error "invalid_argument" "--last expects a non-negative integer"
    return 1
  fi

  if [ ! -s "$LOG_FILE" ]; then
    printf '[]\n'
    return 0
  fi

  tail -n "$n" "$LOG_FILE" | jq -R 'try fromjson catch empty' | jq -s '.'
}

query_module() {
  local module_raw="$1"
  local module_slug=""

  module_slug=$(slugify "$module_raw")

  if [ ! -s "$LOG_FILE" ]; then
    printf '[]\n'
    return 0
  fi

  read_valid_lines | jq -s --arg module "$module_slug" '
    [ .[]
      | select((.id? // "") as $id
      | ($id | split("/")) as $parts
      | (($parts | length) == 4 and $parts[1] == $module)
      )
    ]
  '
}

query_node() {
  local node="$1"

  if [ ! -s "$LOG_FILE" ]; then
    printf '[]\n'
    return 0
  fi

  read_valid_lines | jq -s --arg node "$node" '[ .[] | select((.hierarchy_node // null) == $node) ]'
}

query_active() {
  if [ ! -s "$LOG_FILE" ]; then
    printf '[]\n'
    return 0
  fi

  read_valid_lines | jq -s '[ .[] | select((.superseded_by // null) == null) ]'
}

supersede_decisions() {
  local old_id="$1"
  local new_id="$2"
  local old_exists=""
  local new_exists=""
  local temp_file=""

  if [ -z "$old_id" ] || [ -z "$new_id" ]; then
    json_error "usage" "supersede requires <old_id> <new_id>"
    return 1
  fi

  if [ "$old_id" = "$new_id" ]; then
    json_error "invalid_argument" "old_id and new_id must be different"
    return 1
  fi

  supersede_with_lock() {
    old_exists=$(read_valid_lines | jq -s --arg old "$old_id" '[ .[] | select(.id == $old) ] | length')
    new_exists=$(read_valid_lines | jq -s --arg new "$new_id" '[ .[] | select(.id == $new) ] | length')

    if [ "$old_exists" -eq 0 ]; then
      json_error "not_found" "old_id not found: $old_id"
      return 1
    fi

    if [ "$new_exists" -eq 0 ]; then
      json_error "not_found" "new_id not found: $new_id"
      return 1
    fi

    temp_file=$(mktemp "$STATE_DIR/decisions.XXXXXX")
    jq -R 'try fromjson catch empty' "$LOG_FILE" | jq -c --arg old "$old_id" --arg new "$new_id" '
      if .id == $old then
        .superseded_by = $new
      elif .id == $new then
        .supersedes = $old
      else
        .
      end
    ' > "$temp_file"

    mv "$temp_file" "$LOG_FILE"

    jq -cn --arg old_id "$old_id" --arg new_id "$new_id" '{ok: true, old_id: $old_id, new_id: $new_id}'
  }

  with_lock supersede_with_lock
}

count_decisions() {
  local total=""
  local active=""

  total=$(read_valid_lines | jq -s 'length')
  active=$(read_valid_lines | jq -s '[ .[] | select((.superseded_by // null) == null) ] | length')

  jq -cn --argjson total "$total" --argjson active "$active" '{total: $total, active: $active}'
}

ensure_state

case "$COMMAND" in
  append)
    if [ "${3:-}" = "" ]; then
      json_error "usage" "append requires a JSON payload"
      exit 1
    fi
    append_decision "$3"
    ;;
  query)
    case "${3:-}" in
      --last)
        if [ "${4:-}" = "" ]; then
          json_error "usage" "query --last requires N"
          exit 1
        fi
        query_last "$4"
        ;;
      --module)
        if [ "${4:-}" = "" ]; then
          json_error "usage" "query --module requires module"
          exit 1
        fi
        query_module "$4"
        ;;
      --node)
        if [ "${4:-}" = "" ]; then
          json_error "usage" "query --node requires hierarchy_node"
          exit 1
        fi
        query_node "$4"
        ;;
      --active)
        query_active
        ;;
      *)
        json_error "usage" "query supports --last N | --module X | --node X | --active"
        exit 1
        ;;
    esac
    ;;
  supersede)
    supersede_decisions "${3:-}" "${4:-}"
    ;;
  count)
    count_decisions
    ;;
  *)
    json_error "usage" "Unknown command: $COMMAND"
    exit 1
    ;;
esac
