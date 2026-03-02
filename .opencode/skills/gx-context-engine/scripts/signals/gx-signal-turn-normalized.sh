#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="turn_normalized"
ENFORCEMENT_FILE="$WORKDIR/.hivemind/state/enforcement.json"
FORMULA="score = 100 - ((turn_count / 100) * 100), clamped to [0,100]"

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

turn_count=0
source_state="missing"

if [ -f "$ENFORCEMENT_FILE" ]; then
  source_state="present"
  turn_count=$(jq -r '(.turnCount // 0) | tonumber? // 0' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
fi

if ! [[ "$turn_count" =~ ^[0-9]+$ ]]; then
  turn_count=0
fi

score=$((100 - turn_count))
score="$(clamp_score "$score")"

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --arg formula "$FORMULA" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg source_state "$source_state" \
  --argjson score "$score" \
  --argjson turn_count "$turn_count" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      formula: $formula,
      agent_level: $agent_level,
      source_state: $source_state,
      expected_max_turns: 100,
      turn_count: $turn_count
    }
  }'

exit 0
