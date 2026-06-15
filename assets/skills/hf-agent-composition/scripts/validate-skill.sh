#!/usr/bin/env bash
# validate-skill.sh — Validates gsd-agent-composition SKILL.md frontmatter + structure
# Usage: bash scripts/validate-skill.sh [<skill-directory>]
# Exits non-zero on failure, zero on pass.

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SKILL_DIR="${1:-$SCRIPT_DIR/..}"
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

# --- Gate 1: SKILL.md Existence ---

if [[ ! -f "$SKILL_FILE" ]]; then
  echo "FAIL: SKILL.md not found at $SKILL_FILE" >&2
  exit 1
fi

pass "SKILL.md exists"

# --- Gate 2: Frontmatter Structure ---

if ! head -1 "$SKILL_FILE" | grep -q '^---$'; then
  fail "No YAML frontmatter (file must start with ---)"
  echo "Cannot continue without frontmatter" >&2
  exit 1
fi

pass "Frontmatter delimiter present"

# Extract frontmatter block (lines between first --- and second ---)
frontmatter=$(awk 'NR==1{next} /^---$/{exit} {print}' "$SKILL_FILE")
if [[ -z "$frontmatter" ]]; then
  fail "Empty or missing frontmatter block"
  echo "Cannot continue without frontmatter" >&2
  exit 1
fi

pass "Frontmatter block present"

# --- Gate 3: Required Fields ---

NAME=$(echo "$frontmatter" | grep '^name:' | head -1 | sed 's/^name: *//' | tr -d '"' | tr -d "'")
if [[ -z "$NAME" ]]; then
  fail "Missing 'name' field in frontmatter"
else
  pass "name field present: '$NAME'"
fi

DESC=$(echo "$frontmatter" | grep '^description:' | head -1 | sed 's/^description: *//')
if [[ -z "$DESC" ]]; then
  fail "Missing 'description' field in frontmatter"
else
  pass "description field present"
fi

# --- Gate 4: Name Validation ---

if [[ -n "$NAME" ]]; then
  if ! echo "$NAME" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*$'; then
    fail "Invalid name format '$NAME'. Must be lowercase kebab-case"
  else
    pass "Name format valid: '$NAME'"
  fi

  name_len=${#NAME}
  if [[ $name_len -gt 64 ]]; then
    fail "Name '$NAME' exceeds 64 characters (actual: $name_len)"
  else
    pass "Name length valid: $name_len chars"
  fi

  dir_name=$(basename "$SKILL_DIR")
  if [[ "$NAME" != "$dir_name" ]]; then
    fail "Name '$NAME' does not match directory name '$dir_name'"
  else
    pass "Name matches directory name"
  fi
fi

# --- Gate 5: Description Validation ---

if [[ -n "$DESC" ]]; then
  desc_len=${#DESC}
  if [[ $desc_len -gt 1024 ]]; then
    fail "Description exceeds 1024 characters (actual: $desc_len)"
  else
    pass "Description length valid: $desc_len chars"
  fi

  if ! echo "$DESC" | grep -qi 'use when\|triggers on\|when user\|when.*agent'; then
    fail "Description may lack trigger keywords ('Use when...', 'Triggers on...')"
  else
    pass "Description contains trigger keywords"
  fi
fi

# --- Gate 6: SKILL.md Size ---

LINES=$(wc -l < "$SKILL_FILE" | tr -d ' ')
if [[ "$LINES" -gt 500 ]]; then
  fail "SKILL.md has $LINES lines (target: <500 for progressive disclosure)"
else
  pass "SKILL.md line count: $LINES (target: <500)"
fi

# --- Gate 7: Required XML Blocks ---

for BLOCK in "role" "execution_flow" "structured_returns" "success_criteria" "project_context"; do
  if ! grep -q "<$BLOCK>" "$SKILL_FILE" 2>/dev/null; then
    if grep -q "$BLOCK" "$SKILL_FILE" 2>/dev/null; then
      pass "<$BLOCK> referenced in body (OK for P2 pattern)"
    else
      fail "SKILL.md lacks <$BLOCK> block and no reference found"
    fi
  else
    pass "<$BLOCK> block present"
  fi
done

# --- Gate 8: Mandatory Initial Read ---

if ! grep -q "Mandatory Initial Read" "$SKILL_FILE" 2>/dev/null; then
  fail "Missing 'Mandatory Initial Read' enforcement text"
else
  pass "Mandatory Initial Read enforcement present"
fi

# --- Gate 9: Reference Files ---

REFS_DIR="$SKILL_DIR/references"
if [[ -d "$REFS_DIR" ]]; then
  REF_COUNT=$(find "$REFS_DIR" -name "*.md" | wc -l | tr -d ' ')
  if [[ "$REF_COUNT" -lt 3 ]]; then
    fail "Only $REF_COUNT reference files (P2 pattern recommends 3-8)"
  else
    pass "Reference files: $REF_COUNT (P2 recommends 3-8)"
  fi
else
  fail "No references/ directory (P2 pattern expects references)"
fi

# --- Gate 10: Referenced Files Exist ---

refs_found=0
refs_missing=0

while IFS= read -r ref; do
  [[ -z "$ref" ]] && continue
  ref_path="$SKILL_DIR/$ref"

  if [[ "$ref" == *"*"* ]]; then
    shopt -s nullglob
    matches=("$ref_path")
    shopt -u nullglob
    if [[ ${#matches[@]} -eq 0 ]]; then
      fail "Referenced glob pattern '$ref' matches no files"
      refs_missing=$((refs_missing + 1))
    else
      refs_found=$((refs_found + ${#matches[@]}))
    fi
  elif [[ -f "$ref_path" ]]; then
    refs_found=$((refs_found + 1))
  else
    fail "Referenced file '$ref' does not exist"
    refs_missing=$((refs_missing + 1))
  fi
done < <(grep -oE '(references|scripts|templates|assets)/[a-zA-Z0-9_./-]+\.(md|sh|py|json|txt)' "$SKILL_FILE" 2>/dev/null | sort -u)

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
