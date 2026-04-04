#!/usr/bin/env bash
# check-complete.sh — Verify phase completion with deep content checks
# Usage: bash check-complete.sh [path-to-task_plan.md]
# Exit codes: 0 = all complete, 1 = incomplete phases, 2 = no plan found

PLAN_FILE="${1:-task_plan.md}"

if [ ! -f "$PLAN_FILE" ]; then
    echo "[planning-with-files] No task_plan.md found — no active planning session."
    exit 2
fi

# Count total phases (### Phase headers)
TOTAL=$(grep -c "^### Phase" "$PLAN_FILE" || true)

if [ "$TOTAL" -eq 0 ]; then
    echo "[planning-with-files] No phases defined in task_plan.md."
    exit 2
fi

# Count phases by status
COMPLETE=$(grep -cF "**Status:** complete" "$PLAN_FILE" || true)
IN_PROGRESS=$(grep -cF "**Status:** in_progress" "$PLAN_FILE" || true)
PENDING=$(grep -cF "**Status:** pending" "$PLAN_FILE" || true)

# Deep content verification: check that complete phases have checked checkboxes
COMPLETE_WITH_CONTENT=0
INCOMPLETE_MARKED_COMPLETE=0
PHASES_WITH_UNCHECKED=0

while IFS= read -r phase_line; do
    phase_title=$(echo "$phase_line" | sed 's/^### //')
    
    # Extract the phase block (from this ### Phase to the next ### or ## or end)
    # Use sed to drop the last line (which matches the next header) — cross-platform compatible
    phase_block=$(awk "/^### Phase/,/^### |^## /" "$PLAN_FILE" | sed '$d')
    if [ -z "$phase_block" ]; then
        phase_block="$phase_line"
    fi
    
    # Check status
    is_complete=$(echo "$phase_block" | grep -cF "**Status:** complete" || true)
    
    # Check for checked checkboxes
    checked=$(echo "$phase_block" | grep -c "^\- \[x\]" || true)
    unchecked=$(echo "$phase_block" | grep -c "^\- \[ \]" || true)
    
    if [ "$is_complete" -gt 0 ]; then
        if [ "$checked" -gt 0 ]; then
            COMPLETE_WITH_CONTENT=$((COMPLETE_WITH_CONTENT + 1))
            echo "[planning-with-files] ✓ $phase_title — complete with $checked checked item(s)"
        else
            INCOMPLETE_MARKED_COMPLETE=$((INCOMPLETE_MARKED_COMPLETE + 1))
            echo "[planning-with-files] ⚠ $phase_title — marked complete but NO checked items"
        fi
    elif [ "$unchecked" -gt 0 ]; then
        PHASES_WITH_UNCHECKED=$((PHASES_WITH_UNCHECKED + 1))
        echo "[planning-with-files] ○ $phase_title — $unchecked unchecked item(s) remaining"
    fi
done < <(grep "^### Phase" "$PLAN_FILE")

# Validate Goal section exists and is not a placeholder
if grep -qF "<One sentence" "$PLAN_FILE" || grep -qF "<Brief Description" "$PLAN_FILE"; then
    echo "[planning-with-files] ⚠ Goal section still contains placeholder text — must be filled"
fi

# Check if Errors Encountered table has entries (indicates real work was done)
ERROR_ENTRIES=$(grep -c "^\|.*|" "$PLAN_FILE" 2>/dev/null || true)

# Default to 0 if empty
: "${TOTAL:=0}"
: "${COMPLETE:=0}"
: "${IN_PROGRESS:=0}"
: "${PENDING:=0}"

# Summary
echo ""
echo "[planning-with-files] === Phase Summary ==="
echo "[planning-with-files] Total: $TOTAL | Complete: $COMPLETE | In Progress: $IN_PROGRESS | Pending: $PENDING"
echo "[planning-with-files] Complete with content: $COMPLETE_WITH_CONTENT/$TOTAL"

if [ "$INCOMPLETE_MARKED_COMPLETE" -gt 0 ]; then
    echo "[planning-with-files] WARNING: $INCOMPLETE_MARKED_COMPLETE phase(s) marked complete without checked items"
fi

# Final verdict
if [ "$COMPLETE" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    if [ "$COMPLETE_WITH_CONTENT" -eq "$TOTAL" ]; then
        echo "[planning-with-files] ALL PHASES COMPLETE ($COMPLETE/$TOTAL). All phases have checked items."
        exit 0
    else
        echo "[planning-with-files] ALL PHASES MARKED COMPLETE ($COMPLETE/$TOTAL), but only $COMPLETE_WITH_CONTENT have checked items."
        echo "[planning-with-files] ACTION: Verify work is actually done. Check checkboxes for each phase."
        exit 1
    fi
else
    echo "[planning-with-files] Task in progress ($COMPLETE/$TOTAL phases complete)."
    if [ "$IN_PROGRESS" -gt 0 ]; then
        echo "[planning-with-files] $IN_PROGRESS phase(s) still in progress."
    fi
    if [ "$PENDING" -gt 0 ]; then
        echo "[planning-with-files] $PENDING phase(s) pending."
    fi
    echo "[planning-with-files] ACTION: Update progress.md before stopping. Complete remaining phases or mark as abandoned."
    exit 1
fi
