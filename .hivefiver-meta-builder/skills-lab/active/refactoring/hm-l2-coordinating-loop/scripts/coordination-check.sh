#!/usr/bin/env bash
# coordination-check.sh — Pre-dispatch validation and session health check
# Usage: ./coordination-check.sh <session-name> [--pre-dispatch]
#
# Pre-dispatch mode (--pre-dispatch): Runs ALL pre-dispatch validations.
#   Blocks (exit 1) if any check fails. Must pass before any child is dispatched.
#
# Normal mode: Validates coordination state and gate passage.
#
# Exit codes:
#   0 — All checks passed
#   1 — One or more checks failed (do NOT dispatch)
#   2 — No session exists (bootstrap guidance printed)

set -euo pipefail

COORD_DIR="${COORD_DIR:-.coordination}"
SESSION="${1:-}"
MODE="${2:-}"

# --- Bootstrap Mode ---
if [[ ! -d "$COORD_DIR" ]]; then
  echo "[coordination-check] ERROR: No .coordination/ directory found."
  echo "[coordination-check] Run: scripts/init-session.sh <session-name>"
  exit 2
fi

if [[ -z "$SESSION" ]]; then
  SESSION=$(ls -1 "$COORD_DIR" 2>/dev/null | sort -r | head -1)
  if [[ -z "$SESSION" ]]; then
    echo "[coordination-check] ERROR: No sessions found in $COORD_DIR."
    echo "[coordination-check] Run: scripts/init-session.sh <session-name>"
    exit 2
  fi
fi

SESSION_DIR="$COORD_DIR/$SESSION"
ERRORS=0
WARNINGS=0

if [[ ! -d "$SESSION_DIR" ]]; then
  echo "[coordination-check] ERROR: Session directory not found: $SESSION_DIR"
  exit 1
fi

# ============================================
# PRE-DISPATCH MODE — Must all pass before dispatch
# ============================================
if [[ "$MODE" == "--pre-dispatch" ]]; then
  echo "[coordination-check] Running pre-dispatch validation for session: $SESSION"
  echo "========================================"

  # 1. task_plan.md exists and has tasks
  if [[ ! -f "$SESSION_DIR/task_plan.md" ]]; then
    echo "[PRE-DISPATCH] FAIL: task_plan.md does not exist"
    echo "  → Write task inventory before dispatching any child."
    ERRORS=$((ERRORS + 1))
  elif ! grep -q "TASK-" "$SESSION_DIR/task_plan.md" 2>/dev/null; then
    echo "[PRE-DISPATCH] FAIL: task_plan.md exists but contains no TASK- entries"
    echo "  → Add at least one task entry: - [ ] TASK-N: <description> | files: <paths>"
    ERRORS=$((ERRORS + 1))
  else
    TASK_COUNT=$(grep -c "TASK-" "$SESSION_DIR/task_plan.md" || echo "0")
    echo "[PRE-DISPATCH] OK: task_plan.md has $TASK_COUNT task(s)"
  fi

  # 2. At least one child envelope exists
  if [[ ! -d "$SESSION_DIR/children" ]]; then
    echo "[PRE-DISPATCH] FAIL: children/ directory does not exist"
    echo "  → Create children/ directory and write envelope files before dispatch."
    ERRORS=$((ERRORS + 1))
  else
    ENVELOPE_COUNT=$(find "$SESSION_DIR/children" -name "envelope.md" 2>/dev/null | wc -l | tr -d '[:space:]')
    if [[ "$ENVELOPE_COUNT" -eq 0 ]]; then
      echo "[PRE-DISPATCH] FAIL: No envelope.md files found in children/"
      echo "  → Write an envelope.md for each child before dispatch."
      echo "  → Use: scripts/validate-envelope.sh <session> <child-id>"
      ERRORS=$((ERRORS + 1))
    else
      echo "[PRE-DISPATCH] OK: $ENVELOPE_COUNT envelope(s) found"
    fi
  fi

  # 3. All envelopes pass validation
  if [[ -d "$SESSION_DIR/children" ]]; then
    for child_dir in "$SESSION_DIR/children"/*/; do
      child_id=$(basename "$child_dir")
      if [[ -f "$child_dir/envelope.md" ]]; then
        if ! bash "$(dirname "$0")/validate-envelope.sh" "$SESSION" "$child_id" > /dev/null 2>&1; then
          echo "[PRE-DISPATCH] FAIL: Envelope for $child_id failed validation"
          echo "  → Run: scripts/validate-envelope.sh $SESSION $child_id"
          ERRORS=$((ERRORS + 1))
        else
          echo "[PRE-DISPATCH] OK: Envelope for $child_id is valid"
        fi
      fi
    done
  fi

  # 4. Execution mode decided
  if [[ -f "$SESSION_DIR/task_plan.md" ]]; then
    if grep -qi "sequential\|parallel" "$SESSION_DIR/task_plan.md" 2>/dev/null; then
      echo "[PRE-DISPATCH] OK: Execution mode is set"
    else
      echo "[PRE-DISPATCH] WARN: Execution mode not explicitly recorded in task_plan.md"
      echo "  → Add 'Mode: sequential' or 'Mode: parallel' to task_plan.md"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi

  echo "========================================"
  if [[ $ERRORS -gt 0 ]]; then
    echo "[coordination-check] PRE-DISPATCH BLOCKED: $ERRORS error(s), $WARNINGS warning(s)"
    echo "[coordination-check] DO NOT dispatch any child until all errors are fixed."
    exit 1
  else
    echo "[coordination-check] PRE-DISPATCH PASSED: All checks passed ($WARNINGS warning(s))"
    exit 0
  fi
fi

# ============================================
# NORMAL MODE — Session health check
# ============================================

# Check required files
for file in task_plan.md findings.md progress.md; do
  if [[ ! -f "$SESSION_DIR/$file" ]]; then
    echo "[coordination-check] FAIL: Missing required file: $file"
    ERRORS=$((ERRORS + 1))
  else
    echo "[coordination-check] OK: $file exists"
  fi
done

# Check phase validity
CURRENT_PHASE=""
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

# Check gate consistency
if [[ -f "$SESSION_DIR/task_plan.md" && -n "$CURRENT_PHASE" ]]; then
  PHASE_ORDER=(ASSESS DISPATCH MONITOR INTEGRATE VERIFY)
  CURRENT_IDX=0
  for i in "${!PHASE_ORDER[@]}"; do
    if [[ "${PHASE_ORDER[$i]}" == "$CURRENT_PHASE" ]]; then
      CURRENT_IDX=$i
      break
    fi
  done

  for ((i=0; i<CURRENT_IDX; i++)); do
    phase="${PHASE_ORDER[$i]}"
    if ! grep -qi "$phase.*complete\|$phase.*passed\|$phase.*done" "$SESSION_DIR/progress.md" 2>/dev/null; then
      echo "[coordination-check] WARN: Phase $phase may not be complete (no record in progress.md)"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
fi

# Check orphaned children
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

echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "[coordination-check] All checks passed ($WARNINGS warning(s))"
  exit 0
else
  echo "[coordination-check] $ERRORS check(s) failed"
  exit 1
fi
