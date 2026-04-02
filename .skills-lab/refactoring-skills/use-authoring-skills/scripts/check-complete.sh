#!/bin/bash
# check-complete.sh — Verify all phases in task_plan.md are complete
# Usage: ./scripts/check-complete.sh [path-to-task-plan]
# Always exits 0 — uses stdout for status reporting

PLAN_FILE="${1:-.skills-lab/task_plan.md}"

if [ ! -f "$PLAN_FILE" ]; then
    echo "[use-authoring-skills] No task_plan.md found — no active planning session."
    exit 0
fi

TOTAL=$(grep -c "### Phase\|## Phases" "$PLAN_FILE" || true)

COMPLETE=$(grep -c "\[x\]" "$PLAN_FILE" || true)
IN_PROGRESS=$(grep -c "\[~\]" "$PLAN_FILE" || true)
PENDING=$(grep -c "\[ \]" "$PLAN_FILE" || true)

: "${TOTAL:=0}"
: "${COMPLETE:=0}"
: "${IN_PROGRESS:=0}"
: "${PENDING:=0}"

if [ "$COMPLETE" -gt 0 ] && [ "$PENDING" -eq 0 ] && [ "$IN_PROGRESS" -eq 0 ]; then
    echo "[use-authoring-skills] ALL PHASES COMPLETE ($COMPLETE items checked). Skill pack is ready for delivery."
else
    echo "[use-authoring-skills] Task in progress ($COMPLETE/$((COMPLETE + PENDING + IN_PROGRESS)) items done)."
    if [ "$IN_PROGRESS" -gt 0 ]; then
        echo "[use-authoring-skills] $IN_PROGRESS item(s) still in progress — finish before proceeding."
    fi
    if [ "$PENDING" -gt 0 ]; then
        echo "[use-authoring-skills] $PENDING item(s) pending."
    fi
fi
exit 0
