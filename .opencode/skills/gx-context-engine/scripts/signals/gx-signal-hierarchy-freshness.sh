#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="hierarchy_freshness"

if ! command -v jq >/dev/null 2>&1; then
  printf '{"signal":"%s","score":0,"error":"jq not installed"}\n' "$SIGNAL_NAME"
  exit 0
fi

STATE_DIR="$WORKDIR/.hivemind/state"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"

get_mtime_epoch() {
  local file_path="$1"
  local mtime

  mtime=$(stat -f %m "$file_path" 2>/dev/null || true)
  if [ -n "$mtime" ]; then
    printf '%s\n' "$mtime"
    return 0
  fi

  mtime=$(stat -c %Y "$file_path" 2>/dev/null || true)
  if [ -n "$mtime" ]; then
    printf '%s\n' "$mtime"
    return 0
  fi

  printf '0\n'
}

decay_rate=10
if [ "$AGENT_LEVEL" = "3" ]; then
  decay_rate=5
fi

if [ -f "$ENFORCEMENT_FILE" ]; then
  configured_decay=$(jq -r --arg level "$AGENT_LEVEL" '
    if .hierarchyFreshnessDecayRates then
      (.hierarchyFreshnessDecayRates[$level] // empty)
    else
      empty
    end
  ' "$ENFORCEMENT_FILE" 2>/dev/null || echo "")
  if [[ "$configured_decay" =~ ^[0-9]+$ ]]; then
    decay_rate="$configured_decay"
  fi
fi

if [ ! -f "$HIERARCHY_FILE" ]; then
  jq -n \
    --arg signal "$SIGNAL_NAME" \
    --argjson score 0 \
    --argjson ageMinutes 0 \
    --argjson decayRate "$decay_rate" \
    --arg formula 'score = clamp(100 - (age_minutes * decay_rate), 0, 100); no hierarchy => 0' \
    '{
      signal: $signal,
      score: $score,
      detail: {
        ageMinutes: $ageMinutes,
        decayRate: $decayRate,
        formula: $formula,
        reason: "hierarchy file missing",
        sources: [
          ".hivemind/state/hierarchy.json",
          ".hivemind/state/enforcement.json"
        ]
      }
    }'
  exit 0
fi

mtime_epoch=$(get_mtime_epoch "$HIERARCHY_FILE")
now_epoch=$(date +%s)
if [ "$mtime_epoch" -le 0 ]; then
  age_seconds=0
else
  age_seconds=$((now_epoch - mtime_epoch))
  if [ "$age_seconds" -lt 0 ]; then
    age_seconds=0
  fi
fi

age_minutes=$((age_seconds / 60))
score=$((100 - (age_minutes * decay_rate)))

if [ "$score" -lt 0 ]; then
  score=0
fi
if [ "$score" -gt 100 ]; then
  score=100
fi

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --argjson score "$score" \
  --argjson ageMinutes "$age_minutes" \
  --argjson decayRate "$decay_rate" \
  --arg agentLevel "$AGENT_LEVEL" \
  --arg formula 'score = clamp(100 - (age_minutes * decay_rate), 0, 100)' \
  '{
    signal: $signal,
    score: $score,
    detail: {
      ageMinutes: $ageMinutes,
      decayRate: $decayRate,
      agentLevel: $agentLevel,
      formula: $formula,
      sources: [
        ".hivemind/state/hierarchy.json",
        ".hivemind/state/enforcement.json"
      ]
    }
  }'

exit 0
