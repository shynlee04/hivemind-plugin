#!/usr/bin/env bash
set -euo pipefail

# route-check.sh — Validates a routing decision against available skills
# Usage: bash scripts/route-check.sh <group> <skill-name>
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
    echo "Cannot continue without valid group" >&2
    exit 1
    ;;
esac

# --- Gate 2: Skill Exists ---

# Search in known skill directories
skill_dirs=(
  "$(dirname "$0")/.."
  "$(dirname "$0")/../../.agents/skills"
  "$(dirname "$0")/../../.opencode/skills"
  "$(dirname "$0")/../../.claude/skills"
)

found=false
for dir in "${skill_dirs[@]}"; do
  if [[ -d "$dir/$SKILL_NAME" ]] && [[ -f "$dir/$SKILL_NAME/SKILL.md" ]]; then
    found=true
    pass "Skill '$SKILL_NAME' found at $dir/$SKILL_NAME"
    break
  fi
done

if [[ "$found" == false ]]; then
  fail "Skill '$SKILL_NAME' not found in any known skill directory"
fi

# --- Gate 3: Group-Skill Compatibility ---

# GROUP_1 skills (implementation)
group_1_skills=(
  "user-intent-interactive-loop"
  "coordinating-loop"
  "planning-with-files"
)

# GROUP_2 skills (domain authoring)
group_2_skills=(
  "use-authoring-skills"
  "use-authoring-agents"
  "use-authoring-commands"
  "use-authoring-tools"
  "use-authoring-workflows"
)

# GROUP_3 is shared concepts — no specific skills, just reference material

case "$GROUP" in
  GROUP_1)
    match=false
    for s in "${group_1_skills[@]}"; do
      if [[ "$s" == "$SKILL_NAME" ]]; then
        match=true
        break
      fi
    done
    if [[ "$match" == true ]]; then
      pass "Skill '$SKILL_NAME' is valid for GROUP_1"
    else
      fail "Skill '$SKILL_NAME' is not a GROUP_1 skill. Expected one of: ${group_1_skills[*]}"
    fi
    ;;
  GROUP_2)
    match=false
    for s in "${group_2_skills[@]}"; do
      if [[ "$s" == "$SKILL_NAME" ]]; then
        match=true
        break
      fi
    done
    if [[ "$match" == true ]]; then
      pass "Skill '$SKILL_NAME' is valid for GROUP_2"
    else
      fail "Skill '$SKILL_NAME' is not a GROUP_2 skill. Expected one of: ${group_2_skills[*]}"
    fi
    ;;
  GROUP_3)
    pass "GROUP_3 accepts any skill as shared concept reference"
    ;;
esac

# --- Gate 4: Frontmatter Compliance ---

if [[ "$found" == true ]]; then
  skill_md=""
  for dir in "${skill_dirs[@]}"; do
    if [[ -f "$dir/$SKILL_NAME/SKILL.md" ]]; then
      skill_md="$dir/$SKILL_NAME/SKILL.md"
      break
    fi
  done

  if [[ -n "$skill_md" ]]; then
    # Check for name field
    if grep -q "^name: $SKILL_NAME" "$skill_md" 2>/dev/null; then
      pass "Frontmatter name matches skill name"
    else
      # Try extracting name from frontmatter
      fm_name=$(awk '/^---$/{n++; next} n==1{if(/^name:/){print $2; exit}}' "$skill_md" 2>/dev/null || true)
      if [[ "$fm_name" == "$SKILL_NAME" ]]; then
        pass "Frontmatter name matches skill name"
      else
        fail "Frontmatter name does not match skill name '$SKILL_NAME'"
      fi
    fi

    # Check for description field
    if grep -q "^description:" "$skill_md" 2>/dev/null; then
      pass "Frontmatter description present"
    else
      fail "Frontmatter description missing"
    fi
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
