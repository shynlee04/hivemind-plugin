#!/usr/bin/env bash
# hivefiver-must-pack.sh — Unified obligation checker for each stage
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash hivefiver-must-pack.sh <stage> "<arguments>" <workdir>
set -euo pipefail

STAGE="${1:-router}"
ARGUMENTS="${2:-}"
WORKDIR="${3:-.}"
STATE_DIR="${WORKDIR}/.hivemind/state"
BRAIN="${STATE_DIR}/brain.json"

# Define obligations per stage
case "$STAGE" in
  router)
    OBLIGATIONS='["read_state","classify_intent","check_pipeline"]'
    ;;
  start)
    OBLIGATIONS='["initialize_state","declare_intent","brownfield_scan"]'
    ;;
  discovery)
    OBLIGATIONS='["brainstorm_questions","capture_pain_points","validate_scope"]'
    ;;
  intake)
    OBLIGATIONS='["gather_requirements","structured_qa","priority_sort"]'
    ;;
  spec)
    OBLIGATIONS='["distill_requirements","resolve_ambiguity","confirm_acceptance"]'
    ;;
  architect)
    OBLIGATIONS='["design_topology","define_delegation","validate_constraints"]'
    ;;
  build)
    OBLIGATIONS='["execute_plan","run_tests","verify_output"]'
    ;;
  audit)
    OBLIGATIONS='["health_check","regression_scan","coverage_report"]'
    ;;
  doctor)
    OBLIGATIONS='["diagnose_error","identify_root_cause","propose_fix"]'
    ;;
  continue)
    OBLIGATIONS='["check_context_limit","prepare_handoff","export_state"]'
    ;;
  *)
    OBLIGATIONS='["unknown_stage"]'
    ;;
esac

# Check state availability
STATE_AVAILABLE=false
[ -f "$BRAIN" ] && STATE_AVAILABLE=true

cat <<EOF
{"stage":"${STAGE}","obligations":${OBLIGATIONS},"state_available":${STATE_AVAILABLE},"arguments":"$(echo "$ARGUMENTS" | sed 's/"/\\"/g')"}
EOF
