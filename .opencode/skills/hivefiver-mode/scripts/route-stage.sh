#!/usr/bin/env bash
# route-stage.sh — Read pipeline state and determine current/next stage
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash route-stage.sh <workdir>
set -euo pipefail

WORKDIR="${1:-.}"
STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"
HIERARCHY="${STATE_DIR}/hierarchy.json"

# Default state if no brain.json
if [ ! -f "$BRAIN" ]; then
  cat <<'EOF'
{"pipeline_active":false,"current_stage":"none","next_stage":"start","pipeline_error":"","stage_history":[],"message":"No active pipeline. Run /hivefiver-start to begin."}
EOF
  exit 0
fi

# Read pipeline state from brain.json
PIPELINE_ACTIVE=$(cat "$BRAIN" | grep -o '"pipeline_active":[^,}]*' | head -1 | sed 's/.*://' | tr -d ' "' || echo "false")
CURRENT_STAGE=$(cat "$BRAIN" | grep -o '"current_stage":"[^"]*"' | head -1 | sed 's/.*:"\(.*\)"/\1/' || echo "none")
PIPELINE_ERROR=$(cat "$BRAIN" | grep -o '"pipeline_error":"[^"]*"' | head -1 | sed 's/.*:"\(.*\)"/\1/' || echo "")

# Stage sequence
STAGES=("start" "discovery" "intake" "spec" "architect" "build" "audit")

# Determine next stage
NEXT_STAGE="start"
for i in "${!STAGES[@]}"; do
  if [ "${STAGES[$i]}" = "$CURRENT_STAGE" ]; then
    NEXT_IDX=$((i + 1))
    if [ $NEXT_IDX -lt ${#STAGES[@]} ]; then
      NEXT_STAGE="${STAGES[$NEXT_IDX]}"
    else
      NEXT_STAGE="complete"
    fi
    break
  fi
done

cat <<EOF
{"pipeline_active":${PIPELINE_ACTIVE},"current_stage":"${CURRENT_STAGE}","next_stage":"${NEXT_STAGE}","pipeline_error":"${PIPELINE_ERROR}","stages":["start","discovery","intake","spec","architect","build","audit"]}
EOF
