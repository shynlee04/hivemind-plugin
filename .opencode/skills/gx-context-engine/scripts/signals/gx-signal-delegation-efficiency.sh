#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="delegation_efficiency"
ENFORCEMENT_FILE="$WORKDIR/.hivemind/state/enforcement.json"
FORMULA="score = (completed_delegations / total_delegations) * 100; if total_delegations=0 => 100"

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

total_delegations=0
completed_delegations=0
source_state="missing"

if [ -f "$ENFORCEMENT_FILE" ]; then
  source_state="present"
  total_delegations=$(jq -r '(.delegationChain // []) | length' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
  completed_delegations=$(jq -r '
    (.delegationChain // [])
    | map(select((.status // "") == "completed"))
    | length
  ' "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
fi

if ! [[ "$total_delegations" =~ ^[0-9]+$ ]]; then
  total_delegations=0
fi
if ! [[ "$completed_delegations" =~ ^[0-9]+$ ]]; then
  completed_delegations=0
fi

if [ "$total_delegations" -eq 0 ]; then
  score=100
else
  score=$((completed_delegations * 100 / total_delegations))
fi
score="$(clamp_score "$score")"

pending_delegations=$((total_delegations - completed_delegations))
if [ "$pending_delegations" -lt 0 ]; then
  pending_delegations=0
fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --arg formula "$FORMULA" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg source_state "$source_state" \
  --argjson score "$score" \
  --argjson total_delegations "$total_delegations" \
  --argjson completed_delegations "$completed_delegations" \
  --argjson pending_delegations "$pending_delegations" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      formula: $formula,
      agent_level: $agent_level,
      source_state: $source_state,
      total_delegations: $total_delegations,
      completed_delegations: $completed_delegations,
      pending_delegations: $pending_delegations
    }
  }'

exit 0
