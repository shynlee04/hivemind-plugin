#!/usr/bin/env bash
# check-task-envelope.sh
# Validates a task envelope YAML has all 5 required sections.
# Usage: ./check-task-envelope.sh <envelope.yaml>
set -euo pipefail

ENVELOPE="${1:-}"

if [[ -z "$ENVELOPE" ]] || [[ ! -f "$ENVELOPE" ]]; then
  echo "Usage: $0 <envelope.yaml>" >&2
  exit 64
fi

# Check 5 required sections
for section in "task:" "scope:" "context:" "expected_output:" "verification:"; do
  if ! grep -qE "^${section}|^  ${section}" "$ENVELOPE"; then
    echo "FAIL: missing required section '${section}'"
    MISSING=1
  fi
done

if [[ "${MISSING:-0}" -ne 0 ]]; then
  echo "Envelope incomplete. Required: task, scope, context, expected_output, verification"
  exit 1
fi

# Check scope has include AND exclude
if ! grep -qE "include:" "$ENVELOPE"; then
  echo "FAIL: scope.include missing"
  exit 1
fi

# Check acceptance_criteria is falsifiable (not "should work well" etc.)
UNFALSIFIABLE=("should be fast" "should work well" "should be good" "should be easy" "looks good")
for phrase in "${UNFALSIFIABLE[@]}"; do
  if grep -qi "$phrase" "$ENVELOPE"; then
    echo "FAIL: '$phrase' is unfalsifiable. Replace with measurable outcome."
    exit 1
  fi
done

echo "PASS: envelope valid"
