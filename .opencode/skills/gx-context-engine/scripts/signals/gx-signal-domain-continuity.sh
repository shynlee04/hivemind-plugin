#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="domain_continuity"
PROFILE_FILE="$WORKDIR/.hivemind/state/runtime-profile.json"
ENFORCEMENT_FILE="$WORKDIR/.hivemind/state/enforcement.json"
FORMULA="score = (matching_domain_calls / total_domain_calls) * 100; no data => 100"

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

intent=""
domains_json='[]'
profile_state="missing"
enforcement_state="missing"

if [ -f "$PROFILE_FILE" ]; then
  profile_state="present"
  intent=$(jq -r '(.intent // "") | tostring' "$PROFILE_FILE" 2>/dev/null || echo "")
fi

if [ -f "$ENFORCEMENT_FILE" ]; then
  enforcement_state="present"
  domains_json=$(jq -c '
    if (.toolDomains | type) == "array" then
      .toolDomains
    elif (.tool_calls | type) == "array" then
      [.tool_calls[]? | .domain // empty]
    elif (.toolCalls | type) == "array" then
      [.toolCalls[]? | .domain // empty]
    elif (.tools | type) == "array" then
      [.tools[]? | .domain // empty]
    else
      []
    end
  ' "$ENFORCEMENT_FILE" 2>/dev/null || echo '[]')
fi

intent_normalized=$(printf '%s' "$intent" | tr '[:upper:]' '[:lower:]')
domains_total=$(jq -r '[.[] | tostring | ascii_downcase | select(length > 0)] | length' <<< "$domains_json" 2>/dev/null || echo "0")
matching_domain_calls=$(jq -r --arg intent "$intent_normalized" '
  [.[] | tostring | ascii_downcase | select(length > 0 and . == $intent)] | length
' <<< "$domains_json" 2>/dev/null || echo "0")

if ! [[ "$domains_total" =~ ^[0-9]+$ ]]; then
  domains_total=0
fi
if ! [[ "$matching_domain_calls" =~ ^[0-9]+$ ]]; then
  matching_domain_calls=0
fi

if [ -z "$intent_normalized" ] || [ "$domains_total" -eq 0 ]; then
  score=100
else
  score=$((matching_domain_calls * 100 / domains_total))
fi
score="$(clamp_score "$score")"

unique_domains=$(jq -c '[.[] | tostring | ascii_downcase | select(length > 0)] | unique' <<< "$domains_json" 2>/dev/null || echo '[]')

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --arg formula "$FORMULA" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg profile_state "$profile_state" \
  --arg enforcement_state "$enforcement_state" \
  --arg declared_intent "$intent_normalized" \
  --argjson score "$score" \
  --argjson total_domain_calls "$domains_total" \
  --argjson matching_domain_calls "$matching_domain_calls" \
  --argjson unique_domains "$unique_domains" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      formula: $formula,
      agent_level: $agent_level,
      profile_state: $profile_state,
      enforcement_state: $enforcement_state,
      declared_intent: $declared_intent,
      total_domain_calls: $total_domain_calls,
      matching_domain_calls: $matching_domain_calls,
      observed_domains: $unique_domains
    }
  }'

exit 0
