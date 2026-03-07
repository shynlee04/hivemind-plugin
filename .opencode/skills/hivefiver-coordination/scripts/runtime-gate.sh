#!/usr/bin/env bash
# runtime-gate.sh — Pre/post-turn enforcement gate
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash runtime-gate.sh <pre-turn|post-turn> <workdir>
set -euo pipefail

PHASE="${1:-pre-turn}"
WORKDIR="${2:-.}"
STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

case "$PHASE" in
  pre-turn)
    # Pre-turn checks: state exists, pipeline health, context freshness
    CHECKS_PASSED=0
    CHECKS_TOTAL=3
    WARNINGS=""

    # Check 1: State directory exists
    if [ -d "$STATE_DIR" ]; then
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      WARNINGS="${WARNINGS}no_state_dir,"
    fi

    # Check 2: brain.json exists and readable
    if [ -f "$BRAIN" ] && [ -r "$BRAIN" ]; then
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      WARNINGS="${WARNINGS}no_brain_state,"
    fi

    # Check 3: hierarchy.json exists
    if [ -f "${STATE_DIR}/hierarchy.json" ]; then
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      WARNINGS="${WARNINGS}no_hierarchy,"
    fi

    # Remove trailing comma
    WARNINGS=$(echo "$WARNINGS" | sed 's/,$//')

    GATE="pass"
    [ $CHECKS_PASSED -lt 2 ] && GATE="warn"
    [ $CHECKS_PASSED -eq 0 ] && GATE="fail"

    cat <<EOF
{"gate":"${GATE}","phase":"pre-turn","checks_passed":${CHECKS_PASSED},"checks_total":${CHECKS_TOTAL},"warnings":"${WARNINGS}","timestamp":"${TIMESTAMP}"}
EOF
    ;;
  post-turn)
    # Post-turn: verify state wasn't corrupted
    INTEGRITY="ok"
    if [ -f "$BRAIN" ]; then
      # Basic JSON validity check
      if ! cat "$BRAIN" | python3 -m json.tool > /dev/null 2>&1; then
        INTEGRITY="corrupted"
      fi
    fi

    cat <<EOF
{"gate":"pass","phase":"post-turn","state_integrity":"${INTEGRITY}","timestamp":"${TIMESTAMP}"}
EOF
    ;;
  *)
    echo "{\"error\":\"Unknown phase: ${PHASE}\",\"valid_phases\":[\"pre-turn\",\"post-turn\"]}"
    exit 1
    ;;
esac
