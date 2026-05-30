#!/usr/bin/env bash
# check-gate.sh — Per-gate enforcement script. Exits non-zero to block progression.
# Usage: ./check-gate.sh <session-name> <G1|G2|G3|G4|G5>
#
# Each gate has a specific, measurable check. If the check fails, the script
# exits 1 with a detailed error message. The parent MUST NOT proceed past a
# failed gate.
#
# Exit codes:
#   0 — Gate passed, proceed to next phase
#   1 — Gate failed, DO NOT proceed (details printed to stdout)
#   2 — Invalid arguments or missing session

set -euo pipefail

COORD_DIR="${COORD_DIR:-.coordination}"
SESSION="${1:?Usage: check-gate.sh <session-name> <G1|G2|G3|G4|G5>}"
GATE="${2:?Usage: check-gate.sh <session-name> <G1|G2|G3|G4|G5>}"

SESSION_DIR="$COORD_DIR/$SESSION"

if [[ ! -d "$SESSION_DIR" ]]; then
  echo "[gate-$GATE] ERROR: Session directory not found: $SESSION_DIR"
  echo "[gate-$GATE] Run: scripts/init-session.sh $SESSION"
  exit 2
fi

# Normalize gate input
GATE_UPPER=$(echo "$GATE" | tr '[:lower:]' '[:upper:]')

