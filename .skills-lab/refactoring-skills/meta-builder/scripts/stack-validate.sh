#!/usr/bin/env bash
set -euo pipefail

# stack-validate.sh — Checks if a proposed skill combination is valid
# Usage: bash scripts/stack-validate.sh <skill1> [skill2] [skill3]
# Validates: no trigger conflicts, no shared state mutation, no dependency cycles
# Exit 0 = valid, Exit 1 = invalid

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

# --- Gate 1: All Skills Exist ---

skill_base="$(dirname "$0")/.."

for skill in "${skills[@]}"; do
  if [[ -f "$skill_base/$skill/SKILL.md" ]]; then
    pass "Skill '$skill' exists"
  else
    fail "Skill '$skill' not found at $skill_base/$skill/SKILL.md"
  fi
done

if [[ $errors -gt 0 ]]; then
  echo "Stack validation FAILED: Skills missing" >&2
  exit 1
fi

# --- Gate 2: Trigger Overlap Check ---

# Extract description (trigger surface) from each skill
declare -A descriptions
for skill in "${skills[@]}"; do
  desc=$(awk '/^---$/{n++; next} n==1 && /^description:/{sub(/^description: */,""); print; exit}' "$skill_base/$skill/SKILL.md" 2>/dev/null || true)
  descriptions["$skill"]="$desc"
done

# Check for overlapping trigger phrases between pairs
overlap_found=false
for ((i=0; i<${#skills[@]}; i++)); do
  for ((j=i+1; j<${#skills[@]}; j++)); do
    skill_a="${skills[$i]}"
    skill_b="${skills[$j]}"
    desc_a="${descriptions[$skill_a]}"
    desc_b="${descriptions[$skill_b]}"

    # Extract trigger keywords (phrases after "Triggers:", "Use when")
    triggers_a=$(echo "$desc_a" | grep -oiE '(use when|triggers?)[^"]*' 2>/dev/null || true)
    triggers_b=$(echo "$desc_b" | grep -oiE '(use when|triggers?)[^"]*' 2>/dev/null || true)

    # Check for shared trigger words (3+ character words)
    if [[ -n "$triggers_a" ]] && [[ -n "$triggers_b" ]]; then
      shared=$(echo "$triggers_a $triggers_b" | tr ' ' '\n' | sort | uniq -d | grep -E '.{3,}' 2>/dev/null || true)
      if [[ -n "$shared" ]]; then
        fail "Trigger overlap between '$skill_a' and '$skill_b': shared triggers detected"
        overlap_found=true
      fi
    fi
  done
done

if [[ "$overlap_found" == false ]]; then
  pass "No trigger overlap detected"
fi

# --- Gate 3: Shared State Check ---

# Check if multiple skills write to the same files
declare -A handoff_files
for skill in "${skills[@]}"; do
  # Extract file references from Handoff Paths section
  files=$(awk '/^## Handoff Paths/{found=1; next} /^## /{found=0} found && /\|.*\|.*\|/{print}' "$skill_base/$skill/SKILL.md" 2>/dev/null || true)
  if [[ -n "$files" ]]; then
    handoff_files["$skill"]="$files"
  fi
done

# Check for overlapping file paths
state_conflict=false
for ((i=0; i<${#skills[@]}; i++)); do
  for ((j=i+1; j<${#skills[@]}; j++)); do
    skill_a="${skills[$i]}"
    skill_b="${skills[$j]}"
    files_a="${handoff_files[$skill_a]:-}"
    files_b="${handoff_files[$skill_b]:-}"

    if [[ -n "$files_a" ]] && [[ -n "$files_b" ]]; then
      # Check for common file patterns
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

# Extract "Required Skill Loads" from each skill
declare -A dependencies
for skill in "${skills[@]}"; do
  deps=$(awk '/^## Required Skill Loads/{found=1; next} /^## /{found=0} found && /\|.*\|.*\|/{print}' "$skill_base/$skill/SKILL.md" 2>/dev/null || true)
  dependencies["$skill"]="$deps"
done

# Check for cycles: if A requires B and B requires A
cycle_found=false
for ((i=0; i<${#skills[@]}; i++)); do
  for ((j=i+1; j<${#skills[@]}; j++)); do
    skill_a="${skills[$i]}"
    skill_b="${skills[$j]}"
    deps_a="${dependencies[$skill_a]:-}"
    deps_b="${dependencies[$skill_b]:-}"

    # Check if A requires B
    a_requires_b=false
    if echo "$deps_a" | grep -qi "$skill_b" 2>/dev/null; then
      a_requires_b=true
    fi

    # Check if B requires A
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

for skill in "${skills[@]}"; do
  skill_md="$skill_base/$skill/SKILL.md"

  # Extract referenced files
  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    ref_path="$skill_base/$skill/$ref"

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
