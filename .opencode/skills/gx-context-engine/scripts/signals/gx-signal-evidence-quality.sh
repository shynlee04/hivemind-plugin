#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="evidence_quality"
TODO_FILE="$WORKDIR/.hivemind/state/todo.json"
FORMULA="score = (completed_with_evidence / completed_items) * 100; if completed_items=0 => 50"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

clamp_score() {
  local value="${1:-0}"
  if [ "$value" -lt 0 ]; then
    echo "0"
  elif [ "$value" -gt 100 ]; then
    echo "100"
  else
    echo "$value"
  fi
}

completed_items=0
completed_with_evidence=0
source_state="missing"

if [ -f "$TODO_FILE" ]; then
  source_state="present"
  completed_items=$(jq -r '
    def items:
      if type == "array" then .
      elif (.items | type) == "array" then .items
      else [] end;
    [items[]? | select((.status // "") == "completed")] | length
  ' "$TODO_FILE" 2>/dev/null || echo "0")

  completed_with_evidence=$(jq -r '
    def items:
      if type == "array" then .
      elif (.items | type) == "array" then .items
      else [] end;
    [
      items[]?
      | select((.status // "") == "completed")
      | select((((.evidence // "") | tostring | gsub("^\\s+|\\s+$"; "")) | length) > 0)
    ]
    | length
  ' "$TODO_FILE" 2>/dev/null || echo "0")
fi

if ! [[ "$completed_items" =~ ^[0-9]+$ ]]; then
  completed_items=0
fi
if ! [[ "$completed_with_evidence" =~ ^[0-9]+$ ]]; then
  completed_with_evidence=0
fi

if [ "$completed_items" -eq 0 ]; then
  score=50
else
  score=$((completed_with_evidence * 100 / completed_items))
fi
score="$(clamp_score "$score")"

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --arg formula "$FORMULA" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg source_state "$source_state" \
  --argjson score "$score" \
  --argjson completed_items "$completed_items" \
  --argjson completed_with_evidence "$completed_with_evidence" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      formula: $formula,
      agent_level: $agent_level,
      source_state: $source_state,
      completed_items: $completed_items,
      completed_with_evidence: $completed_with_evidence
    }
  }'

exit 0
