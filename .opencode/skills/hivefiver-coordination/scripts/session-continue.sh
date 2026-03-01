#!/usr/bin/env bash
# session-continue.sh — Deterministic auto-session creator for HiveFiver V2
#
# Reads current pipeline state from STATE.md, composes a self-contained
# handoff prompt, and outputs the exact opencode run command to launch
# a fresh HiveFiver session that picks up exactly where the last one stopped.
#
# Usage:
#   session-continue.sh [workdir]          # Output opencode run command (dry-run safe)
#   session-continue.sh --exec [workdir]   # Execute the opencode run command directly
#   session-continue.sh --prompt [workdir] # Output only the composed prompt (for inspection)
#   session-continue.sh --json [workdir]   # Output machine-parseable JSON
#
# Depends on: state-update.sh, route-stage.sh, STATE.md, jq, opencode

set -Eeuo pipefail

# --- Arg parsing ---

MODE="command"
WORKDIR="."

for arg in "$@"; do
  case "$arg" in
    --exec)   MODE="exec" ;;
    --prompt) MODE="prompt" ;;
    --json)   MODE="json" ;;
    --*)      echo "Unknown flag: $arg" >&2; exit 1 ;;
    *)        WORKDIR="$arg" ;;
  esac
done

WORKDIR="$(cd "$WORKDIR" && pwd)"

# --- Paths ---

SCRIPTS_DIR="$WORKDIR/.opencode/skills/hivefiver-coordination/scripts"
MODE_SCRIPTS="$WORKDIR/.opencode/skills/hivefiver-mode/scripts"
STATE_FILE="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/STATE.md"
HANDOFF_DIR="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/handoffs"

die() { printf '[session-continue] ERROR: %s\n' "$1" >&2; exit 1; }

# --- Validate dependencies ---

[[ -f "$STATE_FILE" ]]                   || die "STATE.md not found at: $STATE_FILE"
[[ -x "$SCRIPTS_DIR/state-update.sh" ]] || die "state-update.sh not found or not executable"
[[ -x "$MODE_SCRIPTS/route-stage.sh" ]] || die "route-stage.sh not found or not executable"
command -v opencode >/dev/null 2>&1      || die "opencode CLI not found in PATH"
command -v jq >/dev/null 2>&1           || die "jq not found — required for JSON parsing"

# --- Read current pipeline state ---

STATE_JSON=$("$SCRIPTS_DIR/state-update.sh" read "$WORKDIR")

PIPELINE_ACTIVE=$(echo "$STATE_JSON" | jq -r '.pipeline_active')
CURRENT_STAGE=$(echo "$STATE_JSON"   | jq -r '.current_stage')
COMPLETED=$(echo "$STATE_JSON"       | jq -r '.completed_stages')
TARGET=$(echo "$STATE_JSON"          | jq -r '.pipeline_target')
LAST_GATE=$(echo "$STATE_JSON"       | jq -r '.last_gate_result')

# --- Read route for current stage ---

ROUTE_JSON=$("$MODE_SCRIPTS/route-stage.sh" "$WORKDIR")
STAGE_COMMAND=$(echo "$ROUTE_JSON" | jq -r '.command')

# --- Guard: nothing to continue if pipeline inactive ---

if [[ "$PIPELINE_ACTIVE" != "true" ]]; then
  if [[ "$MODE" == "json" ]]; then
    printf '{"error":"pipeline_inactive","message":"No active pipeline. Run /hivefiver start to begin.","pipeline_active":false}\n'
  else
    printf '[session-continue] No active pipeline. Run /hivefiver start to begin.\n' >&2
  fi
  exit 0
fi

# --- Read latest handoff payload if it exists ---

HANDOFF_CONTEXT=""
LATEST_HANDOFF=""

