#!/bin/bash
# stop.sh — Check if all phases are complete before stopping
# Hook: Runs when agent tries to stop — auto-continues if phases incomplete
# Always exits 0 — uses stdout for status

PLAN_FILE="task_plan.md"

if [ ! -f "$PLAN_FILE" ]; then
    exit 0
fi

TOTAL=$(grep -c "### Phase" "$PLAN_FILE" || true)
COMPLETE=$(grep -c "\[x\]" "$PLAN_FILE" || true)
IN_PROGRESS=$(grep -c "\[~\]" "$PLAN_FILE" || true)
PENDING=$(grep -c "\[ \]" "$PLAN_FILE" || true)

: "${TOTAL:=0}"
: "${COMPLETE:=0}"

if [ "$COMPLETE" -gt 0 ] && [ "$PENDING" -eq 0 ] && [ "$IN_PROGRESS" -eq 0 ]; then
    echo "[use-authoring-skills] ALL PHASES COMPLETE. Ready for delivery."
    exit 0
fi

echo "[use-authoring-skills] Task in progress ($COMPLETE items done). Update progress.md before stopping."
if [ "$IN_PROGRESS" -gt 0 ]; then
    echo "[use-authoring-skills] $IN_PROGRESS item(s) still in progress."
fi
if [ "$PENDING" -gt 0 ]; then
    echo "[use-authoring-skills] $PENDING item(s) pending."
fi
exit 0
