#!/usr/bin/env bash
# loop-status.sh — Reports current loop phase and progress
# Usage: ./loop-status.sh [session-name]
#
# Output:
#   Current phase, gate status, child agent status, and next action
#
# Exit codes:
#   0 — Status reported successfully
#   1 — No session found

set -euo pipefail

COORD_DIR="${COORD_DIR:-.coordination}"
SESSION="${1:-}"

# Find session directory
if [[ -z "$SESSION" ]]; then
  SESSION=$(ls -1 "$COORD_DIR" 2>/dev/null | sort -r | head -1)
  if [[ -z "$SESSION" ]]; then
    echo "[loop-status] ERROR: No sessions found in $COORD_DIR"
    exit 1
  fi
fi

SESSION_DIR="$COORD_DIR/$SESSION"

if [[ ! -d "$SESSION_DIR" ]]; then
  echo "[loop-status] ERROR: Session not found: $SESSION_DIR"
  exit 1
fi

echo "========================================"
echo "  Coordination Loop Status"
echo "  Session: $SESSION"
echo "========================================"
echo ""

# Current phase
if [[ -f "$SESSION_DIR/task_plan.md" ]]; then
  CURRENT_PHASE=$(grep "Current Phase:" "$SESSION_DIR/task_plan.md" | head -1 | sed 's/.*Current Phase: //')
  echo "Phase: ${CURRENT_PHASE:-<not set>}"
  echo ""

  # Goals
  echo "Goals:"
  sed -n '/## Goals:/,/## /p' "$SESSION_DIR/task_plan.md" | grep -v "## " | sed 's/^/  /'
  echo ""

  # Blockers
  BLOCKERS=$(sed -n '/## Blockers:/,/## /p' "$SESSION_DIR/task_plan.md" | grep -v "## " | grep -v "^$")
  if [[ -n "$BLOCKERS" ]]; then
    echo "Blockers:"
    echo "$BLOCKERS" | sed 's/^/  /'
    echo ""
  fi
fi

# Gate status
echo "Gate Status:"
PHASES=("ASSESS" "DISPATCH" "MONITOR" "INTEGRATE" "VERIFY")
for phase in "${PHASES[@]}"; do
  if [[ -f "$SESSION_DIR/progress.md" ]]; then
    if grep -qi "$phase.*complete\|$phase.*passed\|$phase.*done" "$SESSION_DIR/progress.md" 2>/dev/null; then
      STATUS="✓ passed"
    elif grep -qi "$phase.*fail\|$phase.*error" "$SESSION_DIR/progress.md" 2>/dev/null; then
      STATUS="✗ failed"
    elif [[ "$phase" == "$CURRENT_PHASE" ]]; then
      STATUS="→ in progress"
    else
      STATUS="○ pending"
    fi
  else
    STATUS="○ pending"
  fi
  printf "  %-12s %s\n" "$phase" "$STATUS"
done
echo ""

# Child agents
if [[ -d "$SESSION_DIR/children" ]]; then
  CHILD_COUNT=$(ls -1 "$SESSION_DIR/children" 2>/dev/null | wc -l | tr -d '[:space:]')
  echo "Child Agents: $CHILD_COUNT"
  for child_dir in "$SESSION_DIR/children"/*/; do
    child_name=$(basename "$child_dir")
    if [[ -f "$child_dir/result.md" || -f "$child_dir/summary.md" ]]; then
      child_status="complete"
    else
      child_status="running"
    fi
    printf "  %-20s %s\n" "$child_name" "$child_status"
  done
  echo ""
fi

# Next action
echo "Next Action:"
case "$CURRENT_PHASE" in
  ASSESS)
    echo "  Identify all tasks and group by independence"
    echo "  Run: ./coordination-check.sh $SESSION"
    ;;
  DISPATCH)
    echo "  Dispatch child agents with focused task envelopes"
    echo "  See: references/01-handoff-protocols.md"
    ;;
  MONITOR)
    echo "  Check child agent progress at defined gates"
    echo "  Run: ./coordination-check.sh $SESSION"
    ;;
  INTEGRATE)
    echo "  Merge child results, check for conflicts"
    echo "  Run full validation suite"
    ;;
  VERIFY)
    echo "  Run acceptance criteria checks"
    echo "  If all pass → loop complete"
    echo "  If any fail → loop back to originating phase"
    ;;
  *)
    echo "  Initialize session with: ./init-session.sh <name>"
    ;;
esac
echo ""
echo "========================================"
