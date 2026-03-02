#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"
SIGNAL_NAME="chain_integrity"
SKILL_FILE="$WORKDIR/.opencode/skills/gx-context-engine/SKILL.md"
BASE_SKILL_DIR="$WORKDIR/.opencode/skills/gx-context-engine"
FORMULA="score = (operational_chains / total_chains) * 100; operational=all scripts exist and are not stubs"

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

total_chains=0
operational_chains=0
chains_json='[]'
skill_state="missing"

if [ -f "$SKILL_FILE" ]; then
  skill_state="present"
  chain_labels=$(awk '/^### Chain [0-9]+:/ { line=$0; sub(/^### /, "", line); print line }' "$SKILL_FILE" 2>/dev/null || true)

  while IFS= read -r chain_label; do
    if [ -z "$chain_label" ]; then
      continue
    fi

    total_chains=$((total_chains + 1))
    refs=$(awk -v target="$chain_label" '
      /^### Chain [0-9]+:/ {
        current=$0
        sub(/^### /, "", current)
        in_chain=(current == target)
        next
      }
      in_chain {
        if (match($0, /bash[[:space:]]+scripts\/[A-Za-z0-9._\/-]+\.sh/)) {
          cmd=substr($0, RSTART, RLENGTH)
          sub(/^bash[[:space:]]+/, "", cmd)
          print cmd
        }
      }
    ' "$SKILL_FILE" 2>/dev/null | awk '!seen[$0]++' || true)

    refs_count=0
    operational_scripts=0
    script_states='[]'
    issues='[]'

    while IFS= read -r script_ref; do
      if [ -z "$script_ref" ]; then
        continue
      fi

      refs_count=$((refs_count + 1))
      script_abs="$BASE_SKILL_DIR/$script_ref"
      script_status="OPERATIONAL"
      line_count=0

      if [ ! -f "$script_abs" ]; then
        script_status="MISSING"
      else
        line_count=$(wc -l < "$script_abs" | tr -d '[:space:]')
        if ! [[ "$line_count" =~ ^[0-9]+$ ]]; then
          line_count=0
        fi

        is_stub=false
        if [ "$line_count" -lt 20 ]; then
          is_stub=true
        fi
        if grep -q "STUB" "$script_abs" 2>/dev/null; then
          is_stub=true
        fi

        if [ "$is_stub" = true ]; then
          script_status="STUB"
        fi
      fi

      if [ "$script_status" = "OPERATIONAL" ]; then
        operational_scripts=$((operational_scripts + 1))
      else
        issues=$(jq -c --arg issue "$script_ref:$script_status" '. + [$issue]' <<< "$issues")
      fi

      script_states=$(jq -c \
        --arg path "$script_ref" \
        --arg status "$script_status" \
        --argjson line_count "$line_count" \
        '. + [{path: $path, status: $status, line_count: $line_count}]' \
        <<< "$script_states")
    done <<< "$refs"

    if [ "$refs_count" -eq 0 ]; then
      issues=$(jq -c '. + ["no_scripts_referenced"]' <<< "$issues")
      chain_status="CHAIN_DEGRADED"
    elif [ "$operational_scripts" -eq "$refs_count" ]; then
      chain_status="CHAIN_HEALTHY"
      operational_chains=$((operational_chains + 1))
    else
      chain_status="CHAIN_DEGRADED"
    fi

    chains_json=$(jq -c \
      --arg chain "$chain_label" \
      --arg status "$chain_status" \
      --argjson total_scripts "$refs_count" \
      --argjson operational_scripts "$operational_scripts" \
      --argjson scripts "$script_states" \
      --argjson issues "$issues" \
      '. + [{
        chain: $chain,
        status: $status,
        total_scripts: $total_scripts,
        operational_scripts: $operational_scripts,
        scripts: $scripts,
        issues: $issues
      }]' <<< "$chains_json")
  done <<< "$chain_labels"
fi

if [ "$total_chains" -eq 0 ]; then
  score=0
else
  score=$((operational_chains * 100 / total_chains))
fi
score="$(clamp_score "$score")"

jq -n \
  --arg signal "$SIGNAL_NAME" \
  --arg formula "$FORMULA" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg skill_state "$skill_state" \
  --arg skill_file "$SKILL_FILE" \
  --argjson score "$score" \
  --argjson total_chains "$total_chains" \
  --argjson operational_chains "$operational_chains" \
  --argjson chains "$chains_json" \
  '{
    signal: $signal,
    score: $score,
    detail: {
      formula: $formula,
      agent_level: $agent_level,
      skill_state: $skill_state,
      skill_file: $skill_file,
      total_chains: $total_chains,
      operational_chains: $operational_chains,
      degraded_chains: ($total_chains - $operational_chains),
      status: (
        if $total_chains > 0 and $operational_chains == $total_chains then
          "CHAIN_HEALTHY"
        else
          "CHAIN_DEGRADED"
        end
      ),
      chains: $chains
    }
  }'

exit 0
