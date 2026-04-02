#!/usr/bin/env bash
set -euo pipefail

# validate-skill.sh — Validates a skill pack structure, frontmatter, and terminology compliance
# Usage: bash scripts/validate-skill.sh <skill-directory>
# Exit 0 = valid, Exit 1 = invalid (error messages on stderr)

readonly SCRIPT_NAME="$(basename "$0")"
readonly SKILL_DIR="${1:?Usage: $SCRIPT_NAME <skill-directory>}"
readonly SKILL_MD="$SKILL_DIR/SKILL.md"

errors=0

fail() { echo "FAIL: $1" >&2; errors=$((errors + 1)); }
pass() { echo "PASS: $1"; }

# --- Gate 1: File Existence ---

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "Error: Directory '$SKILL_DIR' does not exist" >&2
  exit 1
fi

if [[ ! -f "$SKILL_MD" ]]; then
  fail "SKILL.md not found in $SKILL_DIR"
  echo "Cannot continue without SKILL.md" >&2
  exit 1
fi

pass "SKILL.md exists"

# --- Gate 2: Frontmatter Structure ---

if ! head -1 "$SKILL_MD" | grep -q '^---$'; then
  fail "SKILL.md missing YAML frontmatter opening delimiter (---)"
fi

# Extract frontmatter block (lines between first --- and second ---)
frontmatter=$(awk 'NR==1{next} /^---$/{exit} {print}' "$SKILL_MD")
if [[ -z "$frontmatter" ]]; then
  fail "SKILL.md has empty or missing frontmatter block"
  echo "Cannot continue without frontmatter" >&2
  exit 1
fi

pass "Frontmatter block present"

# --- Gate 3: Required Fields ---

name=$(echo "$frontmatter" | grep '^name:' | head -1 | sed 's/^name: *//' | tr -d '"' | tr -d "'")
if [[ -z "$name" ]]; then
  fail "Required field 'name' missing from frontmatter"
else
  pass "name field present: '$name'"
fi

description=$(echo "$frontmatter" | grep '^description:' | head -1 | sed 's/^description: *//')
if [[ -z "$description" ]]; then
  fail "Required field 'description' missing from frontmatter"
else
  pass "description field present"
fi

# --- Gate 4: Name Validation ---

