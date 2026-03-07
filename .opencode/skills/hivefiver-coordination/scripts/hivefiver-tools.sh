#!/usr/bin/env bash
# hivefiver-tools.sh — Tool parity checker and utility functions
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash hivefiver-tools.sh parity check '<agent_pattern>'
set -euo pipefail

ACTION="${1:-parity}"
SUBACTION="${2:-check}"
PATTERN="${3:-hiveminder|hivemind}"

case "$ACTION" in
  parity)
    case "$SUBACTION" in
      check)
        # Check if root commands match .opencode commands
        ROOT_COUNT=$(ls commands/*.md 2>/dev/null | wc -l | tr -d ' ')
        MIRROR_COUNT=$(ls .opencode/commands/*.md 2>/dev/null | wc -l | tr -d ' ')
        
        PARITY="synced"
        [ "$ROOT_COUNT" != "$MIRROR_COUNT" ] && PARITY="diverged"
        
        cat <<EOF
{"action":"parity_check","root_commands":${ROOT_COUNT},"mirror_commands":${MIRROR_COUNT},"status":"${PARITY}","pattern":"${PATTERN}"}
EOF
        ;;
      *)
        echo "{\"error\":\"Unknown parity subaction: ${SUBACTION}\"}"
        exit 1
        ;;
    esac
    ;;
  *)
    echo "{\"error\":\"Unknown action: ${ACTION}\",\"valid_actions\":[\"parity\"]}"
    exit 1
    ;;
esac
