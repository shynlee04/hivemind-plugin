#!/usr/bin/env bash
# gx-signal-context-saturation.sh — S5: Context Saturation
# CRs: CR-13 (S5)
# Score: estimated context budget remaining (~2000 tokens/turn, 200K budget)
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="context_saturation"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"

TOKENS_PER_TURN=2000
MAX_TOKENS=200000

turn_count=0
if [ -f "$ENFORCEMENT_FILE" ]; then
  turn_count=$(jq -r '((.turnCount // .turn_count // 0) | tonumber? // 0 | floor)' \
    "$ENFORCEMENT_FILE" 2>/dev/null || echo "0")
fi

estimated_tokens=$((turn_count * TOKENS_PER_TURN))
if [ "$MAX_TOKENS" -gt 0 ]; then
  used_pct=$((estimated_tokens * 100 / MAX_TOKENS))
  score=$((100 - used_pct))
else
  score=100
fi

# Clamp
if [ "$score" -lt 0 ]; then score=0; fi
if [ "$score" -gt 100 ]; then score=100; fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --argjson score "$score" \
  --argjson turnCount "$turn_count" \
  --argjson estimatedTokens "$estimated_tokens" \
  --argjson maxTokens "$MAX_TOKENS" \
  --argjson tokensPerTurn "$TOKENS_PER_TURN" \
  --arg formula 'score = 100 - ((turnCount * tokensPerTurn / maxTokens) * 100); clamp 0-100' \
  '{
    signal: $signal,
    score: $score,
    detail: {
      turnCount: $turnCount,
      estimatedTokens: $estimatedTokens,
      maxTokens: $maxTokens,
      tokensPerTurn: $tokensPerTurn,
      formula: $formula,
      sources: [".hivemind/state/enforcement.json"]
    }
  }'

exit 0
