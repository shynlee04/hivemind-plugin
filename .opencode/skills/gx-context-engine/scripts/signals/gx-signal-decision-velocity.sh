#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="decision_velocity"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
DECISIONS_FILE="$STATE_DIR/decisions.jsonl"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"

turn_count=0
decision_count=0

if [ -f "$ENFORCEMENT_FILE" ]; then
  turn_count=$(jq -r '((.turnCount // .turn_count // 0) | tonumber? // 0 | floor)' \
    "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
fi

if [ ! -f "$DECISIONS_FILE" ]; then
  jq -n \
    --arg signal "$SIGNAL_NAME" \
    --argjson score 50 \
    --argjson decisionCount 0 \
    --argjson turnCount "$turn_count" \
    --arg agentLevel "$AGENT_LEVEL" \
    --arg formula 'score = min(100, (decisionCount / turnCount) * 100); no decisions file => 50' \
    '{
      signal: $signal,
      score: $score,
      detail: {
        decisionCount: $decisionCount,
        turnCount: $turnCount,
        agentLevel: $agentLevel,
        formula: $formula,
        reason: "decisions file missing",
        sources: [
          ".hivemind/state/decisions.jsonl",
          ".hivemind/state/enforcement.json"
        ]
      }
    }'
  exit 0
fi

decision_count=$(wc -l < "$DECISIONS_FILE")
decision_count=$(printf '%s' "$decision_count" | tr -d '[:space:]')
if [ -z "$decision_count" ]; then
  decision_count=0
fi

score=50
if [ "$turn_count" -gt 0 ]; then
  score=$((decision_count * 100 / turn_count))
  if [ "$score" -gt 100 ]; then
    score=100
  fi
  if [ "$score" -lt 0 ]; then
    score=0
  fi
fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --argjson score "$score" \
  --argjson decisionCount "$decision_count" \
  --argjson turnCount "$turn_count" \
  --arg agentLevel "$AGENT_LEVEL" \
  --arg formula 'score = min(100, (decisionCount / turnCount) * 100); if turnCount <= 0 then 50' \
  '{
    signal: $signal,
    score: $score,
    detail: {
      decisionCount: $decisionCount,
      turnCount: $turnCount,
      agentLevel: $agentLevel,
      formula: $formula,
      sources: [
        ".hivemind/state/decisions.jsonl",
        ".hivemind/state/enforcement.json"
      ]
    }
  }'

exit 0
