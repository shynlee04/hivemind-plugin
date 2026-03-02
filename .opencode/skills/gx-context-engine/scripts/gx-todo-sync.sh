#!/usr/bin/env bash
# gx-todo-sync.sh — TODO↔hierarchy bidirectional sync
# USAGE:
#   gx-todo-sync.sh <workdir> sync
#   gx-todo-sync.sh <workdir> link <todo_id> <hierarchy_node>
#   gx-todo-sync.sh <workdir> check

set -euo pipefail

WORKDIR="${1:-}"
ACTION="${2:-}"
TODO_ID="${3:-}"
HIERARCHY_NODE="${4:-}"

TODO_FILE=""
HIERARCHY_FILE=""

json_error() {
  local code="$1"
  local message="$2"
  jq -cn --arg code "$code" --arg message "$message" '{ok: false, error: $code, message: $message}'
}

with_lock() {
  local lock_target="$1"
  shift
  local lock_dir="${lock_target}.lock.d"
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
  trap 'rmdir "${lock_dir:-}" 2>/dev/null || true' EXIT

  "$@"
  local status=$?
  rmdir "$lock_dir" 2>/dev/null || true
  trap - EXIT
  return "$status"
}

emit_error() {
  local message="$1"
  json_error "generic_error" "$message"
}

usage() {
  emit_error "usage: gx-todo-sync.sh <workdir> sync|link|check [todo_id] [hierarchy_node]"
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    emit_error "jq is required"
    exit 1
  fi
}

read_todo_items() {
  if [ ! -f "$TODO_FILE" ]; then
    echo '[]'
    return
  fi

  if ! jq -c '.items // []' "$TODO_FILE" 2>/dev/null; then
    emit_error "invalid todo.json"
    exit 1
  fi
}

read_action_nodes() {
  if [ ! -f "$HIERARCHY_FILE" ]; then
    echo '[]'
    return
  fi

  if ! jq -c '[.. | objects | select((.type? // "") == "action") | {id: (.id // ""), content: (.content // ""), status: (.status // "pending")}]' "$HIERARCHY_FILE" 2>/dev/null; then
    emit_error "invalid hierarchy.json"
    exit 1
  fi
}

write_json_atomic() {
  local target_file="$1"
  local content="$2"
  local tmp_file

  tmp_file="$(mktemp "${target_file}.tmp.XXXXXX")"
  printf '%s\n' "$content" > "$tmp_file"
  mv "$tmp_file" "$target_file"
}

