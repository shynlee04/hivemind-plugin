#!/usr/bin/env bash
# verify-hierarchy.sh — Shared Hierarchy Verification Script
# Usage: bash verify-hierarchy.sh <skill-name>
# Exit 0 = chain intact, Exit 1 = missing prerequisites
#
# Reads .opencode/state/loaded-skills.json to verify prerequisite chains.
# Supports all 5 refactoring skills with their specific prerequisites.
# Compatible with bash 3.2+ (macOS default).

set -euo pipefail

# --- Resolve project root ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT=""
search_dir="$SCRIPT_DIR"
for _ in 1 2 3 4 5 6; do
  if [ -d "$search_dir/.opencode/state" ]; then
    PROJECT_ROOT="$search_dir"
    break
  fi
  parent="$(dirname "$search_dir")"
  if [ "$parent" = "$search_dir" ]; then
    break
  fi
  search_dir="$parent"
done

if [ -z "$PROJECT_ROOT" ]; then
  echo "[hierarchy] FAIL: cannot locate project root (no .opencode/state/ found)"
  exit 1
fi

STATE_DIR="$PROJECT_ROOT/.opencode/state"
LOADED_SKILLS="$STATE_DIR/loaded-skills.json"

# --- Argument validation ---
if [ $# -lt 1 ]; then
  echo "[hierarchy] FAIL: missing <skill-name> argument"
  echo "Usage: bash verify-hierarchy.sh <skill-name>"
  exit 1
fi

SKILL_NAME="$1"

# --- Ensure state directory and loaded-skills.json exist ---
mkdir -p "$STATE_DIR"

if [ ! -f "$LOADED_SKILLS" ]; then
  echo '{}' > "$LOADED_SKILLS"
fi

# --- Helper: check if a skill exists in loaded-skills.json ---
skill_is_loaded() {
  local skill="$1"
  if command -v jq &>/dev/null; then
    local val
    val=$(jq -r --arg s "$skill" '.skills[$s].status // "missing"' "$LOADED_SKILLS" 2>/dev/null) || val="missing"
    [ "$val" = "loaded" ]
  else
    grep -q "\"$skill\"" "$LOADED_SKILLS" 2>/dev/null && \
    grep -A2 "\"$skill\"" "$LOADED_SKILLS" 2>/dev/null | grep -q '"loaded"' 2>/dev/null
  fi
}

# --- Helper: check if a skill directory exists on disk ---
skill_dir_exists() {
  local skill="$1"
  [ -d "$PROJECT_ROOT/.opencode/skills/$skill" ] || \
  [ -d "$PROJECT_ROOT/.skills-lab/refactoring-skills/$skill" ] || \
  [ -d "$PROJECT_ROOT/.agents/skills/$skill" ] || \
  [ -d "$PROJECT_ROOT/.claude/skills/$skill" ]
}

# --- Helper: check artifact field in a JSON file ---
check_artifact_field() {
  local path="$1"
  local field="$2"
  local expected="$3"
  local full_path="$PROJECT_ROOT/$path"

  if [ ! -f "$full_path" ]; then
    return 1
  fi

  if command -v jq &>/dev/null; then
    local val
    val=$(jq -r --arg f "$field" ".$f // empty" "$full_path" 2>/dev/null) || return 1
    if [ "$expected" = "true" ]; then
      [ "$val" = "true" ]
    else
      [ "$val" = "$expected" ]
    fi
  else
    grep -q "\"$field\"" "$full_path" 2>/dev/null && \
    grep -q "$expected" "$full_path" 2>/dev/null
  fi
}

# --- Helper: check artifact has a Goal section ---
check_has_goal_section() {
  local path="$1"
  local full_path="$PROJECT_ROOT/$path"

  if [ ! -f "$full_path" ]; then
    return 1
  fi

  grep -qi "goal" "$full_path" 2>/dev/null
}

# --- Prerequisite lookup (bash 3.2 compatible — no associative arrays) ---
get_requires_exist() {
  case "$1" in
    meta-builder)
      echo "opencode-platform-reference,repomix-exploration-guide,opencode-non-interactive-shell"
      ;;
    use-authoring-skills)
      echo "meta-builder"
      ;;
    *)
      echo ""
      ;;
  esac
}

