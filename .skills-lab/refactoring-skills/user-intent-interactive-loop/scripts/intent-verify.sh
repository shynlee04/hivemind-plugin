#!/usr/bin/env bash
# intent-verify.sh — Verify the user's stated intent is still being served.
#
# Usage: ./scripts/intent-verify.sh
#
# Compares progress.md against task_plan.md goals to determine if the
# current work still aligns with the user's original intent.
#
# Output:
#   PASS — Intent is being served.
#   FAIL — Intent drift detected. Details printed to stderr.
#
# Portable: bash 3.2 compatible (macOS default).
# Exit codes: 0 = PASS, 1 = FAIL, 2 = missing files.

set -uo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
PROGRESS_FILE="progress.md"
TASK_PLAN_FILE="task_plan.md"

# ── File Existence Checks ──────────────────────────────────────────────────────
MISSING_FILES=0

if [ ! -f "$TASK_PLAN_FILE" ]; then
    echo "FAIL: $TASK_PLAN_FILE not found." >&2
    echo "  Cannot verify intent without a task plan." >&2
    MISSING_FILES=1
fi

if [ ! -f "$PROGRESS_FILE" ]; then
    echo "FAIL: $PROGRESS_FILE not found." >&2
    echo "  Cannot verify progress without a session log." >&2
    MISSING_FILES=1
fi

if [ "$MISSING_FILES" -eq 1 ]; then
    exit 2
fi

# ── File Content Checks ────────────────────────────────────────────────────────
if [ ! -s "$TASK_PLAN_FILE" ]; then
    echo "FAIL: $TASK_PLAN_FILE is empty." >&2
    echo "  Task plan must contain goals to verify against." >&2
    exit 2
fi

if [ ! -s "$PROGRESS_FILE" ]; then
    echo "FAIL: $PROGRESS_FILE is empty." >&2
    echo "  Progress log must contain session activity." >&2
    exit 2
fi

# ── Verification Logic ─────────────────────────────────────────────────────────
FAILURES=0

# Check 1: Does task_plan.md have a Goal section?
if ! grep -q "^## Goal" "$TASK_PLAN_FILE" 2>/dev/null; then
    echo "FAIL: No '## Goal' section in task_plan.md." >&2
    FAILURES=$((FAILURES + 1))
fi

# Check 2: Does task_plan.md have a Current Phase section?
if ! grep -q "^## Current Phase" "$TASK_PLAN_FILE" 2>/dev/null; then
    echo "FAIL: No '## Current Phase' section in task_plan.md." >&2
    FAILURES=$((FAILURES + 1))
fi

# Check 3: Does task_plan.md have at least one phase defined?
if ! grep -q "^## Phases" "$TASK_PLAN_FILE" 2>/dev/null; then
    echo "FAIL: No '## Phases' section in task_plan.md." >&2
    FAILURES=$((FAILURES + 1))
fi

# Check 4: Has progress.md recorded any session activity?
if ! grep -q "^## Session:" "$PROGRESS_FILE" 2>/dev/null; then
    echo "WARN: No '## Session:' entries in progress.md." >&2
    echo "  No session activity has been logged." >&2
    FAILURES=$((FAILURES + 1))
fi

# Check 5: Cross-reference — do any goal keywords appear in progress?
# Extract the goal statement (line after "## Goal") and check if any
# significant words (4+ chars) appear in progress.md.
GOAL_LINE="$(sed -n '/^## Goal/{n; /^$/d; p; }' "$TASK_PLAN_FILE" | head -1)"

if [ -n "$GOAL_LINE" ]; then
    # Extract words of 4+ characters from the goal line.
    KEYWORDS="$(echo "$GOAL_LINE" | grep -o -E '[a-zA-Z]{4,}' | head -5)"

    if [ -n "$KEYWORDS" ]; then
        MATCH_FOUND=0
        while IFS= read -r keyword; do
            if grep -q -i "$keyword" "$PROGRESS_FILE" 2>/dev/null; then
                MATCH_FOUND=1
                break
            fi
        done <<< "$KEYWORDS"

        if [ "$MATCH_FOUND" -eq 0 ]; then
            echo "FAIL: Goal keywords not found in progress.md." >&2
            echo "  Goal: $GOAL_LINE" >&2
            echo "  None of the key terms from the goal appear in session logs." >&2
            FAILURES=$((FAILURES + 1))
        fi
    fi
else
    echo "WARN: Goal section in task_plan.md is empty." >&2
    FAILURES=$((FAILURES + 1))
fi

# Check 6: Are there any completed phases? (Evidence of forward progress)
# FIX: Use `grep -c ... || true` to avoid multiline output from `|| echo "0"`.
# When grep -c finds no matches it returns exit code 1 and outputs "0".
# The `|| echo "0"` would then also fire, producing "0\n0" which breaks -eq.
COMPLETED_PHASES="$(grep -c -E '\*\*Status:\*\* complete' "$TASK_PLAN_FILE" 2>/dev/null || true)"
IN_PROGRESS_PHASES="$(grep -c -E '\*\*Status:\*\* in_progress' "$TASK_PLAN_FILE" 2>/dev/null || true)"

# Ensure variables are valid integers (default to 0 if empty)
COMPLETED_PHASES="${COMPLETED_PHASES:-0}"
IN_PROGRESS_PHASES="${IN_PROGRESS_PHASES:-0}"

if [ "$COMPLETED_PHASES" -eq 0 ] && [ "$IN_PROGRESS_PHASES" -eq 0 ]; then
    echo "WARN: No phases marked as complete or in_progress." >&2
    echo "  All phases may still be pending — verify work has started." >&2
fi

# ── Result ─────────────────────────────────────────────────────────────────────
if [ "$FAILURES" -gt 0 ]; then
    echo "" >&2
    echo "RESULT: FAIL ($FAILURES issue(s) detected)" >&2
    echo "  The user's stated intent may not be served by current progress." >&2
    echo "  Review the issues above and realign." >&2
    exit 1
else
    echo "PASS: Intent verification successful."
    echo "  Completed phases: $COMPLETED_PHASES"
    echo "  In-progress phases: $IN_PROGRESS_PHASES"
    exit 0
fi
