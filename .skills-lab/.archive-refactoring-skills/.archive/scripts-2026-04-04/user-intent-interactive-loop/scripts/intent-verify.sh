#!/usr/bin/env bash
# intent-verify.sh — Validate PROBE phase stop conditions before exit.
#
# Usage: ./scripts/intent-verify.sh [--probe] [--delivery]
#
# --probe   : Validate all 6 PROBE stop conditions are met.
# --delivery: Validate all 5 DELIVER termination criteria are met.
# (no flag) : Run both checks.
#
# Reads from persistence files written by the interactive loop skill.
# Each stop condition is checked independently. ALL must pass.
#
# Exit codes:
#   0 = ALL conditions met, phase may proceed
#   1 = One or more conditions failed (details to stderr)
#   2 = Missing required persistence files
#
# Portable: bash 3.2 compatible (macOS default).

set -uo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
# Path resolution (NO hardcoded platform guesses):
#   STATE_DIR → $STATE_DIR env > first arg > $PWD/state
PROGRESS_FILE="progress.md"
TASK_PLAN_FILE="task_plan.md"
STATE_DIR="${STATE_DIR:-$PWD/state}"
INTENT_FILE="$STATE_DIR/intent.json"
QUESTION_LOG="$STATE_DIR/question-count.json"

MODE="${1:---all}"

# ── Helpers ────────────────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "  [PASS] $1"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "  [FAIL] $1" >&2
}

warn() {
    echo "  [WARN] $1" >&2
}

# ── File Existence ─────────────────────────────────────────────────────────────
check_file() {
    local file="$1"
    local label="$2"
    if [ ! -f "$file" ]; then
        echo "FAIL: $label not found at $file" >&2
        return 1
    fi
    if [ ! -s "$file" ]; then
        echo "FAIL: $label is empty at $file" >&2
        return 1
    fi
    return 0
}

# ── PROBE Stop Condition Checks ────────────────────────────────────────────────
# 6 conditions, ALL must be true before leaving PROBE phase.
# Each condition maps to a concrete, checkable artifact.

