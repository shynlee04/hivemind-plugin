#!/usr/bin/env bash
set -euo pipefail

# gate-enforce.sh — Enforce gate passage before proceeding to next phase
# Usage: bash scripts/gate-enforce.sh <GATE> [skill-directory]
# Exit 0 = gate passed, Exit 1 = gate failed
#
# Gates:
#   G1 — Intent: User intent captured in task_plan.md Goal field
#   G2 — Structure: SKILL.md frontmatter has name + description
#   G3 — Pattern: Pattern (P1/P2/P3) selected and documented
#   G4 — Quality: Quality score ≥ 3/5 on all 5 dimensions
#   G5 — Validation: validate-skill.sh passes, check-overlaps.sh clean

readonly SCRIPT_NAME="$(basename "$0")"
readonly GATE="${1:?Usage: $SCRIPT_NAME <G1|G2|G3|G4|G5> [skill-directory]}"
readonly SKILL_DIR="${2:-.}"

fail() { echo "GATE $GATE FAILED: $1" >&2; exit 1; }
pass_gate() { echo "GATE $GATE PASSED: $1"; exit 0; }

case "$GATE" in
  G1)
    # Check that task_plan.md exists and has a non-empty Goal
    if [[ ! -f "task_plan.md" ]]; then
      fail "task_plan.md not found. Run scripts/init-session.sh first."
    fi
    goal=$(grep -A1 "^## Goal" task_plan.md | tail -1 | sed 's/^\[//;s/\]$//' | tr -d '[:space:]')
    if [[ -z "$goal" ]] || [[ "$goal" == "Onesentence"* ]]; then
      fail "Goal field in task_plan.md is empty or still a placeholder."
    fi
    pass_gate "User intent captured: '$goal'"
    ;;

  G2)
    # Check SKILL.md frontmatter has name + description
    skill_md="$SKILL_DIR/SKILL.md"
    if [[ ! -f "$skill_md" ]]; then
      fail "SKILL.md not found in $SKILL_DIR"
    fi
    if ! head -1 "$skill_md" | grep -q '^---$'; then
      fail "SKILL.md missing frontmatter delimiter"
    fi
    name=$(grep '^name:' "$skill_md" | head -1 | sed 's/^name: *//' | tr -d '"' | tr -d "'")
    desc=$(grep '^description:' "$skill_md" | head -1 | sed 's/^description: *//')
    if [[ -z "$name" ]]; then
      fail "name field missing from frontmatter"
    fi
    if [[ -z "$desc" ]]; then
      fail "description field missing from frontmatter"
    fi
    pass_gate "Frontmatter valid: name='$name'"
    ;;

  G3)
    # Check that pattern (P1/P2/P3) is selected and documented
    skill_md="$SKILL_DIR/SKILL.md"
    if [[ ! -f "$skill_md" ]]; then
      fail "SKILL.md not found in $SKILL_DIR"
    fi
    # Check for pattern mention in frontmatter metadata or body
    if grep -qi "pattern.*[Pp][123]" "$skill_md" 2>/dev/null; then
      pattern=$(grep -oi "pattern.*[Pp][123]" "$skill_md" | head -1)
      pass_gate "Pattern documented: $pattern"
    else
      fail "No pattern (P1/P2/P3) selection found in SKILL.md. Add 'pattern: P2' to metadata or document in body."
    fi
    ;;

  G4)
    # Check quality score ≥ 3/5 on all 5 dimensions
    # This gate requires a manual or automated quality evaluation.
    # Look for a grading.json or quality-eval.md file.
    skill_md="$SKILL_DIR/SKILL.md"
    eval_file=""
    for f in "$SKILL_DIR/grading.json" "$SKILL_DIR/quality-eval.md" "$SKILL_DIR/evals/grading.json"; do
      if [[ -f "$f" ]]; then
        eval_file="$f"
        break
      fi
    done
    if [[ -z "$eval_file" ]]; then
      fail "No quality evaluation file found. Run quality scoring first (see references/05-skill-quality-matrix.md)."
    fi
    # Check for any dimension scoring ≤ 2
    if grep -qE '"score":\s*[012][^0-9]' "$eval_file" 2>/dev/null; then
      fail "One or more dimensions scored ≤ 2. This blocks release per the block rule."
    fi
    pass_gate "Quality evaluation found with no blocking scores."
    ;;

  G5)
    # Run validate-skill.sh and check-overlaps.sh
    script_dir="$(cd "$(dirname "$0")" && pwd)"
    if ! bash "$script_dir/validate-skill.sh" "$SKILL_DIR"; then
      fail "validate-skill.sh failed. Fix the errors above."
    fi
    if ! bash "$script_dir/check-overlaps.sh" "$SKILL_DIR"; then
      fail "check-overlaps.sh detected overlaps. Review and resolve."
    fi
    pass_gate "All validation scripts passed."
    ;;

  *)
    echo "Unknown gate: $GATE" >&2
    echo "Valid gates: G1, G2, G3, G4, G5" >&2
    exit 1
    ;;
esac
