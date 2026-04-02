#!/usr/bin/env bash
# coordination-check.sh — Validates coordination state and gate passage
# Usage: ./coordination-check.sh [session-name]
#
# Checks:
#   1. Session directory exists
#   2. Required files present (task_plan.md, findings.md, progress.md)
#   3. Current phase is valid
#   4. All gates for completed phases passed
#   5. No orphaned child agents (dispatched but no result)
#
# Exit codes:
#   0 — All checks passed
#   1 — One or more checks failed

set -euo pipefail

COORD_DIR="${COORD_DIR:-.coordination}"
SESSION="${1:-}"

# Find session directory
if [[ -z "$SESSION" ]]; then
  # Use most recent session
  SESSION=$(ls -1 "$COORD_DIR" 2>/dev/null | sort -r | head -1)
  if [[ -z "$SESSION" ]]; then
    echo "[coordination-check] ERROR: No sessions found in $COORD_DIR"
    exit 1
  fi
  echo "[coordination-check] Using most recent session: $SESSION"
fi

SESSION_DIR="$COORD_DIR/$SESSION"
ERRORS=0

# Check 1: Session directory exists
if [[ ! -d "$SESSION_DIR" ]]; then
  echo "[coordination-check] FAIL: Session directory not found: $SESSION_DIR"
  exit 1
fi
echo "[coordination-check] OK: Session directory exists"

# Check 2: Required files present
for file in task_plan.md findings.md progress.md; do
  if [[ ! -f "$SESSION_DIR/$file" ]]; then
    echo "[coordination-check] FAIL: Missing required file: $file"
    ERRORS=$((ERRORS + 1))
  else
    echo "[coordination-check] OK: $file exists"
  fi
done

# Check 3: Current phase is valid
if [[ -f "$SESSION_DIR/task_plan.md" ]]; then
  CURRENT_PHASE=$(grep "Current Phase:" "$SESSION_DIR/task_plan.md" | head -1 | sed 's/.*Current Phase: //' | tr -d '[:space:]')
  VALID_PHASES="ASSESS DISPATCH MONITOR INTEGRATE VERIFY"
  if [[ -n "$CURRENT_PHASE" ]] && echo "$VALID_PHASES" | grep -qw "$CURRENT_PHASE"; then
    echo "[coordination-check] OK: Current phase is $CURRENT_PHASE"
  else
    echo "[coordination-check] FAIL: Invalid or missing phase: '${CURRENT_PHASE:-<empty>}'"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check 4: Gate consistency
if [[ -f "$SESSION_DIR/task_plan.md" ]]; then
  PHASE_ORDER=(ASSESS DISPATCH MONITOR INTEGRATE VERIFY)
  CURRENT_IDX=0
  for i in "${!PHASE_ORDER[@]}"; do
    if [[ "${PHASE_ORDER[$i]}" == "$CURRENT_PHASE" ]]; then
      CURRENT_IDX=$i
      break
    fi
  done

  # All phases before current should be marked complete
  for ((i=0; i<CURRENT_IDX; i++)); do
    phase="${PHASE_ORDER[$i]}"
    if ! grep -qi "$phase.*complete\|$phase.*passed\|$phase.*done" "$SESSION_DIR/progress.md" 2>/dev/null; then
      echo "[coordination-check] WARN: Phase $phase may not be complete (no record in progress.md)"
    fi
  done
fi

# Check 5: No orphaned children
if [[ -d "$SESSION_DIR/children" ]]; then
  ORPHANS=0
  for child_dir in "$SESSION_DIR/children"/*/; do
    if [[ ! -f "$child_dir/result.md" && ! -f "$child_dir/summary.md" ]]; then
      echo "[coordination-check] WARN: Orphaned child: $(basename "$child_dir") — no result file"
      ORPHANS=$((ORPHANS + 1))
    fi
  done
  if [[ $ORPHANS -eq 0 ]]; then
    echo "[coordination-check] OK: No orphaned children"
  else
    echo "[coordination-check] WARN: $ORPHANS orphaned child(ren) found"
  fi
fi

# Summary
echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "[coordination-check] All checks passed ✓"
  exit 0
else
  echo "[coordination-check] $ERRORS check(s) failed ✗"
  exit 1
fi
