#!/usr/bin/env bash
# session-checkpoint.sh — Save current session state to a timestamped file.
#
# Usage: ./scripts/session-checkpoint.sh "checkpoint-name"
#
# Captures:
#   - User intent (from progress.md)
#   - Current phase (from task_plan.md)
#   - Delegation state (from progress.md)
#
# Output: .checkpoints/<timestamp>-<checkpoint-name>.md
#
# Portable: bash 3.2 compatible (macOS default).
# Exit codes: 0 = success, 1 = missing planning files, 2 = invalid arguments.

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
CHECKPOINT_DIR=".checkpoints"
PROGRESS_FILE="progress.md"
TASK_PLAN_FILE="task_plan.md"

# ── Argument Validation ────────────────────────────────────────────────────────
if [ $# -lt 1 ]; then
    echo "Usage: $0 <checkpoint-name>" >&2
    echo "  Saves current session state to a timestamped checkpoint file." >&2
    exit 2
fi

CHECKPOINT_NAME="$1"

if [ -z "$CHECKPOINT_NAME" ]; then
    echo "Error: checkpoint-name must not be empty." >&2
    exit 2
fi

# ── Timestamp ──────────────────────────────────────────────────────────────────
# Portable date formatting (works on macOS BSD date and GNU date).
if date --iso-8601=seconds >/dev/null 2>&1; then
    TIMESTAMP="$(date --iso-8601=seconds)"
    FILE_DATE="$(date +%Y-%m-%d_%H%M%S)"
else
    # macOS BSD Date fallback
    TIMESTAMP="$(date +%Y-%m-%dT%H:%M:%S%z)"
    FILE_DATE="$(date +%Y-%m-%d_%H%M%S)"
fi

# ── Checkpoint Directory ───────────────────────────────────────────────────────
mkdir -p "$CHECKPOINT_DIR"

CHECKPOINT_FILE="${CHECKPOINT_DIR}/${FILE_DATE}-${CHECKPOINT_NAME}.md"

# ── Gather State ───────────────────────────────────────────────────────────────

# Extract current phase from task_plan.md
extract_current_phase() {
    if [ ! -f "$TASK_PLAN_FILE" ]; then
        echo "  [WARN] task_plan.md not found — phase unknown."
        return
    fi

    if [ ! -s "$TASK_PLAN_FILE" ]; then
        echo "  [WARN] task_plan.md is empty — phase unknown."
        return
    fi

    # Look for "## Current Phase" section and grab the next non-empty line.
    # Handles both "## Current Phase" as header and "## Current Phase: value" inline.
    local phase
    phase="$(sed -n '/^## Current Phase/{ s/^## Current Phase[[:space:]]*:[[:space:]]*//; /^$/d; p; }' "$TASK_PLAN_FILE" | head -1)"

    if [ -z "$phase" ]; then
        # Try the section-header format (content on next line)
        phase="$(sed -n '/^## Current Phase$/{ n; /^$/d; /^##/d; p; }' "$TASK_PLAN_FILE" | head -1)"
    fi

    if [ -z "$phase" ]; then
        echo "  [WARN] No '## Current Phase' section found in task_plan.md."
    else
        echo "  Phase: $phase"
    fi
}

# Extract user intent from progress.md (first "Intent:" or "Goal:" mention)
extract_user_intent() {
    if [ ! -f "$PROGRESS_FILE" ]; then
        echo "  [WARN] progress.md not found — intent unknown."
        return
    fi

    if [ ! -s "$PROGRESS_FILE" ]; then
        echo "  [WARN] progress.md is empty — intent unknown."
        return
    fi

    # Look for lines mentioning intent, goal, or objective.
    local intent
    intent="$(grep -i -m 3 -E '(intent|goal|objective):' "$PROGRESS_FILE" 2>/dev/null || true)"

    if [ -z "$intent" ]; then
        echo "  [WARN] No explicit intent/goal found in progress.md."
        echo "  (Search for lines containing 'Intent:', 'Goal:', or 'Objective:')"
    else
        echo "$intent" | while IFS= read -r line; do
            echo "  $line"
        done
    fi
}

# Extract delegation state from progress.md
extract_delegation_state() {
    if [ ! -f "$PROGRESS_FILE" ]; then
        echo "  [WARN] progress.md not found — delegation state unknown."
        return
    fi

    if [ ! -s "$PROGRESS_FILE" ]; then
        echo "  [WARN] progress.md is empty — delegation state unknown."
        return
    fi

    # Look for lines mentioning delegation, subagent, or dispatch.
    local delegation
    delegation="$(grep -i -m 5 -E '(delegat|subagent|dispatch|child session):' "$PROGRESS_FILE" 2>/dev/null || true)"

    if [ -z "$delegation" ]; then
        echo "  No active delegation state found."
    else
        echo "$delegation" | while IFS= read -r line; do
            echo "  $line"
        done
    fi
}

# ── Write Checkpoint ───────────────────────────────────────────────────────────
{
    echo "# Session Checkpoint: $CHECKPOINT_NAME"
    echo ""
    echo "**Timestamp:** $TIMESTAMP"
    echo ""
    echo "## Current Phase"
    extract_current_phase
    echo ""
    echo "## User Intent"
    extract_user_intent
    echo ""
    echo "## Delegation State"
    extract_delegation_state
    echo ""
    echo "## Git State"
    echo "  Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    echo "  HEAD:   $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    echo "  Dirty:  $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') uncommitted change(s)"
    echo ""
    echo "---"
    echo "*Generated by session-checkpoint.sh*"
} > "$CHECKPOINT_FILE"

echo "Checkpoint saved: $CHECKPOINT_FILE"
exit 0
