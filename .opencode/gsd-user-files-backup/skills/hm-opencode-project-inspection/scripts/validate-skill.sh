#!/usr/bin/env bash
# validate-skill.sh — Validates hm-opencode-project-inspection skill structure
# Usage: bash scripts/validate-skill.sh [<skill-directory>]
# Exits non-zero on failure, zero on pass.

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SKILL_DIR="$(cd "${1:-$SCRIPT_DIR/..}" && pwd)"
readonly SKILL_FILE="$SKILL_DIR/SKILL.md"

ERRORS=()

fail() { ERRORS+=("FAIL: $1"); }
pass() { echo "PASS: $1"; }

# --- Argument Validation ---

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "FAIL: Directory '$SKILL_DIR' does not exist" >&2
  exit 1
fi

pass "Skill directory exists: $SKILL_DIR"

# --- Gate 1: Required Files ---

if [[ ! -f "$SKILL_FILE" ]]; then
  echo "FAIL: SKILL.md not found at $SKILL_FILE" >&2
  exit 1
fi

pass "SKILL.md exists"

if [[ ! -d "$SKILL_DIR/references" ]]; then
  fail "references/ directory missing"
else
  pass "references/ directory exists"
fi

# --- Gate 2: Frontmatter Validation ---

if ! head -1 "$SKILL_FILE" | grep -q '^---$'; then
  fail "No YAML frontmatter delimiter"
  echo "Cannot continue without frontmatter" >&2
  exit 1
fi

pass "Frontmatter delimiter present"

frontmatter=$(awk 'NR==1{next} /^---$/{exit} {print}' "$SKILL_FILE")
if [[ -z "$frontmatter" ]]; then
  fail "Empty frontmatter block"
  echo "Cannot continue without frontmatter" >&2
  exit 1
fi

pass "Frontmatter block present"

# --- Gate 3: Required Fields ---

NAME=$(echo "$frontmatter" | grep '^name:' | head -1 | sed 's/^name: *//' | tr -d '"' | tr -d "'")
if [[ -z "$NAME" ]]; then
  fail "Missing 'name' field"
else
  pass "name field present: '$NAME'"
fi

DESC=$(echo "$frontmatter" | grep '^description:' | head -1 | sed 's/^description: *//')
if [[ -z "$DESC" ]]; then
  fail "Missing 'description' field"
else
  pass "description field present"
fi

# --- Gate 4: Name Validation ---

if [[ -n "$NAME" ]]; then
  dir_name=$(basename "$SKILL_DIR")
  if [[ "$NAME" != "$dir_name" ]]; then
    fail "Name '$NAME' does not match directory name '$dir_name'"
  else
    pass "Name matches directory name"
  fi
fi

# --- Gate 5: Reference Files ---

refs_found=0
refs_missing=0

while IFS= read -r ref; do
  [[ -z "$ref" ]] && continue
  ref_path="$SKILL_DIR/$ref"

  if [[ -f "$ref_path" ]]; then
    refs_found=$((refs_found + 1))
  else
    fail "Referenced file '$ref' does not exist"
    refs_missing=$((refs_missing + 1))
  fi
done < <(grep -oE 'references/[a-zA-Z0-9_./-]+\.md' "$SKILL_FILE" 2>/dev/null | sort -u)

if [[ $refs_found -gt 0 && $refs_missing -eq 0 ]]; then
  pass "All $refs_found referenced files exist"
elif [[ $refs_found -eq 0 && $refs_missing -eq 0 ]]; then
  pass "No file references to validate"
fi

# --- Summary ---

echo ""
if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo "VALIDATION FAILED: ${#ERRORS[@]} error(s) found" >&2
  for ERR in "${ERRORS[@]}"; do
    echo "  $ERR" >&2
  done
  exit 1
else
  echo "Validation PASSED: All checks passed"
  exit 0
fi