check_probe_conditions() {
    echo "=== PROBE Phase Stop Conditions ==="

    # Condition 1: Scope is bounded — intent.json has "scope_in" and "scope_out"
    if check_file "$INTENT_FILE" "Intent capture" 2>/dev/null; then
        if grep -q '"scope_in"' "$INTENT_FILE" 2>/dev/null && \
           grep -q '"scope_out"' "$INTENT_FILE" 2>/dev/null; then
            pass "Scope bounded: scope_in and scope_out defined"
        else
            fail "Scope unbounded: intent.json missing scope_in or scope_out"
        fi
    else
        fail "Scope unbounded: $INTENT_FILE not found (run PROBE first)"
    fi

    # Condition 2: Success is defined — intent.json has "success_criteria" with content
    if check_file "$INTENT_FILE" "Intent capture" 2>/dev/null; then
        SUCCESS_VAL="$(grep -o '"success_criteria"[[:space:]]*:[[:space:]]*"[^"]*"' "$INTENT_FILE" 2>/dev/null || true)"
        if [ -n "$SUCCESS_VAL" ] && [ "$SUCCESS_VAL" != '"success_criteria": ""' ]; then
            pass "Success defined: success_criteria is non-empty"
        else
            fail "Success undefined: success_criteria is empty or missing"
        fi
    else
        fail "Success undefined: $INTENT_FILE not found"
    fi

    # Condition 3: Constraints are known — intent.json has "constraints" array with at least 1 entry
    if check_file "$INTENT_FILE" "Intent capture" 2>/dev/null; then
        if grep -q '"constraints"' "$INTENT_FILE" 2>/dev/null; then
            # Check it's not an empty array
            if grep -q '"constraints"[[:space:]]*:[[:space:]]*\[\]' "$INTENT_FILE" 2>/dev/null; then
                fail "Constraints unknown: constraints array is empty"
            else
                pass "Constraints known: constraints array has entries"
            fi
        else
            fail "Constraints unknown: no constraints field in intent.json"
        fi
    else
        fail "Constraints unknown: $INTENT_FILE not found"
    fi

    # Condition 4: Priority is set — intent.json has "priority" with a value
    if check_file "$INTENT_FILE" "Intent capture" 2>/dev/null; then
        PRIORITY_VAL="$(grep -o '"priority"[[:space:]]*:[[:space:]]*"[^"]*"' "$INTENT_FILE" 2>/dev/null || true)"
        if [ -n "$PRIORITY_VAL" ] && [ "$PRIORITY_VAL" != '"priority": ""' ]; then
            pass "Priority set: priority is defined"
        else
            fail "Priority unset: priority is empty or missing"
        fi
    else
        fail "Priority unset: $INTENT_FILE not found"
    fi

    # Condition 5: Delegation is set — intent.json has "delegation" with valid value
    if check_file "$INTENT_FILE" "Intent capture" 2>/dev/null; then
        DELEG_VAL="$(grep -o '"delegation"[[:space:]]*:[[:space:]]*"[^"]*"' "$INTENT_FILE" 2>/dev/null || true)"
        if echo "$DELEG_VAL" | grep -q -E '"(execute|delegate|clarify)"'; then
            pass "Delegation set: $DELEG_VAL"
        else
            fail "Delegation invalid: must be execute, delegate, or clarify (got: $DELEG_VAL)"
        fi
    else
        fail "Delegation unset: $INTENT_FILE not found"
    fi

    # Condition 6: User has confirmed — progress.md contains "## User Confirmation" with content
    if check_file "$PROGRESS_FILE" "Progress log" 2>/dev/null; then
        if grep -q "^## User Confirmation" "$PROGRESS_FILE" 2>/dev/null; then
            # Check there's actual content after the heading (not just the heading itself)
            CONFIRM_SECTION="$(sed -n '/^## User Confirmation/,/^## /p' "$PROGRESS_FILE" | tail -n +2)"
            if [ -n "$CONFIRM_SECTION" ] && echo "$CONFIRM_SECTION" | grep -q -i -E '(yes|correct|go ahead|looks good|proceed|confirm)'; then
                pass "User confirmed: explicit confirmation found in progress.md"
            else
                fail "User not confirmed: no explicit yes/correct/go-ahead in confirmation section"
            fi
        else
            fail "User not confirmed: no '## User Confirmation' section in progress.md"
        fi
    else
        fail "User not confirmed: $PROGRESS_FILE not found"
    fi

    # Bonus: Question cap check — max 3 questions asked via question tool
    if [ -f "$QUESTION_LOG" ]; then
        QUESTION_COUNT="$(grep -c '"question"' "$QUESTION_LOG" 2>/dev/null || true)"
        QUESTION_COUNT="${QUESTION_COUNT:-0}"
        if [ "$QUESTION_COUNT" -le 3 ]; then
            pass "Question cap respected: $QUESTION_COUNT/3 questions used"
        else
            fail "Question cap exceeded: $QUESTION_COUNT questions asked (max 3)"
        fi
    else
        warn "Question log not found — cannot verify question cap"
        SKIP_COUNT=$((SKIP_COUNT + 1))
    fi
}

# ── DELIVER Termination Checks ─────────────────────────────────────────────────
check_delivery_conditions() {
    echo "=== DELIVER Phase Termination Criteria ==="

    # Criterion 1: Intent fully addressed — task_plan.md has all phases complete
    if check_file "$TASK_PLAN_FILE" "Task plan" 2>/dev/null; then
        TOTAL_PHASES="$(grep -c -E '^\s*- \[ \]|\*\*Status:\*\* pending' "$TASK_PLAN_FILE" 2>/dev/null || true)"
        TOTAL_PHASES="${TOTAL_PHASES:-0}"
        if [ "$TOTAL_PHASES" -eq 0 ]; then
            pass "All phases complete: no pending tasks in task_plan.md"
        else
            fail "Incomplete: $TOTAL_PHASES pending tasks remain"
        fi
    else
        fail "Incomplete: $TASK_PLAN_FILE not found"
    fi

    # Criterion 2: Success criteria met — progress.md references success_criteria keywords
    if check_file "$PROGRESS_FILE" "Progress log" 2>/dev/null && \
       check_file "$INTENT_FILE" "Intent capture" 2>/dev/null; then
        SUCCESS_KEYWORDS="$(grep -o '"success_criteria"[[:space:]]*:[[:space:]]*"[^"]*"' "$INTENT_FILE" | sed 's/.*: *"//;s/"$//' | grep -o -E '[a-zA-Z]{4,}' | head -5)"
        if [ -n "$SUCCESS_KEYWORDS" ]; then
            MATCH=0
            while IFS= read -r kw; do
                if grep -q -i "$kw" "$PROGRESS_FILE" 2>/dev/null; then
                    MATCH=1
                    break
                fi
            done <<< "$SUCCESS_KEYWORDS"
            if [ "$MATCH" -eq 1 ]; then
                pass "Success criteria met: keywords found in progress"
            else
                fail "Success criteria not met: no matching keywords in progress"
            fi
        else
            warn "No success keywords to verify"
            SKIP_COUNT=$((SKIP_COUNT + 1))
        fi
    else
        fail "Success criteria unverifiable: missing files"
    fi

    # Criterion 3: No open blockers — progress.md has no unresolved blockers
    if check_file "$PROGRESS_FILE" "Progress log" 2>/dev/null; then
        if grep -q -i "blocker.*unresolved\|blocked.*waiting\|BLOCKED" "$PROGRESS_FILE" 2>/dev/null; then
            fail "Open blockers: unresolved blockers found in progress.md"
        else
            pass "No open blockers"
        fi
    else
        fail "Blockers unverifiable: $PROGRESS_FILE not found"
    fi

    # Criterion 4: User acknowledged delivery — progress.md has delivery confirmation
    if check_file "$PROGRESS_FILE" "Progress log" 2>/dev/null; then
        if grep -q "^## Delivery" "$PROGRESS_FILE" 2>/dev/null; then
            DELIVERY_SECTION="$(sed -n '/^## Delivery/,/^## /p' "$PROGRESS_FILE" | tail -n +2)"
            if [ -n "$DELIVERY_SECTION" ]; then
                pass "Delivery acknowledged: delivery section has content"
            else
                fail "Delivery not acknowledged: delivery section is empty"
            fi
        else
            fail "Delivery not acknowledged: no '## Delivery' section"
        fi
    else
        fail "Delivery unverifiable: $PROGRESS_FILE not found"
    fi

    # Criterion 5: All outputs written — files referenced in task_plan.md exist on disk
    if check_file "$TASK_PLAN_FILE" "Task plan" 2>/dev/null; then
        REFERENCED_FILES="$(grep -o -E '[a-zA-Z0-9_./-]+\.(md|ts|js|json|sh)' "$TASK_PLAN_FILE" 2>/dev/null | sort -u || true)"
        MISSING_FILES=0
        if [ -n "$REFERENCED_FILES" ]; then
            while IFS= read -r f; do
                if [ ! -f "$f" ]; then
                    fail "Output missing: $f referenced but not found"
                    MISSING_FILES=$((MISSING_FILES + 1))
                fi
            done <<< "$REFERENCED_FILES"
        fi
        if [ "$MISSING_FILES" -eq 0 ]; then
            pass "All outputs written: referenced files exist on disk"
        fi
    else
        fail "Outputs unverifiable: $TASK_PLAN_FILE not found"
    fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
case "$MODE" in
    --probe)
        check_probe_conditions
        ;;
    --delivery)
        check_delivery_conditions
        ;;
    --all|*)
        check_probe_conditions
        echo ""
        check_delivery_conditions
        ;;
esac

echo ""
echo "=== Summary ==="
echo "  Passed: $PASS_COUNT"
echo "  Failed: $FAIL_COUNT"
echo "  Skipped: $SKIP_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo ""
    echo "RESULT: FAIL — $FAIL_COUNT condition(s) not met. Phase cannot proceed." >&2
    exit 1
else
    echo ""
    echo "RESULT: PASS — All checked conditions met. Phase may proceed."
    exit 0
fi
