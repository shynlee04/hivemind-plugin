#!/usr/bin/env bash
set -euo pipefail

# stack-validate.sh — Checks if a proposed skill combination is valid
# Usage: bash stack-validate.sh <skill1> [skill2] [skill3]
# Validates: no trigger conflicts, no shared state mutation, no dependency cycles
# Exit 0 = valid, Exit 1 = invalid
# Compatible with bash 3.2 (macOS default)

readonly SCRIPT_NAME="$(basename "$0")"

if [[ $# -lt 1 ]]; then
  echo "Usage: $SCRIPT_NAME <skill1> [skill2] [skill3]" >&2
  exit 1
fi

if [[ $# -gt 3 ]]; then
  echo "Error: Maximum 3 skills allowed for stacking (got $#)" >&2
  exit 1
fi

skills=("$@")
errors=0

fail() { echo "FAIL: $1" >&2; errors=$((errors + 1)); }
pass() { echo "PASS: $1"; }

# --- Build search paths ---

script_dir="$(cd "$(dirname "$0")" && pwd)"
skill_search_paths=()

skill_search_paths+=("$script_dir/..")

if [[ -n "${PROJECT_ROOT:-}" ]]; then
  skill_search_paths+=("$PROJECT_ROOT/.opencode/skills")
  skill_search_paths+=("$PROJECT_ROOT/.agents/skills")
  skill_search_paths+=("$PROJECT_ROOT/.claude/skills")
else
  git_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "$git_root" ]]; then
    skill_search_paths+=("$git_root/.opencode/skills")
    skill_search_paths+=("$git_root/.agents/skills")
    skill_search_paths+=("$git_root/.claude/skills")
  fi
fi

skill_search_paths+=("$HOME/.config/opencode/skills")
skill_search_paths+=("$HOME/.agents/skills")
skill_search_paths+=("$HOME/.claude/skills")

skill_search_paths+=("$script_dir/../../.opencode/skills")
skill_search_paths+=("$script_dir/../../.agents/skills")
skill_search_paths+=("$script_dir/../../.claude/skills")

# Deduplicate paths (bash 3.2 compatible — no associative arrays)
unique_paths=()
for p in "${skill_search_paths[@]}"; do
  real_p="$(cd "$p" 2>/dev/null && pwd || true)"
  if [[ -n "$real_p" ]]; then
    already=false
    for up in "${unique_paths[@]+"${unique_paths[@]}"}"; do
      if [[ "$up" == "$real_p" ]]; then
        already=true
        break
      fi
    done
    if [[ "$already" == false ]]; then
      unique_paths+=("$real_p")
    fi
  fi
done

# --- Helper: find skill path ---
# Sets FOUND_SKILL_PATH if found, empty if not
find_skill_path() {
  local skill_name="$1"
  FOUND_SKILL_PATH=""
  for dir in "${unique_paths[@]}"; do
    if [[ -f "$dir/$skill_name/SKILL.md" ]]; then
      FOUND_SKILL_PATH="$dir/$skill_name"
      return 0
    fi
  done
  return 1
}

# --- Gate 1: All Skills Exist ---

# Store paths in parallel arrays (bash 3.2 compatible)
skill_path_1=""
skill_path_2=""
skill_path_3=""

for i in "${!skills[@]}"; do
  skill="${skills[$i]}"
  if find_skill_path "$skill"; then
    pass "Skill '$skill' exists at $FOUND_SKILL_PATH"
    case $i in
      0) skill_path_1="$FOUND_SKILL_PATH" ;;
      1) skill_path_2="$FOUND_SKILL_PATH" ;;
      2) skill_path_3="$FOUND_SKILL_PATH" ;;
    esac
  else
    fail "Skill '$skill' not found in any searched path"
  fi
done

if [[ $errors -gt 0 ]]; then
  echo "Stack validation FAILED: Skills missing" >&2
  exit 1
fi

