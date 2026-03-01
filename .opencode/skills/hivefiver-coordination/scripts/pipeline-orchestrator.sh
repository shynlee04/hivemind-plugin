#!/usr/bin/env bash
# pipeline-orchestrator.sh — Autonomous pipeline execution for HiveFiver V2
# Auto-chains stages per intent with checkpoint gates and error handling.
# This script determines the NEXT stage given current state and intent.
#
# Usage:
#   pipeline-orchestrator.sh next <intent> [workdir]     # What stage comes next?
#   pipeline-orchestrator.sh sequence <intent> [workdir]  # Full stage sequence for intent
#   pipeline-orchestrator.sh advance [workdir]            # Advance to next stage (updates STATE.md)
#   pipeline-orchestrator.sh status [workdir]             # Pipeline status summary
#
# Output: JSON to stdout

set -Eeuo pipefail

readonly ACTION="${1:-}"
readonly VALUE="${2:-}"
# WORKDIR: For next/sequence, arg 3 is workdir. For advance/status, arg 2 is workdir.
# Resolve correctly per-action in the do_* functions.
readonly ARG3="${3:-}"
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly STATE_SCRIPT="$SCRIPT_DIR/state-update.sh"

die() { printf '{"error": "%s"}\n' "$1" >&2; exit 1; }

if [[ -z "$ACTION" ]]; then
  die "Usage: pipeline-orchestrator.sh <next|sequence|advance|status> [intent|workdir] [workdir]"
fi

# --- Intent → Stage Sequence ---

get_sequence() {
  local intent="$1"
  case "$intent" in
    build_new|extend)
      echo "start,discovery,intake,spec,architect,build" ;;
    fix_broken)
      echo "start,doctor" ;;
    audit_health)
      echo "start,audit" ;;
    improve)
      echo "start,audit,intake,spec,architect,build" ;;
    learn)
      echo "start,discovery" ;;
    custom|unknown)
      echo "start,discovery" ;;
    *)
      echo "start" ;;
  esac
}

# --- Approval gates (require human confirmation) ---

needs_approval() {
  local stage="$1" intent="$2"
  case "$stage" in
    spec)
      echo "true" ;;
    architect)
      echo "true" ;;
    audit)
      # Improve intent: audit triage gate needs approval
      if [[ "$intent" == "improve" ]]; then
        echo "true"
      else
        echo "false"
      fi
      ;;
    discovery)
      # Custom intent: discovery triage needs approval
      if [[ "$intent" == "custom" || "$intent" == "unknown" ]]; then
        echo "true"
      else
        echo "false"
      fi
      ;;
    *)
      echo "false" ;;
  esac
}

# --- Get next stage in sequence ---

get_next_stage() {
  local intent="$1" completed="$2"
  local sequence
  sequence="$(get_sequence "$intent")"

  # Walk the sequence, find first stage not in completed
  local IFS=","
  for stage in $sequence; do
    if ! echo ",$completed," | grep -q ",$stage,"; then
      echo "$stage"
      return 0
    fi
  done

  # All stages completed
  echo "DONE"
}

# --- Actions ---