if [[ -d "$HANDOFF_DIR" ]]; then
  LATEST_HANDOFF=$(ls -t "$HANDOFF_DIR"/*.md 2>/dev/null | head -1 || true)
fi

if [[ -n "$LATEST_HANDOFF" && -f "$LATEST_HANDOFF" ]]; then
  HANDOFF_CONTEXT=$(cat "$LATEST_HANDOFF")
fi

# --- Build timestamps and session identity ---

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_TITLE="hivefiver:auto:${CURRENT_STAGE}:${TIMESTAMP}"

# --- Compose prompt into a temp file (avoids heredoc-in-subshell apostrophe bug) ---

PROMPT_FILE=$(mktemp /tmp/hivefiver-prompt-XXXXXX)

{
  printf 'Load skills: hivefiver-mode and hivefiver-coordination FIRST before any action.\n'
  printf '\n'
  printf '## HiveFiver Auto-Resume Session\n'
  printf '\n'
  printf '**Timestamp**: %s\n' "$TIMESTAMP"
  printf '**Resumed from pipeline**: active\n'
  printf '**Current Stage**: %s\n' "$CURRENT_STAGE"
  printf '**Completed Stages**: %s\n' "$COMPLETED"
  printf '**Pipeline Target**: %s\n' "$TARGET"
  printf '**Last Gate Result**: %s\n' "${LAST_GATE:-none}"
  printf '\n'
  printf '## What You Are\n'
  printf '\n'
  printf 'You are HiveFiver, the OpenCode meta-builder. You build framework assets ONLY\n'
  printf 'in .opencode/** and .hivemind/**. You NEVER touch src/** or tests/**.\n'
  printf '\n'
  printf '## Current Pipeline State\n'
  printf '\n'
  printf 'Stage command to execute: %s\n' "$STAGE_COMMAND"
  printf 'Completed so far: %s\n' "${COMPLETED:-none}"
  printf 'Target: %s\n' "$TARGET"
  printf '\n'

  # --- Dynamic next-stage instructions via pipeline-orchestrator ---
  orch_script="$WORKDIR/.opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh"
  if [[ -x "$orch_script" ]]; then
    next_json=$("$orch_script" next "$CURRENT_STAGE" "$WORKDIR" 2>/dev/null || true)
    if [[ -n "$next_json" ]]; then
      next_stage=$(printf '%s' "$next_json" | sed -n 's/.*"next_stage" *: *"\([^"]*\)".*/\1/p')
      next_cmd=$(printf '%s' "$next_json" | sed -n 's/.*"next_command" *: *"\([^"]*\)".*/\1/p')
      if [[ -n "$next_stage" && "$next_stage" != "null" ]]; then
        printf '## After This Stage\n'
        printf '\n'
        printf 'Next stage: %s (command: %s)\n' "$next_stage" "$next_cmd"
        printf '\n'
      fi
    fi
  fi

  printf '## Instructions\n'
  printf '\n'
  printf '1. Run: bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .\n'
  printf '2. Run: bash .opencode/skills/hivefiver-mode/scripts/route-stage.sh .\n'
  printf '3. Execute the current stage command: %s\n' "$STAGE_COMMAND"
  printf '4. After completion: run quality-check.sh %s . and verify output\n' "$CURRENT_STAGE"
  printf '5. Update pipeline state: bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed %s .\n' "$CURRENT_STAGE"
  printf '6. Advance to next stage or report completion\n'
  printf '\n'
  printf '## Prior Handoff Context\n'
  printf '\n'
  if [[ -n "$HANDOFF_CONTEXT" ]]; then
    printf '%s\n' "$HANDOFF_CONTEXT"
  else
    printf 'No prior handoff file found. This is the first auto-session.\n'
  fi
  printf '\n'
  printf '## Scope Boundaries (ENFORCED)\n'
  printf '\n'
  printf 'ALLOWED: .opencode/**, .hivemind/**, docs/**\n'
  printf 'FORBIDDEN: src/**, tests/**, any file outside project worktree\n'
  printf '\n'
  printf '## Quality Gate Before Claiming Done\n'
  printf '\n'
  printf 'Run: bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh %s .\n' "$CURRENT_STAGE"
  printf 'All findings must be addressed or documented in STATE.md known-issues.\n'
} > "$PROMPT_FILE"