# Helper to get skill path by index
get_skill_path() {
  case $1 in
    0) echo "$skill_path_1" ;;
    1) echo "$skill_path_2" ;;
    2) echo "$skill_path_3" ;;
  esac
}

# --- Gate 2: Trigger Overlap Check ---

# Extract descriptions
desc_1=""
desc_2=""
desc_3=""

for i in "${!skills[@]}"; do
  skill_md="$(get_skill_path $i)/SKILL.md"
  desc=$(awk 'NR==1{next} /^---$/{exit} /^description:/{sub(/^description: */,""); print; exit}' "$skill_md" 2>/dev/null || true)
  case $i in
    0) desc_1="$desc" ;;
    1) desc_2="$desc" ;;
    2) desc_3="$desc" ;;
  esac
done

get_desc() {
  case $1 in
    0) echo "$desc_1" ;;
    1) echo "$desc_2" ;;
    2) echo "$desc_3" ;;
  esac
}

overlap_found=false
for ((i=0; i<${#skills[@]}; i++)); do
  for ((j=i+1; j<${#skills[@]}; j++)); do
    skill_a="${skills[$i]}"
    skill_b="${skills[$j]}"
    desc_a="$(get_desc $i)"
    desc_b="$(get_desc $j)"

    # Extract trigger keywords — only the actual trigger phrases after "Triggers:"
    triggers_a=$(echo "$desc_a" | grep -oE 'Triggers:.*' 2>/dev/null | sed 's/^Triggers: *//' || true)
    triggers_b=$(echo "$desc_b" | grep -oE 'Triggers:.*' 2>/dev/null | sed 's/^Triggers: *//' || true)

    # If no explicit Triggers: field, extract key action phrases from description
    if [[ -z "$triggers_a" ]]; then
      triggers_a=$(echo "$desc_a" | grep -oiE '"[^"]*"' 2>/dev/null | tr -d '"' || true)
    fi
    if [[ -z "$triggers_b" ]]; then
      triggers_b=$(echo "$desc_b" | grep -oiE '"[^"]*"' 2>/dev/null | tr -d '"' || true)
    fi

    if [[ -n "$triggers_a" ]] && [[ -n "$triggers_b" ]]; then
      # Strip quotes, split on comma to get individual trigger phrases
      # Check if any trigger phrase from A appears in B (or vice versa)
      overlap_detected=false
      while IFS= read -r phrase_a; do
        phrase_a=$(echo "$phrase_a" | tr -d '"' | sed 's/^ *//;s/ *$//' | tr '[:upper:]' '[:lower:]')
        [[ -z "$phrase_a" ]] && continue
        # Check if this phrase appears in triggers_b
        if echo "$triggers_b" | tr -d '"' | tr '[:upper:]' '[:lower:]' | grep -qiF "$phrase_a" 2>/dev/null; then
          overlap_detected=true
          break
        fi
      done <<< "$(echo "$triggers_a" | tr ',' '\n')"

      if [[ "$overlap_detected" == true ]]; then
        fail "Trigger overlap between '$skill_a' and '$skill_b': shared trigger phrases detected"
        overlap_found=true
      fi
    fi
  done
done

if [[ "$overlap_found" == false ]]; then
  pass "No trigger overlap detected"
fi

# --- Gate 3: Shared State Check ---

# Extract handoff files
handoff_1=""
handoff_2=""
handoff_3=""

for i in "${!skills[@]}"; do
  skill_md="$(get_skill_path $i)/SKILL.md"
  files=$(awk '/^## Handoff Paths/{found=1; next} /^## /{found=0} found && /\|.*\|.*\|/{print}' "$skill_md" 2>/dev/null || true)
  case $i in
    0) handoff_1="$files" ;;
    1) handoff_2="$files" ;;
    2) handoff_3="$files" ;;
  esac
done

get_handoff() {
  case $1 in
    0) echo "$handoff_1" ;;
    1) echo "$handoff_2" ;;
    2) echo "$handoff_3" ;;
  esac
}

