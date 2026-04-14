#!/usr/bin/env bash
set -euo pipefail

# validate-gate.sh — MANDATORY preflight before ANY skill creation/edit/audit
# Usage: bash scripts/validate-gate.sh <create|edit|audit> "<user-request>" [skill-dir]
# Exit 0 = proceed, Exit 1 = BLOCKED — fix before continuing
#
# This script MUST run before touching any SKILL.md file.
# It enforces: intent extraction, pattern selection, planning files, checklist state.

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly ACTION="${1:?Usage: validate-gate.sh <create|edit|audit> \"<user-request>\" [skill-dir]}"
readonly USER_REQUEST="${2:?User request string required as second argument}"
readonly SKILL_DIR="${3:-.}"

fail() { echo "BLOCKED: $1" >&2; exit 1; }
pass_gate() { echo "GATE OK: $1"; }

# ── Gate 0: Action is valid ──
case "$ACTION" in
  create|edit|audit|synthesize) ;;
  *) fail "Unknown action '$ACTION'. Must be: create, edit, audit, or synthesize" ;;
esac

# ── Gate 1: Intent extraction ──
# User request must be non-empty and contain actionable intent.
[[ -z "${USER_REQUEST// /}" ]] && fail "Empty request — cannot determine intent."

# Extract a one-line intent summary for the task plan.
INTENT_SUMMARY=$(echo "$USER_REQUEST" | head -c 200)
pass_gate "Intent: $INTENT_SUMMARY"

# ── Gate 2: Planning files exist (create/edit only) ──
if [[ "$ACTION" == "create" || "$ACTION" == "edit" ]]; then
  task_plan="$SKILL_DIR/task_plan.md"
  if [[ ! -f "$task_plan" ]]; then
    # Auto-create minimal task_plan.md
    cat > "$task_plan" << EOF
# Task Plan: Skill $ACTION

## Goal
$INTENT_SUMMARY

## Checklist
- [ ] G1: Intent captured (this file)
- [ ] G2: Pattern selected (P1/P2/P3)
- [ ] G3: Frontmatter written and validated
- [ ] G4: Body written following agentskills.io principles
- [ ] G5: validate-skill.sh passes
- [ ] G6: Subagent review passes
- [ ] G7: Final validate-gate.sh re-run passes

## Pattern
[Not yet selected — run decision tree below]

EOF
    pass_gate "Created task_plan.md with checklist"
  else
    # Verify Goal is not a placeholder
    goal=$(grep -A1 "^## Goal" "$task_plan" 2>/dev/null | tail -1 | tr -d '[:space:]' || true)
    if [[ -z "$goal" ]] || [[ "$goal" == "[Not"* ]] || [[ "$goal" == "Onesentence"* ]]; then
      fail "task_plan.md Goal is empty or placeholder. Fill it in before proceeding."
    fi
    pass_gate "task_plan.md Goal present"
  fi
fi

# ── Gate 3: Pattern selected (create only) ──
if [[ "$ACTION" == "create" ]]; then
  if [[ -f "$task_plan" ]]; then
    pattern_line=$(grep -i "^## Pattern" -A1 "$task_plan" 2>/dev/null | tail -1 || true)
    if echo "$pattern_line" | grep -qiE "P[123]"; then
      pass_gate "Pattern selected: $pattern_line"
    else
      # Not yet selected — this gate is WARN not BLOCK for first run
      echo "GATE WARN: Pattern not yet selected in task_plan.md. Must pick P1/P2/P3 before writing body."
    fi
  fi
fi

# ── Gate 4: Checklist completeness (all actions) ──
# Check that the agent is following the checklist, not skipping steps.
if [[ -f "$task_plan" ]]; then
  total_checks=$(grep -c '\[.\]' "$task_plan" 2>/dev/null || true)
  done_checks=$(grep -c '\[x\]' "$task_plan" 2>/dev/null || true)
  total_checks="${total_checks:-0}"
  done_checks="${done_checks:-0}"
  # Trim whitespace
  total_checks=$(echo "$total_checks" | tr -d '[:space:]')
  done_checks=$(echo "$done_checks" | tr -d '[:space:]')
  if [[ "$total_checks" -gt 0 ]] 2>/dev/null; then
    pass_gate "Checklist progress: $done_checks/$total_checks"
  fi
fi

# ── Gate 5: For edit/audit — target SKILL.md exists ──
if [[ "$ACTION" == "edit" || "$ACTION" == "audit" ]]; then
  target="$SKILL_DIR/SKILL.md"
  [[ ! -f "$target" ]] && fail "SKILL.md not found at $target. Cannot $ACTION a non-existent skill."
  pass_gate "Target SKILL.md exists"
fi

# ── Gate 6: Scripts directory has validators ──
for script in validate-skill.sh check-overlaps.sh; do
  if [[ ! -f "$SCRIPT_DIR/$script" ]]; then
    fail "Required script missing: $script. Cannot proceed without validators."
  fi
done
pass_gate "All validator scripts present"

# ── Output: Parseable state for downstream steps ──
echo "---VALIDATE_GATE_OUTPUT---"
echo "ACTION=$ACTION"
echo "INTENT=$INTENT_SUMMARY"
echo "SKILL_DIR=$SKILL_DIR"
echo "VALIDATORS_READY=true"
echo "---END_VALIDATE_GATE_OUTPUT---"
exit 0