# --- Write handoff record ---

mkdir -p "$HANDOFF_DIR"
HANDOFF_FILE="$HANDOFF_DIR/handoff-$(date -u +"%Y%m%d-%H%M%S").md"

{
  printf '# HiveFiver Handoff Payload\n'
  printf '\n'
  printf '**Created**: %s\n' "$TIMESTAMP"
  printf '**Stage**: %s\n' "$CURRENT_STAGE"
  printf '**Completed**: %s\n' "$COMPLETED"
  printf '**Target**: %s\n' "$TARGET"
  printf '**Last Gate**: %s\n' "${LAST_GATE:-none}"
  printf '**Session Title**: %s\n' "$SESSION_TITLE"
  printf '\n'
  printf '## Summary\n'
  printf '\n'
  printf 'Auto-session created by session-continue.sh.\n'
  printf 'This handoff records the state at the moment the new session was spawned.\n'
  printf '\n'
  printf '## Next Steps Written to New Session\n'
  printf '\n'
  printf 'Phase 4 continuation instructions sent. See composed prompt.\n'
} > "$HANDOFF_FILE"

# --- Build the opencode run command (uses --file flag to pass prompt safely) ---
# opencode run --file attaches files; we use the prompt text directly from file content

OC_CMD="opencode run --agent hivefiver --title \"${SESSION_TITLE}\" --dir \"${WORKDIR}\" \"$(cat "$PROMPT_FILE")\""

# --- Output based on mode ---

case "$MODE" in
  command)
    printf '\n'
    printf '# Auto-generated HiveFiver continuation command\n'
    printf '# Stage: %s\n' "$CURRENT_STAGE"
    printf '# Target: %s\n' "$TARGET"
    printf '# Run this to launch a fresh context that auto-continues:\n'
    printf '\n'
    printf 'PROMPT_FILE=%s\n' "$PROMPT_FILE"
    printf 'opencode run --agent hivefiver --title "%s" --dir "%s" "$(cat "$PROMPT_FILE")"\n' \
      "$SESSION_TITLE" "$WORKDIR"
    printf '\n'
    printf '# Handoff recorded : %s\n' "$HANDOFF_FILE"
    printf '# Prompt file      : %s\n' "$PROMPT_FILE"
    printf '# Inspect prompt   : cat %s\n' "$PROMPT_FILE"
    ;;

  exec)
    printf '[session-continue] Launching new HiveFiver session...\n' >&2
    printf '[session-continue] Stage       : %s\n' "$CURRENT_STAGE" >&2
    printf '[session-continue] Title       : %s\n' "$SESSION_TITLE" >&2
    printf '[session-continue] Handoff     : %s\n' "$HANDOFF_FILE" >&2
    printf '[session-continue] Prompt file : %s\n' "$PROMPT_FILE" >&2
    printf '\n' >&2
    PROMPT_CONTENT="$(cat "$PROMPT_FILE")"
    rm -f "$PROMPT_FILE"
    opencode run \
      --agent hivefiver \
      --title "$SESSION_TITLE" \
      --dir "$WORKDIR" \
      "$PROMPT_CONTENT"
    ;;

  prompt)
    cat "$PROMPT_FILE"
    ;;

  json)
    jq -n \
      --arg stage        "$CURRENT_STAGE" \
      --arg completed    "$COMPLETED" \
      --arg target       "$TARGET" \
      --arg title        "$SESSION_TITLE" \
      --arg cmd          "$STAGE_COMMAND" \
      --arg handoff      "$HANDOFF_FILE" \
      --arg prompt_file  "$PROMPT_FILE" \
      --rawfile prompt   "$PROMPT_FILE" \
      '{
        stage:          $stage,
        completed:      $completed,
        target:         $target,
        session_title:  $title,
        stage_command:  $cmd,
        handoff_file:   $handoff,
        prompt_file:    $prompt_file,
        prompt:         $prompt
      }'
    ;;
esac