get_requires_loaded() {
  case "$1" in
    user-intent-interactive-loop)
      echo "opencode-platform-reference,repomix-exploration-guide,opencode-non-interactive-shell"
      ;;
    planning-with-files)
      echo "user-intent-interactive-loop"
      ;;
    coordinating-loop)
      echo "planning-with-files"
      ;;
    *)
      echo ""
      ;;
  esac
}

get_artifact_path() {
  case "$1" in
    planning-with-files)
      echo ".opencode/state/intent.json"
      ;;
    coordinating-loop)
      echo "task_plan.md"
      ;;
    *)
      echo ""
      ;;
  esac
}

get_artifact_field() {
  case "$1" in
    planning-with-files)
      echo "user_confirmed"
      ;;
    *)
      echo ""
      ;;
  esac
}

get_artifact_value() {
  case "$1" in
    planning-with-files)
      echo "true"
      ;;
    *)
      echo ""
      ;;
  esac
}

get_artifact_check() {
  case "$1" in
    coordinating-loop)
      echo "has_goal_section"
      ;;
    *)
      echo ""
      ;;
  esac
}

is_known_skill() {
  case "$1" in
    meta-builder|user-intent-interactive-loop|planning-with-files|coordinating-loop|use-authoring-skills)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# --- Validate skill name ---
if ! is_known_skill "$SKILL_NAME"; then
  echo "[hierarchy] FAIL: unknown skill '$SKILL_NAME'"
  echo "Known skills: meta-builder, user-intent-interactive-loop, planning-with-files, coordinating-loop, use-authoring-skills"
  exit 1
fi

# --- Run checks ---
MISSING=()

# Check requires_exist (skill directories on disk)
exist_list="$(get_requires_exist "$SKILL_NAME")"
if [ -n "$exist_list" ]; then
  OLD_IFS="$IFS"
  IFS=','
  for prereq in $exist_list; do
    IFS="$OLD_IFS"
    if ! skill_dir_exists "$prereq"; then
      MISSING+=("$prereq (directory not found)")
    fi
  done
  IFS="$OLD_IFS"
fi

# Check requires_loaded (recorded in loaded-skills.json)
loaded_list="$(get_requires_loaded "$SKILL_NAME")"
if [ -n "$loaded_list" ]; then
  OLD_IFS="$IFS"
  IFS=','
  for prereq in $loaded_list; do
    IFS="$OLD_IFS"
    if ! skill_is_loaded "$prereq"; then
      MISSING+=("$prereq (not in loaded-skills.json)")
    fi
  done
  IFS="$OLD_IFS"
fi

# Check requires_artifact (file/field checks)
artifact_path="$(get_artifact_path "$SKILL_NAME")"
if [ -n "$artifact_path" ]; then
  artifact_field="$(get_artifact_field "$SKILL_NAME")"
  artifact_check="$(get_artifact_check "$SKILL_NAME")"

  if [ -n "$artifact_field" ]; then
    artifact_value="$(get_artifact_value "$SKILL_NAME")"
    if ! check_artifact_field "$artifact_path" "$artifact_field" "$artifact_value"; then
      MISSING+=("$artifact_path (missing $artifact_field=$artifact_value)")
    fi
  elif [ -n "$artifact_check" ]; then
    case "$artifact_check" in
      has_goal_section)
        if ! check_has_goal_section "$artifact_path"; then
          MISSING+=("$artifact_path (missing Goal section)")
        fi
        ;;
      *)
        MISSING+=("$artifact_path (unknown check: $artifact_check)")
        ;;
    esac
  fi
fi

# --- Report results ---
if [ ${#MISSING[@]} -eq 0 ]; then
  echo "[hierarchy] PASS: $SKILL_NAME"
  exit 0
else
  echo "[hierarchy] FAIL: $SKILL_NAME"
  for m in "${MISSING[@]}"; do
    echo "  missing: $m"
  done
  exit 1
fi
