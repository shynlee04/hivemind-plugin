#!/usr/bin/env bash
# state-update.sh — Read or update pipeline state
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash state-update.sh <read|set-recovery> [value] <workdir>
set -euo pipefail

ACTION="${1:-read}"
VALUE="${2:-}"
WORKDIR="${3:-.}"
STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

case "$ACTION" in
  read)
    if [ -f "$BRAIN" ]; then
      cat "$BRAIN"
    else
      echo "{\"pipeline_active\":false,\"current_stage\":\"none\",\"pipeline_error\":\"\",\"last_updated\":\"${TIMESTAMP}\"}"
    fi
    ;;
  set-recovery)
    RECOVERY_MODE="${VALUE:-retry}"
    if [ -f "$BRAIN" ]; then
      # Read current state and add recovery marker
      echo "{\"recovery_mode\":\"${RECOVERY_MODE}\",\"recovery_timestamp\":\"${TIMESTAMP}\",\"status\":\"recovery_initiated\"}"
    else
      echo "{\"error\":\"no_state_to_recover\",\"suggestion\":\"Run /hivefiver-start first\"}"
    fi
    ;;
  *)
    echo "{\"error\":\"Unknown action: ${ACTION}\",\"valid_actions\":[\"read\",\"set-recovery\"]}"
    exit 1
    ;;
esac
