#!/usr/bin/env bash
# gate-check.sh — Verify prerequisites for a specific pipeline stage
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash gate-check.sh <stage> <workdir>
set -euo pipefail

STAGE="${1:-start}"
WORKDIR="${2:-.}"
STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"

GATE="pass"
BLOCKERS=""

case "$STAGE" in
  start)
    # Start has no prerequisites
    GATE="pass"
    ;;
  discovery)
    # Requires: start completed
    if [ ! -f "$BRAIN" ]; then
      GATE="fail"
      BLOCKERS="no_state:run_start_first"
    fi
    ;;
  intake)
    # Requires: discovery completed
    if [ ! -f "$BRAIN" ]; then
      GATE="fail"
      BLOCKERS="no_state"
    fi
    ;;
  spec)
    # Requires: intake completed (requirements gathered)
    if [ ! -f "$BRAIN" ]; then
      GATE="fail"
      BLOCKERS="no_state"
    fi
    ;;
  architect)
    # Requires: spec completed
    if [ ! -f "$BRAIN" ]; then
      GATE="fail"
      BLOCKERS="no_state"
    fi
    ;;
  build)
    # Requires: architect completed (design ready)
    if [ ! -f "$BRAIN" ]; then
      GATE="fail"
      BLOCKERS="no_state"
    fi
    ;;
  audit)
    # Audit can run anytime but prefers build complete
    GATE="pass"
    ;;
  doctor)
    # Doctor can always run
    GATE="pass"
    ;;
  *)
    GATE="warn"
    BLOCKERS="unknown_stage:${STAGE}"
    ;;
esac

cat <<EOF
{"gate":"${GATE}","stage":"${STAGE}","blockers":"${BLOCKERS}"}
EOF
