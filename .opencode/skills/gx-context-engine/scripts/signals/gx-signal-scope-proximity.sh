#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="scope_proximity"
ENFORCEMENT_FILE="$WORKDIR/.hivemind/state/enforcement.json"
FORMULA="score = 100 - (near_misses * 20), clamped to [0,100]; no data => 100"

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

near_misses=0
scope_violation_entries=0
source_state="missing"

if [ -f "$ENFORCEMENT_FILE" ]; then
  source_state="present"
  scope_violation_entries=$(jq -r '(.scopeViolations // []) | length' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
  near_misses=$(jq -r '
    (.scopeViolations // [])
    | map(select(
      (.near_miss // false) == true
      or (.nearMiss // false) == true
      or ((.severity // "") | ascii_downcase) == "near_miss"
      or ((.type // "") | ascii_downcase) == "near_miss"
      or ((.classification // "") | ascii_downcase) == "near_miss"
    ))
    | length
  ' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
fi

if ! [[ "$near_misses" =~ ^[0-9]+$ ]]; then
  near_misses=0
fi
if ! [[ "$scope_violation_entries" =~ ^[0-9]+$ ]]; then
  scope_violation_entries=0
fi

score=$((100 - (near_misses * 20)))
score="$(clamp_score "$score")"

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --arg formula "$FORMULA" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg source_state "$source_state" \
  --argjson score "$score" \
  --argjson near_misses "$near_misses" \
  --argjson scope_violation_entries "$scope_violation_entries" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      formula: $formula,
      agent_level: $agent_level,
      source_state: $source_state,
      near_misses: $near_misses,
      scope_violation_entries: $scope_violation_entries,
      penalty_per_near_miss: 20
    }
  }'

exit 0
