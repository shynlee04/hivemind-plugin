#!/usr/bin/env bash
# state-update.sh — Programmatic Pipeline State updates for STATE.md
# Updates the machine-parseable Pipeline State table in STATE.md.
#
# Usage:
#   state-update.sh set-active    <true|false>  [workdir]
#   state-update.sh set-stage     <stage-name>  [workdir]
#   state-update.sh add-completed <stage-name>  [workdir]
#   state-update.sh set-target    <description> [workdir]
#   state-update.sh set-gate      <result>      [workdir]
#   state-update.sh set-error     <description> [workdir]   # Set pipeline error state
#   state-update.sh clear-error                 [workdir]   # Clear error + recovery fields
#   state-update.sh set-checkpoint <stage:info> [workdir]   # Set last checkpoint
#   state-update.sh set-recovery  <action>      [workdir]   # Set recovery action taken
#   state-update.sh read                        [workdir]
#
# Output: JSON to stdout
# Modifies: .hivemind/hive-modules/hivefiver-v2/STATE.md (Pipeline State table only)

set -Eeuo pipefail

readonly ACTION="${1:-}"
readonly VALUE="${2:-}"
readonly WORKDIR="${3:-.}"
readonly STATE_FILE="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/STATE.md"

die() { printf '{"error": "%s"}\n' "$1" >&2; exit 1; }

# --- Validate ---

if [[ -z "$ACTION" ]]; then
  die "Usage: state-update.sh <set-active|set-stage|add-completed|set-target|set-gate|read> <value> [workdir]"
fi

if [[ ! -f "$STATE_FILE" ]]; then
  die "STATE.md not found at: $STATE_FILE"
fi

# --- Read Pipeline State fields ---

parse_field() {
  local field="$1"
  awk -F'|' -v f="$field" '$2 ~ f {gsub(/^ +| +$/,"",$3); print $3}' "$STATE_FILE"
}

# --- Update a Pipeline State field ---
# Uses awk to find the row and replace the value column

update_field() {
  local field="$1" new_value="$2"
  local tmp_file=""

  # macOS-safe in-place sed alternative: use temp file
  tmp_file="$(mktemp)"

  awk -F'|' -v f="$field" -v nv="$new_value" '
    $2 ~ f {
      # Reconstruct the row preserving column structure
      gsub(/^ +| +$/, "", $2)
      printf "| %s | %s |\n", $2, nv
      next
    }
    {print}
  ' "$STATE_FILE" > "$tmp_file"

  cp "$tmp_file" "$STATE_FILE"
  rm -f "$tmp_file"
}

# --- Actions ---

do_read() {
  local active stage completed target gate perror checkpoint recovery
  active="$(parse_field "pipeline_active")"
  stage="$(parse_field "current_stage")"
  completed="$(parse_field "completed_stages")"
  target="$(parse_field "pipeline_target")"
  gate="$(parse_field "last_gate_result")"
  perror="$(parse_field "pipeline_error")"
  checkpoint="$(parse_field "last_checkpoint")"
  recovery="$(parse_field "error_recovery")"

  printf '{"pipeline_active":"%s","current_stage":"%s","completed_stages":"%s","pipeline_target":"%s","last_gate_result":"%s","pipeline_error":"%s","last_checkpoint":"%s","error_recovery":"%s"}\n' \
    "${active:-false}" "${stage:-none}" "${completed:-}" "${target:-}" "${gate:-}" "${perror:-}" "${checkpoint:-}" "${recovery:-}"
}

do_set_active() {
  local val="${VALUE:-}"
  if [[ "$val" != "true" && "$val" != "false" ]]; then
    die "set-active requires 'true' or 'false', got: $val"
  fi
  update_field "pipeline_active" "$val"
  printf '{"action":"set-active","value":"%s","status":"updated"}\n' "$val"
}

do_set_stage() {
  local val="${VALUE:-}"
  local valid_stages="none start discovery intake spec architect build audit doctor"
  local found=false
  for s in $valid_stages; do
    if [[ "$s" == "$val" ]]; then found=true; break; fi
  done
  if [[ "$found" != "true" ]]; then
    die "set-stage: invalid stage '$val'. Valid: $valid_stages"
  fi
  update_field "current_stage" "$val"
  printf '{"action":"set-stage","value":"%s","status":"updated"}\n' "$val"
}

do_add_completed() {
  local val="${VALUE:-}"
  if [[ -z "$val" ]]; then die "add-completed requires a stage name"; fi

  local current
  current="$(parse_field "completed_stages")"

  # Check if already completed
  if echo ",$current," | grep -q ",$val,"; then
    printf '{"action":"add-completed","value":"%s","status":"already_completed"}\n' "$val"
    return 0
  fi

  # Append
  local new_value
  if [[ -z "$current" ]]; then
    new_value="$val"
  else
    new_value="$current,$val"
  fi
  update_field "completed_stages" "$new_value"
  printf '{"action":"add-completed","value":"%s","completed_stages":"%s","status":"updated"}\n' "$val" "$new_value"
}