state_conflict=false
for ((i=0; i<${#skills[@]}; i++)); do
  for ((j=i+1; j<${#skills[@]}; j++)); do
    skill_a="${skills[$i]}"
    skill_b="${skills[$j]}"
    files_a="$(get_handoff $i)"
    files_b="$(get_handoff $j)"

    if [[ -n "$files_a" ]] && [[ -n "$files_b" ]]; then
      common=$(comm -12 <(echo "$files_a" | tr '|' '\n' | sed 's/^ *//;s/ *$//' | sort -u) <(echo "$files_b" | tr '|' '\n' | sed 's/^ *//;s/ *$//' | sort -u) 2>/dev/null || true)
      if [[ -n "$common" ]]; then
        fail "Shared state conflict: '$skill_a' and '$skill_b' may write to overlapping files"
        state_conflict=true
      fi
    fi
  done
done

if [[ "$state_conflict" == false ]]; then
  pass "No shared state conflicts detected"
fi

# --- Gate 4: Dependency Cycle Check ---

# Extract dependencies
deps_1=""
deps_2=""
deps_3=""

for i in "${!skills[@]}"; do
  skill_md="$(get_skill_path $i)/SKILL.md"
  deps=$(awk '/^## Required Skill Loads/{found=1; next} /^## /{found=0} found && /\|.*\|.*\|/{print}' "$skill_md" 2>/dev/null || true)
  case $i in
    0) deps_1="$deps" ;;
    1) deps_2="$deps" ;;
    2) deps_3="$deps" ;;
  esac
done

get_deps() {
  case $1 in
    0) echo "$deps_1" ;;
    1) echo "$deps_2" ;;
    2) echo "$deps_3" ;;
  esac
}

cycle_found=false
for ((i=0; i<${#skills[@]}; i++)); do
  for ((j=i+1; j<${#skills[@]}; j++)); do
    skill_a="${skills[$i]}"
    skill_b="${skills[$j]}"
    deps_a="$(get_deps $i)"
    deps_b="$(get_deps $j)"

    a_requires_b=false
    if echo "$deps_a" | grep -qi "$skill_b" 2>/dev/null; then
      a_requires_b=true
    fi

    b_requires_a=false
    if echo "$deps_b" | grep -qi "$skill_a" 2>/dev/null; then
      b_requires_a=true
    fi

    if [[ "$a_requires_b" == true ]] && [[ "$b_requires_a" == true ]]; then
      fail "Dependency cycle: '$skill_a' requires '$skill_b' and '$skill_b' requires '$skill_a'"
      cycle_found=true
    fi
  done
done

if [[ "$cycle_found" == false ]]; then
  pass "No dependency cycles detected"
fi

# --- Gate 5: Reference File Integrity ---

for i in "${!skills[@]}"; do
  skill="${skills[$i]}"
  skill_md="$(get_skill_path $i)/SKILL.md"
  skill_dir="$(get_skill_path $i)"

  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    ref_path="$skill_dir/$ref"

    if [[ "$ref" == *"*"* ]]; then
      shopt -s nullglob
      matches=($ref_path)
      shopt -u nullglob
      if [[ ${#matches[@]} -eq 0 ]]; then
        fail "Skill '$skill': referenced glob '$ref' matches no files"
      fi
    elif [[ ! -f "$ref_path" ]]; then
      fail "Skill '$skill': referenced file '$ref' does not exist"
    fi
  done < <(grep -oE '(references|scripts|templates|assets)/[a-zA-Z0-9_./-]+\.(md|sh|py|json|txt)' "$skill_md" 2>/dev/null | sort -u || true)
done

# --- Summary ---

echo ""
echo "Stack: ${skills[*]}"
echo "Skills in stack: ${#skills[@]}/3"
echo ""

if [[ $errors -gt 0 ]]; then
  echo "Stack validation FAILED: $errors error(s) found" >&2
  exit 1
else
  echo "Stack validation PASSED: Combination is valid"
  exit 0
fi
