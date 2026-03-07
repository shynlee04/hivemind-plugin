#!/usr/bin/env bash
# plan-materialize.sh — Materialize a plan from spec into delegation targets
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash plan-materialize.sh spawn <arguments> --workdir <workdir>
set -euo pipefail

ACTION="${1:-spawn}"
ARGUMENTS="${2:-}"
WORKDIR="."

# Parse --workdir
for i in "$@"; do
  case "$i" in
    --workdir) shift; WORKDIR="${1:-.}" ;;
  esac
  shift 2>/dev/null || true
done

STATE_DIR="${WORKDIR}/.hivemind/state"
PLANS_DIR="${WORKDIR}/.hivemind/plans"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

case "$ACTION" in
  spawn)
    # Check if plans directory has any plans
    PLAN_COUNT=0
    if [ -d "$PLANS_DIR" ]; then
      PLAN_COUNT=$(find "$PLANS_DIR" -name "*.json" -o -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    fi

    cat <<EOF
{"action":"spawn","plans_found":${PLAN_COUNT},"arguments":"$(echo "$ARGUMENTS" | sed 's/"/\\"/g')","timestamp":"${TIMESTAMP}"}
EOF
    ;;
  *)
    echo "{\"error\":\"Unknown action: ${ACTION}\",\"valid_actions\":[\"spawn\"]}"
    exit 1
    ;;
esac