do_set_target() {
  local val="${VALUE:-}"
  if [[ -z "$val" ]]; then die "set-target requires a description"; fi
  update_field "pipeline_target" "$val"
  printf '{"action":"set-target","value":"%s","status":"updated"}\n' "$val"
}

do_set_gate() {
  local val="${VALUE:-}"
  if [[ -z "$val" ]]; then die "set-gate requires a result string"; fi
  update_field "last_gate_result" "$val"
  printf '{"action":"set-gate","value":"%s","status":"updated"}\n' "$val"
}

do_set_error() {
  local val="${VALUE:-}"
  if [[ -z "$val" ]]; then die "set-error requires an error description"; fi
  update_field "pipeline_error" "$val"
  # Auto-create checkpoint from current stage
  local stage
  stage="$(parse_field "current_stage")"
  local ts
  ts="$(date -u +"%Y%m%dT%H%M%SZ")"
  update_field "last_checkpoint" "${stage:-unknown}:${ts}"
  printf '{"action":"set-error","error":"%s","checkpoint":"%s:%s","status":"updated"}\n' "$val" "${stage:-unknown}" "$ts"
}

do_clear_error() {
  update_field "pipeline_error" ""
  update_field "error_recovery" ""
  printf '{"action":"clear-error","status":"updated"}\n'
}

do_set_checkpoint() {
  local val="${VALUE:-}"
  if [[ -z "$val" ]]; then
    # Auto-generate checkpoint from current stage + timestamp
    local stage
    stage="$(parse_field "current_stage")"
    local ts
    ts="$(date -u +"%Y%m%dT%H%M%SZ")"
    val="${stage:-unknown}:${ts}"
  fi
  update_field "last_checkpoint" "$val"
  printf '{"action":"set-checkpoint","value":"%s","status":"updated"}\n' "$val"
}

do_set_recovery() {
  local val="${VALUE:-}"
  local valid_actions="retry rollback abandon resume"
  if [[ -z "$val" ]]; then die "set-recovery requires an action: $valid_actions"; fi
  local found=false
  for a in $valid_actions; do
    if [[ "$a" == "$val" ]]; then found=true; break; fi
  done
  if [[ "$found" != "true" ]]; then
    die "set-recovery: invalid action '$val'. Valid: $valid_actions"
  fi
  update_field "error_recovery" "$val"
  printf '{"action":"set-recovery","value":"%s","status":"updated"}\n' "$val"
}

do_write_handoff() {
  # Write a timestamped handoff payload to .hivemind/hive-modules/hivefiver-v2/handoffs/
  # VALUE is an optional summary string. If empty, auto-generates from current state.
  local summary="${VALUE:-Auto-generated handoff at pipeline checkpoint.}"
  local handoff_dir="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/handoffs"
  local timestamp
  timestamp="$(date -u +"%Y%m%d-%H%M%S")"
  local handoff_file="$handoff_dir/handoff-${timestamp}.md"

  mkdir -p "$handoff_dir"

  local active stage completed target gate
  active="$(parse_field "pipeline_active")"
  stage="$(parse_field "current_stage")"
  completed="$(parse_field "completed_stages")"
  target="$(parse_field "pipeline_target")"
  gate="$(parse_field "last_gate_result")"

  cat > "$handoff_file" <<HANDOFF_EOF
# HiveFiver Handoff Payload

**Created**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Stage**: ${stage:-unknown}
**Completed**: ${completed:-none}
**Target**: ${target:-unset}
**Last Gate**: ${gate:-none}

## Summary

${summary}

## Next Steps

Continue from stage: ${stage:-unknown}
Pipeline target: ${target:-unset}
Run: bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh --exec .
HANDOFF_EOF

  printf '{"action":"write-handoff","handoff_file":"%s","stage":"%s","status":"written"}\n' \
    "$handoff_file" "${stage:-unknown}"
}

# --- Dispatch ---

case "$ACTION" in
  read)           do_read ;;
  set-active)     do_set_active ;;
  set-stage)      do_set_stage ;;
  add-completed)  do_add_completed ;;
  set-target)     do_set_target ;;
  set-gate)       do_set_gate ;;
  set-error)      do_set_error ;;
  clear-error)    do_clear_error ;;
  set-checkpoint) do_set_checkpoint ;;
  set-recovery)   do_set_recovery ;;
  write-handoff)  do_write_handoff ;;
  *)              die "Unknown action: $ACTION. Valid: read, set-active, set-stage, add-completed, set-target, set-gate, set-error, clear-error, set-checkpoint, set-recovery, write-handoff" ;;
esac
