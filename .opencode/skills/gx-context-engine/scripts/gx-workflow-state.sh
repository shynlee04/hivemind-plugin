#!/usr/bin/env bash
# gx-workflow-state.sh — File-persisted workflow state
# USAGE:
#   gx-workflow-state.sh <workdir> init <workflow_id> <total_steps> [max_iterations]
#   gx-workflow-state.sh <workdir> advance <workflow_id> <step_name> [step_output_json]
#   gx-workflow-state.sh <workdir> read <workflow_id>
#   gx-workflow-state.sh <workdir> block <workflow_id> <reason>
#   gx-workflow-state.sh <workdir> unblock <workflow_id>
#   gx-workflow-state.sh <workdir> list
#   gx-workflow-state.sh <workdir> cleanup <workflow_id>

set -euo pipefail

usage() {
  printf '%s\n' "Usage:"
  printf '%s\n' "  gx-workflow-state.sh <workdir> init <workflow_id> <total_steps> [max_iterations]"
  printf '%s\n' "  gx-workflow-state.sh <workdir> advance <workflow_id> <step_name> [step_output_json]"
  printf '%s\n' "  gx-workflow-state.sh <workdir> read <workflow_id>"
  printf '%s\n' "  gx-workflow-state.sh <workdir> block <workflow_id> <reason>"
  printf '%s\n' "  gx-workflow-state.sh <workdir> unblock <workflow_id>"
  printf '%s\n' "  gx-workflow-state.sh <workdir> list"
  printf '%s\n' "  gx-workflow-state.sh <workdir> cleanup <workflow_id>"
}

error_json() {
  local error_code="$1"
  local workflow_id="${2:-}"
  local reason="${3:-}"

  if [[ -n "$workflow_id" && -n "$reason" ]]; then
    jq -n --arg error "$error_code" --arg workflow_id "$workflow_id" --arg reason "$reason" \
      '{error:$error, workflow_id:$workflow_id, reason:$reason}'
  elif [[ -n "$workflow_id" ]]; then
    jq -n --arg error "$error_code" --arg workflow_id "$workflow_id" \
      '{error:$error, workflow_id:$workflow_id}'
  else
    jq -n --arg error "$error_code" '{error:$error}'
  fi
}

json_error() {
  local error_code="$1"
  local message="$2"
  jq -n --arg error "$error_code" --arg message "$message" '{error:$error, message:$message}'
}

