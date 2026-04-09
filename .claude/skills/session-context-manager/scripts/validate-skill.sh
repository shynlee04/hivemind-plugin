#!/bin/bash
# validate-skill.sh — Session Context Manager skill validation
# Exits 0 if valid, non-zero if issues found

set -e

SKILL_DIR="${1:-.}"

echo "=== Session Context Manager Skill Validation ==="

# Check SKILL.md exists
if [[ ! -f "$SKILL_DIR/SKILL.md" ]]; then
  echo "ERROR: SKILL.md not found"
  exit 1
fi

# Check YAML frontmatter
if ! grep -q "^---" "$SKILL_DIR/SKILL.md"; then
  echo "ERROR: Missing YAML frontmatter delimiter"
  exit 1
fi

# Check required frontmatter fields
required_fields=("name:" "description:" "version:" "metadata:" "layer:" "role:" "pattern:")
for field in "${required_fields[@]}"; do
  if ! grep -q "$field" "$SKILL_DIR/SKILL.md" | head -5; then
    # Check in first 10 lines after ---
    if ! head -10 "$SKILL_DIR/SKILL.md" | grep -q "$field"; then
      echo "WARNING: Field '$field' not found in frontmatter"
    fi
  fi
done

# Check name field
if ! grep -A1 "^name:" "$SKILL_DIR/SKILL.md" | grep -q "session-context-manager"; then
  echo "ERROR: name field must be 'session-context-manager'"
  exit 1
fi

# Check description has trigger phrases
description_line=$(grep "^description:" "$SKILL_DIR/SKILL.md" | head -1)
trigger_phrases=("manage session context" "track phase progress" "persist context" "load session state" "maintain context")
has_trigger=false
for phrase in "${trigger_phrases[@]}"; do
  if echo "$description_line" | grep -qi "$phrase"; then
    has_trigger=true
    break
  fi
done

if ! $has_trigger; then
  echo "ERROR: Description lacks trigger phrases"
  echo "Must contain at least one of: ${trigger_phrases[*]}"
  exit 1
fi

# Check pattern is P2
if ! grep -q "pattern: P2" "$SKILL_DIR/SKILL.md"; then
  echo "ERROR: Pattern must be P2 for this skill"
  exit 1
fi

# Check references directory exists
if [[ ! -d "$SKILL_DIR/references" ]]; then
  echo "ERROR: references/ directory not found"
  exit 1
fi

# Check session-context-protocol.md exists
if [[ ! -f "$SKILL_DIR/references/session-context-protocol.md" ]]; then
  echo "ERROR: references/session-context-protocol.md not found"
  exit 1
fi

# Check references/session-context-protocol.md has content (not a stub)
ref_lines=$(wc -l < "$SKILL_DIR/references/session-context-protocol.md")
if [[ "$ref_lines" -lt 100 ]]; then
  echo "ERROR: references/session-context-protocol.md is too short (stub detected)"
  exit 1
fi

# Check SKILL.md body uses imperative form (has checklists)
if ! grep -q "\[ \]" "$SKILL_DIR/SKILL.md"; then
  echo "ERROR: SKILL.md body should contain checklists [ ]"
  exit 1
fi

# Check for procedures over declarations
if grep -qi "this skill handles\|the agent should\|it is designed to" "$SKILL_DIR/SKILL.md"; then
  echo "WARNING: SKILL.md contains declarative phrases (should use imperative)"
fi

# Count SKILL.md lines
skill_lines=$(wc -l < "$SKILL_DIR/SKILL.md")
if [[ "$skill_lines" -gt 400 ]]; then
  echo "WARNING: SKILL.md is ${skill_lines} lines (P2 target: 200-400)"
fi

echo "=== Validation PASSED ==="
echo "Files checked:"
echo "  - SKILL.md ($skill_lines lines)"
echo "  - references/session-context-protocol.md ($ref_lines lines)"
echo "  - Pattern: P2"
echo "  - Trigger phrases: present"
exit 0
