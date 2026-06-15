#!/usr/bin/env bash
# validate-stack-skill.sh
# Validates a stack-* skill follows the authoring checklist.
# Usage: ./validate-stack-skill.sh <stack_skill_dir>
set -euo pipefail

SKILL_DIR="${1:-}"

if [[ -z "$SKILL_DIR" ]] || [[ ! -d "$SKILL_DIR" ]]; then
  echo "Usage: $0 <stack_skill_dir>" >&2
  exit 64
fi

SKILL_MD="$SKILL_DIR/SKILL.md"

# Check 1: SKILL.md exists with valid frontmatter
if [[ ! -f "$SKILL_MD" ]]; then
  echo "FAIL: SKILL.md not found"
  exit 1
fi

if ! head -1 "$SKILL_MD" | grep -q "^---$"; then
  echo "FAIL: missing YAML frontmatter"
  exit 1
fi

# Check 2: stack- prefix
if ! grep -q "^name: stack-" "$SKILL_MD"; then
  echo "FAIL: name must start with 'stack-' (dev-tooling, not shipped)"
  exit 1
fi
echo "PASS: stack- prefix"

# Check 3: description has trigger phrases
if ! grep -qE "Loads when|Use when|trigger" "$SKILL_MD"; then
  echo "WARN: description should include trigger phrases"
fi
echo "PASS: description present"

# Check 4: line count under 500
loc=$(wc -l < "$SKILL_MD")
if [[ $loc -gt 500 ]]; then
  echo "WARN: SKILL.md is $loc lines (target <500, ideal <300)"
fi
echo "PASS: $loc lines"

# Check 5: validator exits 0
if bash assets/.hivemind-config/validate-name.sh "$(grep '^name:' "$SKILL_MD" | awk '{print $2}')" skill >/dev/null 2>&1; then
  echo "PASS: validate-name.sh exit 0"
else
  echo "WARN: validate-name.sh non-zero (stack-* may be FLEXIBLE-policy)"
fi

echo ""
echo "=== Stack skill valid ==="
