#!/usr/bin/env bash
# session-continue.sh — Detect if session can auto-continue pipeline
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash session-continue.sh [--json] <workdir>
set -euo pipefail

# Parse args
JSON_MODE=false
WORKDIR="."
for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
    *) WORKDIR="$arg" ;;
  esac
done

STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"

if [ ! -f "$BRAIN" ]; then
  cat <<'EOF'
{"can_continue":false,"reason":"no_state","suggestion":"Run /hivefiver-start to initialize a new pipeline"}
EOF
  exit 0
fi

PIPELINE_ACTIVE=$(cat "$BRAIN" | grep -o '"pipeline_active":[^,}]*' | head -1 | sed 's/.*://' | tr -d ' "' || echo "false")
CURRENT_STAGE=$(cat "$BRAIN" | grep -o '"current_stage":"[^"]*"' | head -1 | sed 's/.*:"\(.*\)"/\1/' || echo "none")
PIPELINE_ERROR=$(cat "$BRAIN" | grep -o '"pipeline_error":"[^"]*"' | head -1 | sed 's/.*:"\(.*\)"/\1/' || echo "")

CAN_CONTINUE=false
REASON="pipeline_inactive"
SUGGESTION="Run /hivefiver-start to begin a new pipeline"
NEXT_CMD="/hivefiver-start"

if [ "$PIPELINE_ACTIVE" = "true" ]; then
  if [ -z "$PIPELINE_ERROR" ]; then
    CAN_CONTINUE=true
    REASON="pipeline_active"
    SUGGESTION="Pipeline is active at stage ${CURRENT_STAGE}. Use /hivefiver-continue --exec to auto-continue."
    NEXT_CMD="/hivefiver-continue --exec"
  else
    REASON="pipeline_error"
    SUGGESTION="Pipeline has error: ${PIPELINE_ERROR}. Use /hivefiver recover to fix."
    NEXT_CMD="/hivefiver recover"
  fi
fi

cat <<EOF
{"can_continue":${CAN_CONTINUE},"reason":"${REASON}","current_stage":"${CURRENT_STAGE}","suggestion":"${SUGGESTION}","next_command":"${NEXT_CMD}"}
EOF
