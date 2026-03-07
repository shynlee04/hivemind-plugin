#!/usr/bin/env bash
# pipeline-orchestrator.sh — Pipeline health, status, and sequence management
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash pipeline-orchestrator.sh <action> <workdir>
#   actions: status, sequence <intent>
set -euo pipefail

ACTION="${1:-status}"
WORKDIR="${2:-.}"
STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"

# Stage definitions
STAGES_BUILD="start → discovery → intake → spec → architect → build → audit"
STAGES_FIX="start → doctor → build → audit"
STAGES_AUDIT="start → audit"
STAGES_EXTEND="start → discovery → spec → build → audit"
STAGES_LEARN="start → discovery"

case "$ACTION" in
  status)
    if [ ! -f "$BRAIN" ]; then
      cat <<'EOF'
{"pipeline_active":false,"pipeline_health":"no_state","current_stage":"none","stages_completed":0,"total_stages":7,"recommendation":"Run /hivefiver-start to initialize pipeline"}
EOF
    else
      PIPELINE_ACTIVE=$(cat "$BRAIN" | grep -o '"pipeline_active":[^,}]*' | head -1 | sed 's/.*://' | tr -d ' "' || echo "false")
      CURRENT_STAGE=$(cat "$BRAIN" | grep -o '"current_stage":"[^"]*"' | head -1 | sed 's/.*:"\(.*\)"/\1/' || echo "none")
      PIPELINE_ERROR=$(cat "$BRAIN" | grep -o '"pipeline_error":"[^"]*"' | head -1 | sed 's/.*:"\(.*\)"/\1/' || echo "")
      
      HEALTH="healthy"
      [ -n "$PIPELINE_ERROR" ] && HEALTH="error"
      
      cat <<EOF
{"pipeline_active":${PIPELINE_ACTIVE},"pipeline_health":"${HEALTH}","current_stage":"${CURRENT_STAGE}","pipeline_error":"${PIPELINE_ERROR}","sequence":"${STAGES_BUILD}"}
EOF
    fi
    ;;
  sequence)
    INTENT="${WORKDIR}"  # Second arg becomes intent when action=sequence
    case "$INTENT" in
      build_new)    echo "{\"sequence\":\"${STAGES_BUILD}\",\"total_stages\":7}" ;;
      fix_broken)   echo "{\"sequence\":\"${STAGES_FIX}\",\"total_stages\":4}" ;;
      audit_health) echo "{\"sequence\":\"${STAGES_AUDIT}\",\"total_stages\":2}" ;;
      extend)       echo "{\"sequence\":\"${STAGES_EXTEND}\",\"total_stages\":5}" ;;
      learn)        echo "{\"sequence\":\"${STAGES_LEARN}\",\"total_stages\":2}" ;;
      *)            echo "{\"sequence\":\"${STAGES_BUILD}\",\"total_stages\":7,\"note\":\"defaulting to full pipeline for unknown intent: ${INTENT}\"}" ;;
    esac
    ;;
  *)
    echo "{\"error\":\"Unknown action: ${ACTION}\",\"valid_actions\":[\"status\",\"sequence\"]}"
    exit 1
    ;;
esac