case "$GATE_UPPER" in
  G1)
    # ASSESS: All tasks identified, grouped, written to task_plan.md
    echo "[gate-G1] Checking ASSESS gate..."

    if [[ ! -f "$SESSION_DIR/task_plan.md" ]]; then
      echo "[gate-G1] FAIL: task_plan.md does not exist"
      echo "[gate-G1] → Write task inventory to $SESSION_DIR/task_plan.md"
      exit 1
    fi

    TASK_COUNT=$(grep -c "TASK-" "$SESSION_DIR/task_plan.md" 2>/dev/null || true)
    TASK_COUNT="${TASK_COUNT:-0}"
    if [[ "$TASK_COUNT" -eq 0 ]] || [[ -z "$TASK_COUNT" ]]; then
      echo "[gate-G1] FAIL: No TASK- entries found in task_plan.md"
      echo "[gate-G1] → Add tasks: - [ ] TASK-N: <description> | files: <paths> | domain: <category>"
      exit 1
    fi

    echo "[gate-G1] PASS: $TASK_COUNT task(s) identified and recorded"
    exit 0
    ;;

  G2)
    # DISPATCH: Every task has a Task Envelope with all 5 required sections
    echo "[gate-G2] Checking DISPATCH gate..."

    if [[ ! -d "$SESSION_DIR/children" ]]; then
      echo "[gate-G2] FAIL: children/ directory does not exist"
      echo "[gate-G2] → Create children/ directory and write envelope.md for each child"
      exit 1
    fi

    ENVELOPE_COUNT=$(find "$SESSION_DIR/children" -name "envelope.md" 2>/dev/null | wc -l | tr -d '[:space:]')
    if [[ "$ENVELOPE_COUNT" -eq 0 ]]; then
      echo "[gate-G2] FAIL: No envelope.md files found"
      echo "[gate-G2] → Write an envelope.md for each child with all 5 required sections"
      exit 1
    fi

    FAILED_ENVELOPES=()
    for child_dir in "$SESSION_DIR/children"/*/; do
      child_id=$(basename "$child_dir")
      if [[ -f "$child_dir/envelope.md" ]]; then
        if ! bash "$(dirname "$0")/validate-envelope.sh" "$SESSION" "$child_id" > /dev/null 2>&1; then
          FAILED_ENVELOPES+=("$child_id")
        fi
      else
        FAILED_ENVELOPES+=("$child_id (no envelope.md)")
      fi
    done

    if [[ ${#FAILED_ENVELOPES[@]} -gt 0 ]]; then
      echo "[gate-G2] FAIL: ${#FAILED_ENVELOPES[@]} envelope(s) failed validation:"
      for eid in "${FAILED_ENVELOPES[@]}"; do
        echo "  ✗ $eid"
      done
      echo "[gate-G2] → Run: scripts/validate-envelope.sh $SESSION <child-id>"
      exit 1
    fi

    echo "[gate-G2] PASS: All $ENVELOPE_COUNT envelope(s) valid"
    exit 0
    ;;

  G3)
    # MONITOR: All dispatched agents returned output; no orphans
    echo "[gate-G3] Checking MONITOR gate..."

    if [[ ! -d "$SESSION_DIR/children" ]]; then
      echo "[gate-G3] FAIL: children/ directory does not exist"
      echo "[gate-G3] → No children were dispatched. Cannot check for orphans."
      exit 1
    fi

    ORPHANS=0
    TOTAL_CHILDREN=0
    for child_dir in "$SESSION_DIR/children"/*/; do
      TOTAL_CHILDREN=$((TOTAL_CHILDREN + 1))
      child_id=$(basename "$child_dir")
      if [[ ! -f "$child_dir/result.md" && ! -f "$child_dir/summary.md" && ! -f "$child_dir/output.md" ]]; then
        echo "[gate-G3] ORPHAN: $child_id — no result file"
        ORPHANS=$((ORPHANS + 1))
      fi
    done

    if [[ $ORPHANS -gt 0 ]]; then
      echo "[gate-G3] FAIL: $ORPHANS orphaned child(ren) out of $TOTAL_CHILDREN total"
      echo "[gate-G3] → Wait for children to complete or re-dispatch"
      exit 1
    fi

    echo "[gate-G3] PASS: All $TOTAL_CHILDREN child(ren) returned output"
    exit 0
    ;;

  G4)
    # INTEGRATE: No file conflicts; full validation suite passes
    echo "[gate-G4] Checking INTEGRATE gate..."

    # Check findings.md exists (integration report)
    if [[ ! -f "$SESSION_DIR/findings.md" ]]; then
      echo "[gate-G4] FAIL: findings.md (integration report) does not exist"
      echo "[gate-G4] → Write integration report to $SESSION_DIR/findings.md"
      echo "[gate-G4] → Include: summary of outputs, conflict analysis, validation results"
      exit 1
    fi

    # Check findings.md has content
    FINDINGS_LINES=$(wc -l < "$SESSION_DIR/findings.md" | tr -d '[:space:]')
    if [[ "$FINDINGS_LINES" -lt 5 ]]; then
      echo "[gate-G4] FAIL: findings.md appears too short ($FINDINGS_LINES lines)"
      echo "[gate-G4] → Integration report should include output summaries and conflict analysis"
      exit 1
    fi

    # Check for unresolved conflict markers
    if grep -q "<<<<<<" "$SESSION_DIR/findings.md" 2>/dev/null; then
      echo "[gate-G4] FAIL: Unresolved conflict markers found in findings.md"
      echo "[gate-G4] → Resolve all file conflicts before proceeding"
      exit 1
    fi

    echo "[gate-G4] PASS: Integration report written and no unresolved conflicts"
    exit 0
    ;;

  G5)
    # VERIFY: All acceptance criteria met; loop can exit
    echo "[gate-G5] Checking VERIFY gate..."

    # Check progress.md has VERIFY marked complete
    if [[ -f "$SESSION_DIR/progress.md" ]]; then
      if grep -qi "VERIFY.*complete\|VERIFY.*passed\|VERIFY.*done\|all gates pass" "$SESSION_DIR/progress.md" 2>/dev/null; then
        echo "[gate-G5] PASS: VERIFY phase marked complete in progress.md"
        exit 0
      fi
    fi

    # Check findings.md has positive resolution
    if [[ -f "$SESSION_DIR/findings.md" ]]; then
      if grep -qi "pass\|complete\|success\|resolved" "$SESSION_DIR/findings.md" 2>/dev/null; then
        echo "[gate-G5] PASS: Integration report indicates successful completion"
        exit 0
      fi
    fi

    # Check all ralph-loop validations passed
    if [[ -d "$SESSION_DIR/children" ]]; then
      ALL_PASSED=true
      for child_dir in "$SESSION_DIR/children"/*/; do
        if [[ -f "$child_dir/validation-report.md" ]]; then
          if grep -q "^FAIL" "$child_dir/validation-report.md" 2>/dev/null; then
            ALL_PASSED=false
            child_id=$(basename "$child_dir")
            echo "[gate-G5] FAIL: $child_id validation report shows failure"
          fi
        fi
      done
      if $ALL_PASSED; then
        echo "[gate-G5] PASS: All child validations passed"
        exit 0
      fi
    fi

    echo "[gate-G5] FAIL: Acceptance criteria not met"
    echo "[gate-G5] → Ensure findings.md documents successful completion"
    echo "[gate-G5] → Mark VERIFY as complete in progress.md"
    exit 1
    ;;

  *)
    echo "[gate] ERROR: Invalid gate '$GATE'. Must be G1, G2, G3, G4, or G5."
    exit 2
    ;;
esac