run_sync() {
  local todos_json
  local nodes_json

  if [ ! -f "$TODO_FILE" ]; then
    jq -cn '{"linked":0,"orphan_todos":[],"untracked_nodes":[],"status_mismatches":[],"sync_health":"healthy"}'
    return
  fi

  if ! todos_json="$(read_todo_items | jq -c '[.[] | select(.status != "completed" and .status != "cancelled")]' 2>/dev/null)"; then
    emit_error "invalid todo.json"
    exit 1
  fi
  nodes_json="$(read_action_nodes)"

  jq -cn \
    --argjson todos "$todos_json" \
    --argjson nodes "$nodes_json" \
    '
    ($nodes
      | map(select((.id // "") != ""))
      | map({key: .id, value: .})
      | from_entries) as $node_map
    | ($todos
      | map(select(
        (.hierarchy_node? // "") != ""
        and ($node_map[.hierarchy_node] != null)
      ))) as $linked_todos
    | ($todos
      | map(select(
        (.hierarchy_node? // "") == ""
        or ($node_map[.hierarchy_node] == null)
      )
      | {id: (.id // ""), content: (.content // ""), reason: "no matching hierarchy node"})) as $orphans
    | ($nodes
      | map(select(
        (.id // "") as $node_id
        | ($todos | any((.hierarchy_node? // "") == $node_id) | not)
      )
      | {id: (.id // ""), content: (.content // "")})) as $untracked
    | ($todos
      | map(select(
        (.hierarchy_node? // "") as $node_id
        | $node_id != ""
        and ($node_map[$node_id] != null)
        and (($node_map[$node_id].status // "unknown") != (.status // "unknown"))
      )
      | {
          todo_id: (.id // ""),
          node_id: (.hierarchy_node // ""),
          todo_status: (.status // "unknown"),
          node_status: ($node_map[.hierarchy_node].status // "unknown")
        })) as $mismatches
    | {
        linked: ($linked_todos | length),
        orphan_todos: $orphans,
        untracked_nodes: $untracked,
        status_mismatches: $mismatches
      }
    | .sync_health = (
        if (.orphan_todos | length) == 0
          and (.untracked_nodes | length) == 0
          and (.status_mismatches | length) == 0
        then
          "healthy"
        elif .linked == 0 and ($todos | length) > 0 and ($nodes | length) > 0
        then
          "broken"
        else
          "degraded"
        end
      )
    '
}

run_link() {
  local updated_todo
  local node_warning=""

  link_read_modify_write() {
    if [ ! -f "$TODO_FILE" ]; then
      emit_error "todo.json not found"
      return 1
    fi

    if ! jq -e --arg todo_id "$TODO_ID" '.items // [] | any(.id == $todo_id)' "$TODO_FILE" >/dev/null 2>&1; then
      emit_error "todo item not found"
      return 1
    fi

    if ! updated_todo="$(jq --arg todo_id "$TODO_ID" --arg hierarchy_node "$HIERARCHY_NODE" '.items |= map(if .id == $todo_id then . + {hierarchy_node: $hierarchy_node} else . end)' "$TODO_FILE" 2>/dev/null)"; then
      emit_error "failed to update todo.json"
      return 1
    fi

    write_json_atomic "$TODO_FILE" "$updated_todo"
  }

  if [ -z "$TODO_ID" ] || [ -z "$HIERARCHY_NODE" ]; then
    usage
    exit 1
  fi

  # Validate hierarchy_node exists (warning, not error)
  if [ -f "$HIERARCHY_FILE" ]; then
    if ! jq -e --arg node "$HIERARCHY_NODE" '
      def walk_nodes: .id, ((.children? // [])[] | walk_nodes);
      [walk_nodes] | any(. == $node)
    ' "$HIERARCHY_FILE" >/dev/null 2>&1; then
      node_warning="hierarchy_node not found in hierarchy.json (link set but unverified)"
    fi
  else
    node_warning="hierarchy.json not found (link set but unverified)"
  fi

  if ! with_lock "$TODO_FILE" link_read_modify_write; then
    exit 1
  fi
  
  if [ -n "$node_warning" ]; then
    jq -cn --arg todo_id "$TODO_ID" --arg hierarchy_node "$HIERARCHY_NODE" --arg warning "$node_warning" \
      '{"status":"linked","todo_id":$todo_id,"hierarchy_node":$hierarchy_node,"warning":$warning}'
  else
    jq -cn --arg todo_id "$TODO_ID" --arg hierarchy_node "$HIERARCHY_NODE" \
      '{"status":"linked","todo_id":$todo_id,"hierarchy_node":$hierarchy_node}'
  fi
}

run_check() {
  local unlinked_count

  if [ ! -f "$TODO_FILE" ]; then
    jq -cn '{"all_linked":true}'
    return
  fi

  if ! unlinked_count="$(jq -r '[.items // [] | .[] | select(.status == "pending" or .status == "in_progress") | select((.hierarchy_node? // "") == "")] | length' "$TODO_FILE" 2>/dev/null)"; then
    emit_error "invalid todo.json"
    exit 1
  fi

  if [ "$unlinked_count" -eq 0 ]; then
    jq -cn '{"all_linked":true}'
  else
    jq -cn --argjson unlinked_count "$unlinked_count" '{"all_linked":false,"unlinked_count":$unlinked_count}'
  fi
}

if [ -z "$WORKDIR" ] || [ -z "$ACTION" ]; then
  usage
  exit 1
fi

TODO_FILE="$WORKDIR/todo.json"
HIERARCHY_FILE="$WORKDIR/hierarchy.json"

require_jq

case "$ACTION" in
  sync)
    run_sync
    ;;
  link)
    run_link
    ;;
  check)
    run_check
    ;;
  *)
    usage
    exit 1
    ;;
esac
