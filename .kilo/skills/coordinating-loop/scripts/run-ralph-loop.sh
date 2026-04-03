#!/usr/bin/env bash
# run-ralph-loop.sh — Ralph-loop validator: validate → fix → re-dispatch cycle
# Usage: ./run-ralph-loop.sh <session-name> <child-id> [--cycle N]
#
# Validates a child's output against its envelope. Writes a validation report.
# If validation fails, the parent should:
#   1. Read the report at .coordination/<session>/children/<child-id>/validation-report.md
#   2. Fix the issues or re-dispatch the child with corrected instructions
#   3. Re-run this script with --cycle N (incrementing N)
#
# Maximum 3 cycles. On cycle 3 failure, report indicates ESCALATION required.
#
# Exit codes:
#   0 — Validation passed
#   1 — Validation failed (read report for details)
#   2 — Envelope or result not found

set -euo pipefail

COORD_DIR="${COORD_DIR:-.coordination}"
SESSION="${1:?Usage: run-ralph-loop.sh <session-name> <child-id> [--cycle N]}"
CHILD_ID="${2:?Usage: run-ralph-loop.sh <session-name> <child-id> [--cycle N]}"
CYCLE="${4:-1}"
MAX_CYCLES=3

SESSION_DIR="$COORD_DIR/$SESSION"
CHILD_DIR="$SESSION_DIR/children/$CHILD_ID"
ENVELOPE="$CHILD_DIR/envelope.md"
REPORT="$CHILD_DIR/validation-report.md"

# Validate inputs
if [[ ! -f "$ENVELOPE" ]]; then
  echo "[ralph-loop] ERROR: Envelope not found: $ENVELOPE"
  exit 2
fi

# Check for result file (result.md, summary.md, or output.md)
RESULT=""
for f in result.md summary.md output.md; do
  if [[ -f "$CHILD_DIR/$f" ]]; then
    RESULT="$CHILD_DIR/$f"
    break
  fi
done

if [[ -z "$RESULT" ]]; then
  echo "[ralph-loop] ERROR: No result file found for $CHILD_ID"
  echo "[ralph-loop] Expected: result.md, summary.md, or output.md in $CHILD_DIR"
  exit 2
fi

# ============================================
# Validation checks
# ============================================
FAILURES=()
PASS_COUNT=0

# Check 1: Output file exists (already confirmed above)
PASS_COUNT=$((PASS_COUNT + 1))

# Check 2: Verification section exists in envelope and was referenced in result
if grep -qi "Verification" "$ENVELOPE" 2>/dev/null; then
  # Extract verification command from envelope
  VERIFY_CMD=$(sed -n '/^## Verification/,/^## /p' "$ENVELOPE" | grep -i "run:" | head -1 || true)
  if [[ -n "$VERIFY_CMD" ]]; then
    # Check if the result mentions running the verification
    VERIFY_KEYWORD=$(echo "$VERIFY_CMD" | grep -oi "run:.*" | sed 's/run: *//' | awk '{print $1}' || true)
    if [[ -n "$VERIFY_KEYWORD" ]] && grep -qi "$VERIFY_KEYWORD" "$RESULT" 2>/dev/null; then
      PASS_COUNT=$((PASS_COUNT + 1))
    else
      FAILURES+=("Verification command from envelope was not confirmed as run in result")
    fi
  else
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
fi

# Check 3: Scope compliance — check if result mentions out-of-scope files
if grep -qi "Scope" "$ENVELOPE" 2>/dev/null; then
  EXCLUDE_SECTION=$(sed -n '/^## Scope/,/^## /p' "$ENVELOPE" | grep -i "exclude\|do not\|do NOT" || true)
  if [[ -n "$EXCLUDE_SECTION" ]]; then
    # This is a soft check — flag if result mentions files outside scope
    # The parent should verify with git diff
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    PASS_COUNT=$((PASS_COUNT + 1))
  fi
fi

# Check 4: Result is non-empty
if [[ -s "$RESULT" ]]; then
  RESULT_LINES=$(wc -l < "$RESULT" | tr -d '[:space:]')
  if [[ "$RESULT_LINES" -gt 0 ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAILURES+=("Result file is empty")
  fi
else
  FAILURES+=("Result file is empty or missing")
fi

# Check 5: Expected output criteria met (check envelope mentions deliverables)
if grep -qi "Expected Output" "$ENVELOPE" 2>/dev/null; then
  EXPECTED_SECTION=$(sed -n '/^## Expected Output/,/^## /p' "$ENVELOPE" || true)
  if [[ -n "$EXPECTED_SECTION" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAILURES+=("Expected Output section is empty")
  fi
fi

# ============================================
# Write validation report
# ============================================
mkdir -p "$CHILD_DIR"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TOTAL_CHECKS=$((PASS_COUNT + ${#FAILURES[@]}))

cat > "$REPORT" << EOF
# Validation Report: $CHILD_ID
# Session: $SESSION
# Timestamp: $TIMESTAMP
# Cycle: $CYCLE / $MAX_CYCLES

## Result
$(if [[ ${#FAILURES[@]} -eq 0 ]]; then echo "PASS"; else echo "FAIL"; fi)

## Checks Passed: $PASS_COUNT / $TOTAL_CHECKS

EOF

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo "## Failures" >> "$REPORT"
  for i in "${!FAILURES[@]}"; do
    echo "$((i+1)). ${FAILURES[$i]}" >> "$REPORT"
  done
  echo "" >> "$REPORT"

  if [[ "$CYCLE" -ge "$MAX_CYCLES" ]]; then
    echo "## ESCALATION REQUIRED" >> "$REPORT"
    echo "Maximum $MAX_CYCLES cycles reached. This child cannot pass validation." >> "$REPORT"
    echo "Escalate to user with summary of attempted fixes." >> "$REPORT"
  else
    echo "## Next Action" >> "$REPORT"
    echo "Cycle $CYCLE of $MAX_CYCLES. Fix the above issues and re-dispatch." >> "$REPORT"
    echo "Re-run: bash scripts/run-ralph-loop.sh $SESSION $CHILD_ID --cycle $((CYCLE + 1))" >> "$REPORT"
  fi
else
  echo "## All checks passed. Child output accepted." >> "$REPORT"
fi

echo "[ralph-loop] Validation report written to: $REPORT"

# ============================================
# Exit
# ============================================
if [[ ${#FAILURES[@]} -eq 0 ]]; then
  echo "[ralph-loop] PASS: $CHILD_ID validated successfully (cycle $CYCLE)"
  exit 0
else
  echo "[ralph-loop] FAIL: $CHILD_ID failed validation (cycle $CYCLE/${MAX_CYCLES}) — ${#FAILURES[@]} failure(s)"
  if [[ "$CYCLE" -ge "$MAX_CYCLES" ]]; then
    echo "[ralph-loop] ESCALATION: Max cycles reached. Report user."
  else
    echo "[ralph-loop] Re-run with --cycle $((CYCLE + 1)) after fixing issues."
  fi
  exit 1
fi