do_next() {
  local intent="${VALUE:-}"
  local workdir="${ARG3:-.}"

  if [[ -z "$intent" ]]; then die "next requires an intent. Valid: build_new, fix_broken, audit_health, extend, improve, learn, custom"; fi

  # Read current state
  local state_json
  state_json="$(bash "$STATE_SCRIPT" read "$workdir")"

  local completed
  completed="$(echo "$state_json" | sed 's/.*"completed_stages":"\([^"]*\)".*/\1/')"
  local perror
  perror="$(echo "$state_json" | sed 's/.*"pipeline_error":"\([^"]*\)".*/\1/')"

  # If error exists, next is always recover
  if [[ -n "$perror" ]]; then
    printf '{"action":"next","intent":"%s","next_stage":"recover","reason":"Pipeline has error: %s","next_command":"/hivefiver recover","approval_required":false}\n' "$intent" "$perror"
    return 0
  fi

  local next_stage
  next_stage="$(get_next_stage "$intent" "$completed")"

  if [[ "$next_stage" == "DONE" ]]; then
    printf '{"action":"next","intent":"%s","next_stage":"DONE","reason":"All stages in %s pipeline completed","next_command":"none","approval_required":false}\n' "$intent" "$intent"
    return 0
  fi

  local approval
  approval="$(needs_approval "$next_stage" "$intent")"

  printf '{"action":"next","intent":"%s","next_stage":"%s","next_command":"/hivefiver-%s","approval_required":%s,"completed_so_far":"%s"}\n' \
    "$intent" "$next_stage" "$next_stage" "$approval" "$completed"
}

do_sequence() {
  local intent="${VALUE:-}"
  if [[ -z "$intent" ]]; then die "sequence requires an intent"; fi

  local sequence
  sequence="$(get_sequence "$intent")"

  # Build stage detail array
  local stages_json="["
  local first=true
  local IFS=","
  for stage in $sequence; do
    local approval
    approval="$(needs_approval "$stage" "$intent")"
    if [[ "$first" == "true" ]]; then
      first=false
    else
      stages_json="$stages_json,"
    fi
    stages_json="$stages_json{\"stage\":\"$stage\",\"command\":\"/hivefiver-$stage\",\"approval_required\":$approval}"
  done
  stages_json="$stages_json]"

  printf '{"action":"sequence","intent":"%s","stages":%s,"total_stages":%d}\n' \
    "$intent" "$stages_json" "$(echo "$sequence" | tr ',' '\n' | wc -l | tr -d ' ')"
}

do_advance() {
  local workdir="${VALUE:-.}"

  # Read current state
  local state_json
  state_json="$(bash "$STATE_SCRIPT" read "$workdir")"

  local current_stage completed target perror
  current_stage="$(echo "$state_json" | sed 's/.*"current_stage":"\([^"]*\)".*/\1/')"
  completed="$(echo "$state_json" | sed 's/.*"completed_stages":"\([^"]*\)".*/\1/')"
  target="$(echo "$state_json" | sed 's/.*"pipeline_target":"\([^"]*\)".*/\1/')"
  perror="$(echo "$state_json" | sed 's/.*"pipeline_error":"\([^"]*\)".*/\1/')"

  if [[ -n "$perror" ]]; then
    printf '{"action":"advance","status":"blocked","reason":"Pipeline has error: %s","next_command":"/hivefiver recover"}\n' "$perror"
    return 0
  fi

  if [[ "$current_stage" == "none" || -z "$current_stage" ]]; then
    printf '{"action":"advance","status":"no_pipeline","reason":"No active pipeline. Run /hivefiver-start first.","next_command":"/hivefiver-start"}\n'
    return 0
  fi

  # Mark current stage as completed
  bash "$STATE_SCRIPT" add-completed "$current_stage" "$workdir" > /dev/null 2>&1

  # Create checkpoint
  bash "$STATE_SCRIPT" set-checkpoint "" "$workdir" > /dev/null 2>&1

  # Determine next stage (we need intent to know the sequence — infer from completed stages)
  local intent="build_new"
  if echo ",$completed,$current_stage," | grep -q ",audit," && ! echo ",$completed,$current_stage," | grep -q ",discovery,"; then
    intent="improve"
  elif echo ",$completed,$current_stage," | grep -q ",doctor,"; then
    intent="fix_broken"
  elif echo ",$completed,$current_stage," | grep -q ",audit,"; then
    intent="audit_health"
  fi

  local new_completed
  new_completed="$(bash "$STATE_SCRIPT" read "$workdir" | sed 's/.*"completed_stages":"\([^"]*\)".*/\1/')"

  local next_stage
  next_stage="$(get_next_stage "$intent" "$new_completed")"

  if [[ "$next_stage" == "DONE" ]]; then
    bash "$STATE_SCRIPT" set-active false "$workdir" > /dev/null 2>&1
    bash "$STATE_SCRIPT" set-stage none "$workdir" > /dev/null 2>&1
    printf '{"action":"advance","status":"pipeline_complete","completed_stage":"%s","completed_stages":"%s","next_command":"none"}\n' "$current_stage" "$new_completed"
  else
    bash "$STATE_SCRIPT" set-stage "$next_stage" "$workdir" > /dev/null 2>&1
    local approval
    approval="$(needs_approval "$next_stage" "$intent")"
    printf '{"action":"advance","status":"advanced","completed_stage":"%s","next_stage":"%s","next_command":"/hivefiver-%s","approval_required":%s}\n' \
      "$current_stage" "$next_stage" "$next_stage" "$approval"
  fi
}

do_status() {
  local workdir="${VALUE:-.}"
  local state_json
  state_json="$(bash "$STATE_SCRIPT" read "$workdir")"

  local active current completed target perror checkpoint recovery
  active="$(echo "$state_json" | sed 's/.*"pipeline_active":"\([^"]*\)".*/\1/')"
  current="$(echo "$state_json" | sed 's/.*"current_stage":"\([^"]*\)".*/\1/')"
  completed="$(echo "$state_json" | sed 's/.*"completed_stages":"\([^"]*\)".*/\1/')"
  target="$(echo "$state_json" | sed 's/.*"pipeline_target":"\([^"]*\)".*/\1/')"
  perror="$(echo "$state_json" | sed 's/.*"pipeline_error":"\([^"]*\)".*/\1/')"
  checkpoint="$(echo "$state_json" | sed 's/.*"last_checkpoint":"\([^"]*\)".*/\1/')"

  local health="healthy"
  if [[ -n "$perror" ]]; then health="error"; fi
  if [[ "$active" != "true" ]]; then health="inactive"; fi

  local completed_count=0
  if [[ -n "$completed" ]]; then
    completed_count="$(echo "$completed" | tr ',' '\n' | wc -l | tr -d ' ')"
  fi

  printf '{"action":"status","health":"%s","active":%s,"current_stage":"%s","completed_count":%d,"completed_stages":"%s","target":"%s","error":"%s","checkpoint":"%s"}\n' \
    "$health" "$active" "$current" "$completed_count" "$completed" "$target" "$perror" "$checkpoint"
}

# --- Dispatch ---

case "$ACTION" in
  next)     do_next ;;
  sequence) do_sequence ;;
  advance)  do_advance ;;
  status)   do_status ;;
  *)        die "Unknown action: $ACTION. Valid: next, sequence, advance, status" ;;
esac
