#!/usr/bin/env bash
# check-iteration-budget.sh
# Enforces max-iteration cap (5) for a phase loop.
# Usage: ./check-iteration-budget.sh <loop_id>
set -euo pipefail

LOOP_ID="${1:-}"

if [[ -z "$LOOP_ID" ]]; then
  echo "Usage: $0 <loop_id>" >&2
  exit 64
fi

CURSOR=".hivemind/state/loops/$LOOP_ID/cursor.yaml"

if [[ ! -f "$CURSOR" ]]; then
  echo "FAIL: cursor not found at $CURSOR"
  exit 1
fi

ITERATION=$(grep -E "^iteration:" "$CURSOR" | awk '{print $2}')
MAX=$(grep -E "^max_iterations:" "$CURSOR" | awk '{print $2}')

if [[ -z "$ITERATION" ]] || [[ -z "$MAX" ]]; then
  echo "FAIL: cursor missing iteration or max_iterations"
  exit 1
fi

echo "Current iteration: $ITERATION / $MAX"

if [[ "$ITERATION" -ge "$MAX" ]]; then
  echo "HARD STOP: max iterations reached"
  exit 2
elif [[ "$ITERATION" -ge 3 ]]; then
  echo "WARN: $((MAX - ITERATION)) iterations remaining"
  exit 1
else
  echo "OK: $((MAX - ITERATION)) iterations remaining"
  exit 0
fi
