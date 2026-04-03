#!/usr/bin/env bash
# check-complete.sh — Verify phase completion with content checks
# Usage: bash check-complete.sh [path-to-task_plan.md]
# Always exits 0 — uses stdout for status reporting

PLAN_FILE="${1:-task_plan.md}"

if [ ! -f "$PLAN_FILE" ]; then
    echo "[planning-with-files] No task_plan.md found — no active planning session."
    exit 0
fi

# Count total phases (### Phase headers)
TOTAL=$(grep -c "^### Phase" "$PLAN_FILE" || true)

if [ "$TOTAL" -eq 0 ]; then
    echo "[planning-with-files] No phases defined in task_plan.md."
    exit 0
fi

# Count phases with **Status:** complete
COMPLETE=$(grep -cF "**Status:** complete" "$PLAN_FILE" || true)

# Count phases with **Status:** in_progress
IN_PROGRESS=$(grep -cF "**Status:** in_progress" "$PLAN_FILE" || true)

# Count phases with **Status:** pending
PENDING=$(grep -cF "**Status:** pending" "$PLAN_FILE" || true)

# Content verification: check that complete phases have at least one checked checkbox
COMPLETE_WITH_CONTENT=0
while IFS= read -r phase_line; do
    phase_num=$(echo "$phase_line" | grep -oP 'Phase \K[0-9]+')
    if [ -n "$phase_num" ]; then
        # Extract the phase block (from this ### Phase to the next ### or end)
        phase_block=$(awk "/^### Phase ${phase_num}:/,/^### Phase |^\$/" "$PLAN_FILE")
        checked=$(echo "$phase_block" | grep -c "^\- \[x\]" || true)
        if [ "$checked" -gt 0 ]; then
            COMPLETE_WITH_CONTENT=$((COMPLETE_WITH_CONTENT + 1))
        fi
    fi
done < <(grep "^### Phase" "$PLAN_FILE")

# Default to 0 if empty
: "${TOTAL:=0}"
: "${COMPLETE:=0}"
: "${IN_PROGRESS:=0}"
: "${PENDING:=0}"

# Report status
if [ "$COMPLETE" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    if [ "$COMPLETE_WITH_CONTENT" -eq "$TOTAL" ]; then
        echo "[planning-with-files] ALL PHASES COMPLETE ($COMPLETE/$TOTAL). All phases have checked items."
    else
        echo "[planning-with-files] ALL PHASES MARKED COMPLETE ($COMPLETE/$TOTAL), but only $COMPLETE_WITH_CONTENT have checked items. Verify work is actually done."
    fi
    echo "[planning-with-files] If the user has additional work, add new phases to task_plan.md before starting."
else
    echo "[planning-with-files] Task in progress ($COMPLETE/$TOTAL phases complete). Update progress.md before stopping."
    if [ "$IN_PROGRESS" -gt 0 ]; then
        echo "[planning-with-files] $IN_PROGRESS phase(s) still in progress."
    fi
    if [ "$PENDING" -gt 0 ]; then
        echo "[planning-with-files] $PENDING phase(s) pending."
    fi
fi

exit 0
