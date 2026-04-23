#!/usr/bin/env bash
# check-markup.sh — Validates XML block structure in GSD agent definition files
# Exits non-zero on structural errors, zero on pass.

set -euo pipefail

TARGET="${1:-.}"
ERRORS=()
WARNINGS=()

# Find all .md files to check
if [[ -d "$TARGET" ]]; then
  FILES=$(find "$TARGET" -name "*.md" -not -path "*/node_modules/*" | head -20)
else
  FILES="$TARGET"
fi

for FILE in $FILES; do
  # Skip if not an agent file (no frontmatter with mode: subagent)
  if ! grep -q 'mode: subagent' "$FILE" 2>/dev/null; then
    continue
  fi

  AGENT_NAME=$(basename "$FILE" .md)

  # Check for required blocks
  if ! grep -q '<role>' "$FILE"; then
    ERRORS+=("$AGENT_NAME: Missing <role> block")
  fi

  if ! grep -q '<execution_flow>' "$FILE"; then
    # Some agents (doc-verifier, user-profiler) may not have execution_flow
    if ! grep -q '<project_context>' "$FILE" && ! grep -q '<input>' "$FILE"; then
      WARNINGS+=("$AGENT_NAME: No <execution_flow> and no alternative structure")
    fi
  fi

  # Check steps have name attributes
  if grep -q '<step ' "$FILE"; then
    STEPS_WITHOUT_NAME=$(grep '<step ' "$FILE" | grep -cv 'name=' || true)
    if [[ $STEPS_WITHOUT_NAME -gt 0 ]]; then
      ERRORS+=("$AGENT_NAME: $STEPS_WITHOUT_NAME <step> block(s) missing name= attribute")
    fi
  fi

  # Check for Mandatory Initial Read
  if ! grep -q 'Mandatory Initial Read' "$FILE"; then
    WARNINGS+=("$AGENT_NAME: Missing 'Mandatory Initial Read' enforcement")
  fi

  # Check for structured_returns if execution_flow exists
  if grep -q '<execution_flow>' "$FILE" && ! grep -q '<structured_returns>' "$FILE"; then
    WARNINGS+=("$AGENT_NAME: Has <execution_flow> but no <structured_returns>")
  fi

  # Check XML blocks are properly closed
  for BLOCK in role execution_flow structured_returns success_criteria project_context deviation_rules checkpoint_protocol; do
    OPEN=$(grep -c "<$BLOCK>" "$FILE" || true)
    CLOSE=$(grep -c "</$BLOCK>" "$FILE" || true)
    if [[ $OPEN -ne $CLOSE ]]; then
      ERRORS+=("$AGENT_NAME: <$BLOCK> opened $OPEN times, closed $CLOSE times")
    fi
  done

  # Check step name conventions
  if grep -q '<step name=' "$FILE"; then
    STEP_NAMES=$(grep '<step name=' "$FILE" | sed 's/.*name="\([^"]*\)".*/\1/')
    for STEP_NAME in $STEP_NAMES; do
      if [[ ! "$STEP_NAME" =~ ^(load_|analyze_|generate_|run_|verify_|report|record_|determine_|execute_|debug_) ]]; then
        WARNINGS+=("$AGENT_NAME: Step '$STEP_NAME' doesn't follow naming convention")
      fi
    done
  fi
done

# Report
EXIT_CODE=0

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  echo "WARNINGS:"
  for W in "${WARNINGS[@]}"; do
    echo "  ⚠️  $W"
  done
fi

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo "ERRORS:"
  for E in "${ERRORS[@]}"; do
    echo "  ❌ $E"
  done
  EXIT_CODE=1
fi

if [[ ${#ERRORS[@]} -eq 0 && ${#WARNINGS[@]} -eq 0 ]]; then
  echo "PASS: All agent files have valid XML markup structure"
fi

exit $EXIT_CODE