with_lock() {
  local state_file="$1"
  shift
  local lock_dir="${state_file}.lock.d"
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

now_epoch() {
  date +%s
}

write_atomic_json() {
  local target_path="$1"
  local json_payload="$2"
  local temp_path
  temp_path="$(mktemp "${target_path}.XXXXXX")"
  printf '%s\n' "$json_payload" >"$temp_path"
  mv "$temp_path" "$target_path"
}

ensure_number() {
  local name="$1"
  local value="$2"
  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    error_json "invalid_${name}" | jq .
    exit 1
  fi
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' '{"error":"jq_missing"}'
  exit 1
fi

WORKDIR="$1"
COMMAND="$2"
STATE_DIR="${WORKDIR}/.hivemind/state"
ARCHIVE_DIR="${WORKDIR}/.hivemind/archive"

mkdir -p "$STATE_DIR"

state_file_for() {
  local workflow_id="$1"
  printf '%s/wf-%s.json' "$STATE_DIR" "$workflow_id"
}

read_state_or_fail() {
  local workflow_id="$1"
  local state_file
  state_file="$(state_file_for "$workflow_id")"
  if [[ ! -f "$state_file" ]]; then
    error_json "not_found" "$workflow_id" | jq .
    exit 1
  fi
  # Handle corrupt state files gracefully
  if ! jq -e '.' "$state_file" >/dev/null 2>&1; then
    error_json "corrupt_state" "$workflow_id" "State file contains invalid JSON" | jq .
    exit 1
  fi
  jq . "$state_file"
}

cmd_init() {
  local workflow_id="$1"
  local total_steps="$2"
  local max_iterations="${3:-3}"
  ensure_number "total_steps" "$total_steps"
  ensure_number "max_iterations" "$max_iterations"

  local state_file
  state_file="$(state_file_for "$workflow_id")"

  init_with_lock() {
    local iteration_count=0
    if [[ -f "$state_file" ]]; then
      if jq -e '.' "$state_file" >/dev/null 2>&1; then
        local existing_iteration_count
        existing_iteration_count="$(jq -r '.iteration_count // 0' "$state_file")"
        if [[ "$existing_iteration_count" =~ ^[0-9]+$ ]]; then
          iteration_count=$((existing_iteration_count + 1))
        else
          iteration_count=1
        fi
      else
        # Corrupt file: reset iteration count, overwrite with fresh state
        iteration_count=0
      fi
    fi

    local started_at
    started_at="$(now_epoch)"

    local state_json
    state_json="$(jq -n \
      --arg workflow_id "$workflow_id" \
      --argjson total_steps "$total_steps" \
      --argjson max_iterations "$max_iterations" \
      --argjson iteration_count "$iteration_count" \
      --argjson started_at "$started_at" \
      '{
        workflow_id: $workflow_id,
        current_step: 0,
        total_steps: $total_steps,
        step_name: null,
        iteration_count: $iteration_count,
        max_iterations: $max_iterations,
        started_at: $started_at,
        last_step_completed_at: null,
        step_outputs: {},
        transition_log: [],
        is_blocked: false,
        blocked_reason: null
      }')"

    write_atomic_json "$state_file" "$state_json"
    printf '%s\n' "$state_json"
  }

  with_lock "$state_file" init_with_lock
}

cmd_advance() {
  local workflow_id="$1"
  local step_name="$2"
  local step_output_json="{}"
  if [[ $# -ge 3 && -n "${3}" ]]; then
    step_output_json="$3"
  fi
  local state_file
  state_file="$(state_file_for "$workflow_id")"

  if ! printf '%s' "$step_output_json" | jq -e 'type == "object"' >/dev/null 2>&1; then
    error_json "invalid_step_output" "$workflow_id" | jq .
    exit 1
  fi

  advance_with_lock() {
    if [[ ! -f "$state_file" ]]; then
      error_json "not_found" "$workflow_id" | jq .
      return 1
    fi

    if ! jq -e '.' "$state_file" >/dev/null 2>&1; then
      error_json "corrupt_state" "$workflow_id" "State file contains invalid JSON" | jq .
      return 1
    fi

    local is_blocked
    is_blocked="$(jq -r '.is_blocked' "$state_file")"
    if [[ "$is_blocked" == "true" ]]; then
      local blocked_reason
      blocked_reason="$(jq -r '.blocked_reason // "blocked"' "$state_file")"
      error_json "blocked" "$workflow_id" "$blocked_reason" | jq .
      return 1
    fi

    local current_step
    local total_steps
    current_step="$(jq -r '.current_step' "$state_file")"
    total_steps="$(jq -r '.total_steps' "$state_file")"
    if ((current_step >= total_steps)); then
      error_json "already_complete" "$workflow_id" | jq .
      return 1
    fi

    local from_step
    from_step="$(jq -r '.step_name // "0_init"' "$state_file")"
    local completed_at
    completed_at="$(now_epoch)"

    local updated_json
    updated_json="$(jq \
      --arg step_name "$step_name" \
      --arg from_step "$from_step" \
      --argjson completed_at "$completed_at" \
      --argjson step_output "$step_output_json" \
      '.current_step += 1
      | .step_name = $step_name
      | .last_step_completed_at = $completed_at
      | .step_outputs[$step_name] = ($step_output + {completed_at: $completed_at})
      | .transition_log += [{from: $from_step, to: $step_name, at: $completed_at, reason: "advance"}]' \
      "$state_file")"

    write_atomic_json "$state_file" "$updated_json"
    printf '%s\n' "$updated_json"
  }

  with_lock "$state_file" advance_with_lock
}

cmd_read() {
  local workflow_id="$1"
  local state_file
  state_file="$(state_file_for "$workflow_id")"
  if [[ ! -f "$state_file" ]]; then
    error_json "not_found" "$workflow_id" | jq .
    return 0
  fi

  if ! jq -e '.' "$state_file" >/dev/null 2>&1; then
    error_json "corrupt_state" "$workflow_id" "State file contains invalid JSON" | jq .
    return 1
  fi

  jq . "$state_file"
}

cmd_block() {
  local workflow_id="$1"
  local reason="$2"
  local state_file
  state_file="$(state_file_for "$workflow_id")"

  block_with_lock() {
    if [[ ! -f "$state_file" ]]; then
      error_json "not_found" "$workflow_id" | jq .
      return 1
    fi

    if ! jq -e '.' "$state_file" >/dev/null 2>&1; then
      error_json "corrupt_state" "$workflow_id" "State file contains invalid JSON" | jq .
      return 1
    fi

    local updated_json
    updated_json="$(jq --arg reason "$reason" '.is_blocked = true | .blocked_reason = $reason' "$state_file")"
    write_atomic_json "$state_file" "$updated_json"
    printf '%s\n' "$updated_json"
  }

  with_lock "$state_file" block_with_lock
}

cmd_unblock() {
  local workflow_id="$1"
  local state_file
  state_file="$(state_file_for "$workflow_id")"

  unblock_with_lock() {
    if [[ ! -f "$state_file" ]]; then
      error_json "not_found" "$workflow_id" | jq .
      return 1
    fi

    if ! jq -e '.' "$state_file" >/dev/null 2>&1; then
      error_json "corrupt_state" "$workflow_id" "State file contains invalid JSON" | jq .
      return 1
    fi

    local updated_json
    updated_json="$(jq '.is_blocked = false | .blocked_reason = null' "$state_file")"
    write_atomic_json "$state_file" "$updated_json"
    printf '%s\n' "$updated_json"
  }

  with_lock "$state_file" unblock_with_lock
}

cmd_list() {
  shopt -s nullglob
  local files=("$STATE_DIR"/wf-*.json)
  shopt -u nullglob

  if (( ${#files[@]} == 0 )); then
    printf '%s\n' '[]'
    return 0
  fi

  local valid_entries=""
  local f
  local entry
  for f in "${files[@]}"; do
    if entry="$(jq -c '.' "$f" 2>/dev/null)"; then
      valid_entries+="${entry}"$'\n'
    fi
  done

  if [[ -z "$valid_entries" ]]; then
    printf '%s\n' '[]'
    return 0
  fi

  printf '%s' "$valid_entries" | jq -s '[.[] | {workflow_id, current_step, is_blocked}]'
}

cmd_cleanup() {
  local workflow_id="$1"
  local state_file
  state_file="$(state_file_for "$workflow_id")"

  cleanup_with_lock() {
    if [[ ! -f "$state_file" ]]; then
      error_json "not_found" "$workflow_id" | jq .
      return 1
    fi

    mkdir -p "$ARCHIVE_DIR"
    local archive_file="${ARCHIVE_DIR}/wf-${workflow_id}.json"
    mv "$state_file" "$archive_file"

    jq -n --arg status "archived" --arg workflow_id "$workflow_id" --arg path "$archive_file" \
      '{status:$status, workflow_id:$workflow_id, path:$path}'
  }

  with_lock "$state_file" cleanup_with_lock
}

case "$COMMAND" in
  init)
    if [[ $# -lt 4 ]]; then
      usage
      exit 1
    fi
    cmd_init "$3" "$4" "${5:-3}"
    ;;
  advance)
    if [[ $# -lt 4 ]]; then
      usage
      exit 1
    fi
    cmd_advance "$3" "$4" "${5-}"
    ;;
  read)
    if [[ $# -lt 3 ]]; then
      usage
      exit 1
    fi
    cmd_read "$3"
    ;;
  block)
    if [[ $# -lt 4 ]]; then
      usage
      exit 1
    fi
    cmd_block "$3" "$4"
    ;;
  unblock)
    if [[ $# -lt 3 ]]; then
      usage
      exit 1
    fi
    cmd_unblock "$3"
    ;;
  list)
    cmd_list
    ;;
  cleanup)
    if [[ $# -lt 3 ]]; then
      usage
      exit 1
    fi
    cmd_cleanup "$3"
    ;;
  *)
    usage
    exit 1
    ;;
esac
