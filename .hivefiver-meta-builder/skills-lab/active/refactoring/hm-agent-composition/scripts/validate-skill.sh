#!/usr/bin/env bash
# validate-skill.sh — Validates gsd-agent-composition SKILL.md frontmatter + structure
# Exits non-zero on failure, zero on pass.

set -euo pipefail

SKILL_DIR="${1:-.}"
SKILL_FILE="$SKILL_DIR/SKILL.md"

ERRORS=()

# Check SKILL.md exists
if [[ ! -f "$SKILL_FILE" ]]; then
  echo "FAIL: SKILL.md not found at $SKILL_FILE"
  exit 1
fi

# Check frontmatter exists
if ! head -1 "$SKILL_FILE" | grep -q '^---$'; then
  ERRORS+=("FAIL: No YAML frontmatter (file must start with ---)")
fi

# Check name field
NAME=$(sed -n '/^---$/,/^---$/p' "$SKILL_FILE" | grep '^name:' | sed 's/^name: *//')
if [[ -z "$NAME" ]]; then
  ERRORS+=("FAIL: Missing 'name' field in frontmatter")
elif [[ ! "$NAME" =~ ^[a-z0-9-]+$ ]]; then
  ERRORS+=("FAIL: name '$NAME' contains invalid chars (lowercase, numbers, hyphens only)")
elif [[ ${#NAME} -gt 64 ]]; then
  ERRORS+=("FAIL: name '${#NAME}' chars exceeds 64 char limit")
fi

# Check description field
DESC=$(sed -n '/^---$/,/^---$/p' "$SKILL_FILE" | grep '^description:' | sed 's/^description: *//')
if [[ -z "$DESC" ]]; then
  ERRORS+=("FAIL: Missing 'description' field in frontmatter")
elif [[ ${#DESC} -gt 1024 ]]; then
  ERRORS+=("FAIL: description (${#DESC} chars) exceeds 1024 char limit")
fi

# Check description has trigger keywords
if ! echo "$DESC" | grep -qi 'use when\|triggers on\|when user\|when.*agent'; then
  ERRORS+=("WARN: Description may lack trigger keywords ('Use when...', 'Triggers on...')")
fi

# Check SKILL.md line count (target <500)
LINES=$(wc -l < "$SKILL_FILE")
if [[ $LINES -gt 500 ]]; then
  ERRORS+=("FAIL: SKILL.md has $LINES lines (target: <500 for progressive disclosure)")
fi

# Check required XML blocks
for BLOCK in "role" "execution_flow" "structured_returns" "success_criteria" "project_context"; do
  if ! grep -q "<$BLOCK>" "$SKILL_FILE" 2>/dev/null; then
    # Check references mention it
    if grep -q "$BLOCK" "$SKILL_FILE" 2>/dev/null; then
      : # Referenced in body, OK for SKILL.md
    else
      ERRORS+=("WARN: SKILL.md lacks <$BLOCK> block (may be covered in references)")
    fi
  fi
done

# Check "Mandatory Initial Read" text exists
if ! grep -q "Mandatory Initial Read" "$SKILL_FILE" 2>/dev/null; then
  ERRORS+=("FAIL: Missing 'Mandatory Initial Read' enforcement text")
fi

# Check reference files exist
REFS_DIR="$SKILL_DIR/references"
if [[ -d "$REFS_DIR" ]]; then
  REF_COUNT=$(find "$REFS_DIR" -name "*.md" | wc -l)
  if [[ $REF_COUNT -lt 3 ]]; then
    ERRORS+=("WARN: Only $REF_COUNT reference files (P2 pattern recommends 3-8)")
  fi
else
  ERRORS+=("WARN: No references/ directory (P2 pattern expects references)")
fi

# Report
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  echo "PASS: $SKILL_FILE validates successfully"
  echo "  - Name: $NAME"
  echo "  - Description: ${#DESC} chars"
  echo "  - Lines: $LINES"
  echo "  - References: $REF_COUNT files"
  exit 0
else
  echo "VALIDATION FAILED: $SKILL_FILE"
  for ERR in "${ERRORS[@]}"; do
    echo "  $ERR"
  done
  exit 1
fi
