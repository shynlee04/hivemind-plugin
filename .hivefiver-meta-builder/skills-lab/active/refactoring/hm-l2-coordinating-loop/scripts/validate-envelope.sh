#!/usr/bin/env bash
# validate-envelope.sh — Validates a task envelope has all 5 required sections
# Usage: ./validate-envelope.sh <session-name> <child-id>
#
# Required sections (case-insensitive, must appear as ## headings):
#   1. Task — One-sentence description
#   2. Scope — Include/exclude file lists
#   3. Context — Relevant information for the child
#   4. Expected Output — Concrete deliverables
#   5. Verification — Command or check to run
#
# Exit codes:
#   0 — All 5 sections present
#   1 — One or more sections missing (details printed to stdout)
#   2 — Envelope file not found

set -euo pipefail

COORD_DIR="${COORD_DIR:-.coordination}"
SESSION="${1:?Usage: validate-envelope.sh <session-name> <child-id>}"
CHILD_ID="${2:?Usage: validate-envelope.sh <session-name> <child-id>}"

SESSION_DIR="$COORD_DIR/$SESSION"
ENVELOPE="$SESSION_DIR/children/$CHILD_ID/envelope.md"

if [[ ! -f "$ENVELOPE" ]]; then
  echo "[validate-envelope] ERROR: Envelope not found: $ENVELOPE"
  echo "[validate-envelope] Create the envelope file before running validation."
  exit 2
fi

MISSING=()
ERRORS=0

# Check each required section (case-insensitive heading match)
for section in "Task" "Scope" "Context" "Expected Output" "Verification"; do
  # Match ## Task, ## task, ## TASK, etc.
  if ! grep -qi "^## ${section}" "$ENVELOPE" 2>/dev/null; then
    MISSING+=("$section")
    ERRORS=$((ERRORS + 1))
  fi
done

if [[ $ERRORS -gt 0 ]]; then
  echo "[validate-envelope] FAIL: Envelope for $CHILD_ID is missing $ERRORS required section(s):"
  for section in "${MISSING[@]}"; do
    echo "  ✗ Missing: ## $section"
  done
  echo ""
  echo "[validate-envelope] Every envelope MUST have all 5 sections:"
  echo "  ## Task          — One-sentence description"
  echo "  ## Scope         — Include/exclude file lists"
  echo "  ## Context       — Only what the child needs"
  echo "  ## Expected Output — Concrete deliverables"
  echo "  ## Verification  — Exact command to run"
  exit 1
fi

# Additional quality checks (warnings, not blockers)
WARNINGS=0

# Check scope has include/exclude
if ! grep -qi "include\|exclude\|work on\|do not touch\|do NOT touch" "$ENVELOPE" 2>/dev/null; then
  echo "[validate-envelope] WARN: Scope section may lack concrete file boundaries"
  WARNINGS=$((WARNINGS + 1))
fi

# Check verification has a concrete command
if ! grep -qi "run:\|command:\|npm\|bash\|test\|check\|verify" "$ENVELOPE" 2>/dev/null; then
  echo "[validate-envelope] WARN: Verification section may lack a concrete command"
  WARNINGS=$((WARNINGS + 1))
fi

echo "[validate-envelope] PASS: Envelope for $CHILD_ID has all 5 required sections ($WARNINGS warning(s))"
exit 0
