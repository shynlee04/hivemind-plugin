#!/usr/bin/env bash
set -euo pipefail

# route-check.sh — Validates a routing decision against available skills
# Usage: bash route-check.sh <group> <skill-name>
#   group: GROUP_1, GROUP_2, or GROUP_3
#   skill-name: name of the target skill (e.g., use-authoring-skills)
# Exit 0 = valid, Exit 1 = invalid

readonly SCRIPT_NAME="$(basename "$0")"
readonly GROUP="${1:?Usage: $SCRIPT_NAME <GROUP_1|GROUP_2|GROUP_3> <skill-name>}"
readonly SKILL_NAME="${2:?Usage: $SCRIPT_NAME <group> <skill-name>}"

errors=0

fail() { echo "FAIL: $1" >&2; errors=$((errors + 1)); }
pass() { echo "PASS: $1"; }

# --- Gate 1: Group Validity ---

case "$GROUP" in
  GROUP_1|GROUP_2|GROUP_3)
    pass "Group '$GROUP' is valid"
    ;;
  *)
    fail "Invalid group '$GROUP'. Must be GROUP_1, GROUP_2, or GROUP_3"
    exit 1
    ;;
esac

# --- Gate 2: Skill Exists (uses SKILLS_ROOT, NO platform guesses) ---

SKILLS_ROOT="${SKILLS_ROOT:-$PWD}"
found=false
found_path=""

if [[ -d "$SKILLS_ROOT/$SKILL_NAME" ]] && [[ -f "$SKILLS_ROOT/$SKILL_NAME/SKILL.md" ]]; then
  found=true
  found_path="$SKILLS_ROOT/$SKILL_NAME"
  pass "Skill '$SKILL_NAME' found at $found_path"
fi

if [[ "$found" == false ]]; then
  fail "Skill '$SKILL_NAME' not found at $SKILLS_ROOT/$SKILL_NAME"
fi

# --- Gate 3: Group-Skill Compatibility ---

group_1_skills=(
  "user-intent-interactive-loop"
  "coordinating-loop"
  "planning-with-files"
)

group_2_skills=(
  "use-authoring-skills"
  "use-authoring-agents"
  "use-authoring-commands"
  "use-authoring-tools"
  "use-authoring-workflows"
)

case "$GROUP" in
  GROUP_1)
    match=false
    for s in "${group_1_skills[@]}"; do
      [[ "$s" == "$SKILL_NAME" ]] && match=true && break
    done
    if [[ "$match" == true ]]; then
      pass "Skill '$SKILL_NAME' is valid for GROUP_1"
    else
      fail "Skill '$SKILL_NAME' is not a GROUP_1 skill. Expected: ${group_1_skills[*]}"
    fi
    ;;
  GROUP_2)
    match=false
    for s in "${group_2_skills[@]}"; do
      [[ "$s" == "$SKILL_NAME" ]] && match=true && break
    done
    if [[ "$match" == true ]]; then
      pass "Skill '$SKILL_NAME' is valid for GROUP_2"
    else
      fail "Skill '$SKILL_NAME' is not a GROUP_2 skill. Expected: ${group_2_skills[*]}"
    fi
    ;;
  GROUP_3)
    pass "GROUP_3 accepts any skill as shared concept reference"
    ;;
esac

# --- Gate 4: Frontmatter Compliance ---

if [[ "$found" == true ]] && [[ -n "$found_path" ]]; then
  skill_md="$found_path/SKILL.md"

  # Extract name from frontmatter
  fm_name=$(awk 'NR==1{next} /^---$/{exit} /^name:/{sub(/^name: */,""); gsub(/["'\'']/, ""); print; exit}' "$skill_md" 2>/dev/null || true)

  if [[ "$fm_name" == "$SKILL_NAME" ]]; then
    pass "Frontmatter name matches skill name"
  elif [[ -n "$fm_name" ]]; then
    fail "Frontmatter name '$fm_name' does not match expected '$SKILL_NAME'"
  else
    fail "Could not extract name from frontmatter"
  fi

  # Check for description field
  if grep -q '^description:' "$skill_md" 2>/dev/null; then
    pass "Frontmatter description present"
  else
    fail "Frontmatter description missing"
  fi
fi

# --- Summary ---

echo ""
if [[ $errors -gt 0 ]]; then
  echo "Route check FAILED: $errors error(s) found" >&2
  exit 1
else
  echo "Route check PASSED: Routing to $GROUP/$SKILL_NAME is valid"
  exit 0
fi