if [[ -n "$name" ]]; then
  if ! echo "$name" | grep -qE '^[a-z0-9]+(-[a-z0-9]+)*$'; then
    fail "Invalid name format '$name'. Must be lowercase kebab-case"
  else
    pass "Name format valid: '$name'"
  fi

  name_len=${#name}
  if [[ $name_len -gt 64 ]]; then
    fail "Name '$name' exceeds 64 characters (actual: $name_len)"
  else
    pass "Name length valid: $name_len chars"
  fi

  dir_name=$(basename "$SKILL_DIR")
  if [[ "$name" != "$dir_name" ]]; then
    fail "Name '$name' does not match directory name '$dir_name'"
  else
    pass "Name matches directory name"
  fi
fi

# --- Gate 5: Description Validation ---

if [[ -n "$description" ]]; then
  desc_len=${#description}
  if [[ $desc_len -gt 1024 ]]; then
    fail "Description exceeds 1024 characters (actual: $desc_len)"
  else
    pass "Description length valid: $desc_len chars"
  fi
fi

# --- Gate 6: Banned Fields ---

if echo "$frontmatter" | grep -q '^compatibility:'; then
  fail "Banned field 'compatibility' found in frontmatter"
else
  pass "No banned 'compatibility' field"
fi

# --- Gate 7: Terminology Compliance ---

# Check for banned terminology used as recommended (not as examples of what to avoid).
# A line is a violation if it contains the banned term AND does NOT contain
# exclusion keywords that indicate it's documentation about what NOT to use.
banned_terms_found=0

check_banned_term() {
  local term="$1"
  local label="$2"
  local matches
  matches=$(grep -ri "$term" "$SKILL_DIR" --include="*.md" 2>/dev/null || true)
  if [[ -z "$matches" ]]; then
    return 0
  fi

  # Filter out legitimate uses — keep only lines that look like actual usage
  local real_violations
  real_violations=$(echo "$matches" | grep -vi "not " | grep -vi "no '" | grep -vi "avoid" | grep -vi "banned" | grep -vi "instead" | grep -vi "uses " | grep -vi "platform" | grep -vi "compat" | grep -vi "example" | grep -vi "wrong" | grep -vi "do not" | grep -vi "don't" | grep -vi "should not" | grep -vi "never use" | grep -vi "replace" | grep -v '"CLAUDE' | grep -v '"Claude' | grep -v '| CLAUDE' | grep -v '| Claude' || true)

  if [[ -n "$real_violations" ]]; then
    fail "Banned term '$label' used as recommended terminology"
    return 1
  fi
  return 0
}

check_banned_term "CLAUDE\.md" "CLAUDE.md"
check_banned_term "CLAUDE\.local\.md" "CLAUDE.local.md"
# "Claude" check — exclude "Claude Code" (platform name) references
if grep -ri "Claude " "$SKILL_DIR" --include="*.md" 2>/dev/null | grep -v "Claude Code" | grep -vi "not " | grep -vi "no '" | grep -vi "avoid" | grep -vi "banned" | grep -vi "instead" | grep -vi "uses " | grep -vi "platform" | grep -vi "compat" | grep -vi "example" | grep -vi "wrong" | grep -vi "do not" | grep -vi "don't" | grep -vi "should not" | grep -vi "never use" | grep -vi "replace" | grep -v '"CLAUDE' | grep -v '"Claude' | grep -v '| CLAUDE' | grep -v '| Claude' | grep -q .; then
  fail "Banned term 'Claude' used to refer to the Agent (use 'Agent' instead)"
  banned_terms_found=1
fi
# Additional filter: remove "Claude Code" platform references
if grep -ri "Claude " "$SKILL_DIR" --include="*.md" 2>/dev/null | grep -vi "Claude Code" | grep -vi "not " | grep -vi "no '" | grep -vi "avoid" | grep -vi "banned" | grep -vi "instead" | grep -vi "uses " | grep -vi "platform" | grep -vi "compat" | grep -vi "example" | grep -vi "wrong" | grep -vi "do not" | grep -vi "don't" | grep -vi "should not" | grep -vi "never use" | grep -vi "replace" | grep -v '"CLAUDE' | grep -v '"Claude' | grep -v '| CLAUDE' | grep -v '| Claude' | grep -q .; then
  fail "Banned term 'Claude' used to refer to the Agent (use 'Agent' instead)"
  banned_terms_found=1
fi

if [[ $banned_terms_found -eq 0 ]]; then
  pass "No banned terminology found"
fi

# --- Gate 8: Referenced Files Exist ---

refs_found=0
refs_missing=0

while IFS= read -r ref; do
  [[ -z "$ref" ]] && continue
  ref_path="$SKILL_DIR/$ref"

  if [[ "$ref" == *"*"* ]]; then
    shopt -s nullglob
    matches=($ref_path)
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
done < <(grep -oE '(references|scripts|templates|assets)/[a-zA-Z0-9_./-]+\.(md|sh|py|json|txt)' "$SKILL_MD" 2>/dev/null | sort -u)

if [[ $refs_found -gt 0 && $refs_missing -eq 0 ]]; then
  pass "All $refs_found referenced files exist"
elif [[ $refs_found -eq 0 && $refs_missing -eq 0 ]]; then
  pass "No file references to validate"
fi

# --- Summary ---

echo ""
if [[ $errors -gt 0 ]]; then
  echo "Validation FAILED: $errors error(s) found" >&2
  exit 1
else
  echo "Validation PASSED: All checks passed"
  exit 0
fi
