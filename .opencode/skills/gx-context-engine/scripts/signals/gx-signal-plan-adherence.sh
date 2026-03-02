#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="plan_adherence"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"
RUNTIME_PROFILE_FILE="$STATE_DIR/runtime-profile.json"

scope_violations=0
turn_count=0

if [ -f "$ENFORCEMENT_FILE" ]; then
  scope_violations=$(jq -r '((.scopeViolations // .scope_violations // 0) | tonumber? // 0 | floor)' \
    "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
  turn_count=$(jq -r '((.turnCount // .turn_count // 0) | tonumber? // 0 | floor)' \
    "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
fi

if [ "$turn_count" -le 0 ] && [ -f "$RUNTIME_PROFILE_FILE" ]; then
  turn_count=$(jq -r '((.turnCount // .turn_count // 0) | tonumber? // 0 | floor)' \
    "$RUNTIME_PROFILE_FILE" 2>/dev/null || echo "0")
fi

score=100
if [ "$turn_count" -gt 0 ]; then
  penalty=$((scope_violations * 100 / turn_count))
  score=$((100 - penalty))
fi

if [ "$score" -lt 0 ]; then
  score=0
fi
if [ "$score" -gt 100 ]; then
  score=100
fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --argjson score "$score" \
  --argjson scopeViolations "$scope_violations" \
  --argjson turnCount "$turn_count" \
  --arg agentLevel "$AGENT_LEVEL" \
  --arg formula 'score = clamp(100 - ((scopeViolations / turnCount) * 100), 0, 100); if turnCount <= 0 then 100' \
  '{
    signal: $signal,
    score: $score,
    detail: {
      scopeViolations: $scopeViolations,
      turnCount: $turnCount,
      agentLevel: $agentLevel,
      formula: $formula,
      sources: [
        ".hivemind/state/enforcement.json",
        ".hivemind/state/runtime-profile.json"
      ]
    }
  }'

exit 0
