#!/usr/bin/env bash
# gx-signal-hard-stop.sh — S6: HARD STOP Compliance
# CRs: CR-13 (S6)
# Score: 100 if HARD STOP exists and is respected, 0 if violated, 50 if absent
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="hard_stop_compliance"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
TODO_FILE="$STATE_DIR/todo.json"

if [ ! -f "$TODO_FILE" ]; then
  jq -n \
    --arg signal "$SIGNAL_NAME" \
    --argjson score 50 \
    --arg formula 'HARD STOP present and respected => 100; violated => 0; absent => 50' \
    '{
      signal: $signal,
      score: $score,
      detail: {
        hard_stop_found: false,
        respected: true,
        reason: "todo file missing",
        formula: $formula,
        sources: [".hivemind/state/todo.json"]
      }
    }'
  exit 0
fi

# Find HARD STOP item index
hard_stop_index=$(jq '[.[] | .content // ""] | to_entries | map(select(.value | test("HARD.?STOP"; "i"))) | .[0].key // -1' "$TODO_FILE" 2>/dev/null || echo "-1")

if [ "$hard_stop_index" = "-1" ] || [ "$hard_stop_index" = "null" ]; then
  # No HARD STOP item — neutral score
  jq -n \
    --arg signal "$SIGNAL_NAME" \
    --argjson score 50 \
    --arg formula 'HARD STOP present and respected => 100; violated => 0; absent => 50' \
    '{
      signal: $signal,
      score: $score,
      detail: {
        hard_stop_found: false,
        respected: true,
        reason: "no HARD STOP item in todo",
        formula: $formula,
        sources: [".hivemind/state/todo.json"]
      }
    }'
  exit 0
fi

# Check if any items AFTER hard_stop_index are in_progress
violated=$(jq --argjson idx "$hard_stop_index" '
  [.[$idx + 1:] | .[] | select(.status == "in_progress")] | length > 0
' "$TODO_FILE" 2>/dev/null || echo "false")

if [ "$violated" = "true" ]; then
  score=0
  reason="items after HARD STOP are in_progress"
else
  score=100
  reason="HARD STOP present and respected"
fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --argjson score "$score" \
  --argjson hard_stop_index "$hard_stop_index" \
  --argjson violated "$violated" \
  --arg reason "$reason" \
  --arg formula 'HARD STOP present and respected => 100; violated => 0; absent => 50' \
  '{
    signal: $signal,
    score: $score,
    detail: {
      hard_stop_found: true,
      hard_stop_index: $hard_stop_index,
      violated: $violated,
      reason: $reason,
      formula: $formula,
      sources: [".hivemind/state/todo.json"]
    }
  }'

exit 0
