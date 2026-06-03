#!/usr/bin/env bash
# route-check.sh — Validates a routing decision against available skills
# Pure helper: reports findings, always exits 0
# Usage: bash route-check.sh <group> <skill-name>

set -euo pipefail

readonly SCRIPT_NAME="$(basename "$0")"
readonly GROUP="${1:?Usage: $SCRIPT_NAME <GROUP_1|GROUP_2|GROUP_3> <skill-name>}"
readonly SKILL_NAME="${2:?Usage: $SCRIPT_NAME <group> <skill-name>}"

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; }

echo "=== Route Check: $GROUP → $SKILL_NAME ==="

# --- Gate 1: Group Validity ---

case "$GROUP" in
  GROUP_1|GROUP_2|GROUP_3)
    pass "Group '$GROUP' is valid"
    ;;
  *)
    fail "Invalid group '$GROUP'. Must be GROUP_1, GROUP_2, or GROUP_3"
    ;;
esac

# --- Gate 2: Skill Exists (script-relative paths only) ---

script_dir="$(cd "$(dirname "$0")" && pwd)"
search_paths=(
  "$script_dir/.."
  "$script_dir/../../.opencode/skills"
  "$script_dir/../../.agents/skills"
  "$script_dir/../../.claude/skills"
)

# Add git root paths if available
if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  search_paths+=(
    "$git_root/.opencode/skills"
    "$git_root/.agents/skills"
    "$git_root/.claude/skills"
  )
fi

found=false
found_path=""
for dir in "${search_paths[@]}"; do
  if [[ -d "$dir/$SKILL_NAME" ]] && [[ -f "$dir/$SKILL_NAME/SKILL.md" ]]; then
    found=true
    found_path="$dir/$SKILL_NAME"
    pass "Skill '$SKILL_NAME' found at $found_path"
    break
  fi
done

if [[ "$found" == false ]]; then
  fail "Skill '$SKILL_NAME' not found in any searched path"
  echo "Searched paths:" >&2
  for dir in "${search_paths[@]}"; do
    echo "  $dir/$SKILL_NAME" >&2
  done
fi

# --- Summary ---

echo ""
echo "=== Route Check Complete ==="
echo "Group: $GROUP"
echo "Skill: $SKILL_NAME"
echo "SUMMARY: Review FAIL lines above for issues"
exit 0
