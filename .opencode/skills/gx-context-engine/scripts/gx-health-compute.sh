#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-.}"
AGENT_LEVEL="${2:-2}"

STATE_DIR="$WORKDIR/.hivemind/state"
STATE_FILE="$STATE_DIR/health-metrics.json"
SIGNALS_DIR="$WORKDIR/.opencode/skills/gx-context-engine/scripts/signals"

DEFAULT_WEIGHTS='{"plan_adherence":15,"hierarchy_freshness":15,"decision_velocity":10,"todo_progression":10,"context_saturation":10,"hard_stop_compliance":5,"delegation_efficiency":5,"scope_proximity":5,"domain_continuity":10,"evidence_quality":5,"turn_normalized":5,"chain_integrity":5}'
DEFAULT_THRESHOLDS='{"healthy":{"min":70},"warning":{"min":40,"max":69},"critical":{"max":39},"hard_block":{"signals":["plan_adherence","hierarchy_freshness"],"below":20}}'

if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq not installed"}'
  exit 1
fi

mkdir -p "$STATE_DIR"

if [ ! -f "$STATE_FILE" ]; then
  jq -n \
    --argjson weights "$DEFAULT_WEIGHTS" \
    --argjson thresholds "$DEFAULT_THRESHOLDS" \
    '{
      "$schema": "gx-health-metrics-v1",
      version: 1,
      computed_at: 0,
      turn_number: 0,
      agent_level: 2,
      task_type: "implementation",
      signals: {},
      signal_count: 0,
      composite: {
        score: 50,
        status: "warning",
        hard_blocked: false,
        weights: $weights
      },
      history: [],
      thresholds: $thresholds
    }' > "$STATE_FILE"
fi

PREV_METRICS="{}"
if [ -f "$STATE_FILE" ]; then
  PREV_METRICS=$(jq '.' "$STATE_FILE" 2>/dev/null || echo "{}")
fi

normalize_score() {
  local raw_value="$1"
  jq -n --arg value "$raw_value" '($value | tonumber? // 50) | if . < 0 then 0 elif . > 100 then 100 else . end | floor'
}

read_previous_score() {
  local signal_name="$1"
  jq -n -r --argjson prev "$PREV_METRICS" --arg key "$signal_name" '
    ($prev.signals[$key] // 0) as $v
    | if ($v | type) == "object" then
        ($v.score // 0)
      elif ($v | type) == "number" then
        $v
      else
        0
      end
    | tonumber? // 0
  ' 2>/dev/null || echo "0"
}

read_previous_signal_object() {
  local signal_name="$1"
  jq -n -c --argjson prev "$PREV_METRICS" --arg key "$signal_name" '
    ($prev.signals[$key] // {}) as $v
    | if ($v | type) == "object" then
        $v
      else
        {}
      end
  '
}

signal_metadata_from_detail() {
  local signal_name="$1"
  local score_value="$2"
  local detail_json="$3"
  local previous_signal_json="$4"

  jq -n -c \
    --arg signal "$signal_name" \
    --argjson score "$score_value" \
    --argjson detail "$detail_json" \
    --argjson previous "$previous_signal_json" '
    def as_number($value; $default): ($value | tonumber? // $default);

    if $signal == "plan_adherence" then
      {
        samples: (as_number(($detail.samples // $detail.turnCount // $detail.turn_count // $detail.tool_calls // $previous.samples // 0); 0) | floor)
      }
    elif $signal == "hierarchy_freshness" then
      {
        last_update_turn: (as_number(($detail.last_update_turn // $previous.last_update_turn // 0); 0) | floor)
      }
    elif $signal == "decision_velocity" then
      {
        decisions_count: (as_number(($detail.decisions_count // $detail.decisionCount // $previous.decisions_count // 0); 0) | floor)
      }
    elif $signal == "todo_progression" then
      {
        completed_last_5: (as_number(($detail.completed_last_5 // $detail.completed // $previous.completed_last_5 // 0); 0) | floor)
      }
    elif $signal == "context_saturation" then
      {
        estimated_tokens: (as_number(($detail.estimated_tokens // $detail.estimatedTokens // $previous.estimated_tokens // 0); 0) | floor)
      }
    elif $signal == "hard_stop_compliance" then
      {
        respected: (
          if ($detail.respected | type) == "boolean" then
            $detail.respected
          elif ($detail.violated | type) == "boolean" then
            ($detail.violated | not)
          elif ($previous.respected | type) == "boolean" then
            $previous.respected
          else
            true
          end
        )
      }
    elif $signal == "delegation_efficiency" then
      {
        useful_ratio: (
          if ($detail.useful_ratio // null) != null then
            as_number($detail.useful_ratio; (as_number($score; 0)))
          elif (as_number(($detail.total_delegations // 0); 0) > 0) then
            ((as_number(($detail.completed_delegations // 0); 0) * 100) / as_number(($detail.total_delegations // 1); 1))
          elif ($previous.useful_ratio // null) != null then
            as_number($previous.useful_ratio; (as_number($score; 0)))
          else
            as_number($score; 0)
          end
          | if . < 0 then 0 elif . > 100 then 100 else . end
          | floor
        )
      }
    elif $signal == "scope_proximity" then
      {
        near_misses: (as_number(($detail.near_misses // $detail.nearMisses // $previous.near_misses // 0); 0) | floor)
      }
    elif $signal == "domain_continuity" then
      {
        alignment_pct: (
          as_number(($detail.alignment_pct // $previous.alignment_pct // $score); (as_number($score; 0)))
          | if . < 0 then 0 elif . > 100 then 100 else . end
          | floor
        )
      }
    elif $signal == "evidence_quality" then
      {
        with_proof_pct: (
          as_number(($detail.with_proof_pct // $previous.with_proof_pct // $score); (as_number($score; 0)))
          | if . < 0 then 0 elif . > 100 then 100 else . end
          | floor
        )
      }
    elif $signal == "turn_normalized" then
      {
        position_pct: (
          if (as_number(($detail.expected_max_turns // 0); 0) > 0) and (($detail.turn_count // $detail.turnCount // null) != null) then
            ((as_number(($detail.turn_count // $detail.turnCount // 0); 0) * 100) / as_number(($detail.expected_max_turns // 100); 100))
          elif ($previous.position_pct // null) != null then
            as_number($previous.position_pct; (100 - as_number($score; 0)))
          else
            (100 - as_number($score; 0))
          end
          | if . < 0 then 0 elif . > 100 then 100 else . end
          | floor
        )
      }
    elif $signal == "chain_integrity" then
      {
        operational: (as_number(($detail.operational // $detail.operational_chains // $previous.operational // 0); 0) | floor),
        total: (as_number(($detail.total // $detail.total_chains // $previous.total // 0); 0) | floor)
      }
    else
      {}
    end
  '
}

run_with_timeout() {
  local timeout_sec="$1"
  local output_file="$2"
  shift 2

  "$@" >"$output_file" 2>/dev/null &
  local pid=$!
  local start_time
  local now
  start_time=$(date +%s)

  while kill -0 "$pid" 2>/dev/null; do
    now=$(date +%s)
    if [ $((now - start_time)) -ge "$timeout_sec" ]; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 124
    fi
    sleep 0.1
  done

  wait "$pid"
}

TIMEOUT_BIN=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_BIN="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_BIN="gtimeout"
fi

run_signal_script() {
  local script_path="$1"
  local default_signal="$2"
  local output=""
  local exit_code=0
  local fallback
  fallback=$(jq -n --arg signal "$default_signal" '{signal: $signal, score: 50, error: "timeout_or_crash"}')

  if [ -n "$TIMEOUT_BIN" ]; then
    set +e
    output="$($TIMEOUT_BIN 5 bash "$script_path" "$WORKDIR" "$AGENT_LEVEL" 2>/dev/null)"
    exit_code=$?
    set -e
  else
    local tmp_output
    tmp_output="$(mktemp)"
    set +e
    run_with_timeout 5 "$tmp_output" bash "$script_path" "$WORKDIR" "$AGENT_LEVEL"
    exit_code=$?
    set -e
    if [ -f "$tmp_output" ]; then
      output="$(<"$tmp_output")"
      rm -f "$tmp_output"
    fi
  fi

  if [ "$exit_code" -ne 0 ] || [ -z "$output" ]; then
    printf '%s\n' "$fallback"
    return 0
  fi

  printf '%s\n' "$output"
}

signal_scripts=("$SIGNALS_DIR"/gx-signal-*.sh)
if [ "${#signal_scripts[@]}" -eq 0 ] || [ ! -e "${signal_scripts[0]}" ]; then
  echo '{"error":"no signal scripts found"}'
  exit 1
fi

signals_json='{}'

for script_path in "${signal_scripts[@]}"; do
  default_name="$(basename "$script_path")"
  default_name="${default_name%.sh}"
  default_name="${default_name#gx-signal-}"
  default_name="${default_name//-/_}"

  signal_name="$default_name"
  signal_score="50"
  signal_detail='{}'
  script_output="$(run_signal_script "$script_path" "$default_name")"

  if [ -n "$script_output" ] && echo "$script_output" | jq -e '.' >/dev/null 2>&1; then
    parsed_name="$(echo "$script_output" | jq -r '.signal // empty' 2>/dev/null || true)"
    parsed_score="$(echo "$script_output" | jq -r '.score // empty' 2>/dev/null || true)"
    signal_detail="$(echo "$script_output" | jq -c 'if (.detail | type) == "object" then .detail else {} end' 2>/dev/null || echo '{}')"

    if [ -n "$parsed_name" ]; then
      signal_name="$parsed_name"
    fi

    if [ -n "$parsed_score" ]; then
      signal_score="$(normalize_score "$parsed_score")"
    fi
  fi

  previous_score="$(read_previous_score "$signal_name")"
  velocity_score="$(jq -n --arg current "$signal_score" --arg previous "$previous_score" '(($current | tonumber? // 50) - ($previous | tonumber? // 0))')"
  previous_signal_json="$(read_previous_signal_object "$signal_name")"
  metadata_json="$(signal_metadata_from_detail "$signal_name" "$signal_score" "$signal_detail" "$previous_signal_json")"
  signal_object="$(jq -n --argjson score "$signal_score" --argjson velocity "$velocity_score" --argjson metadata "$metadata_json" '$metadata + {score: $score, velocity: $velocity}')"

  signals_json="$(jq -n --argjson current "$signals_json" --arg key "$signal_name" --argjson value "$signal_object" '$current + {($key): $value}')"
done

weights_json="$(jq -n -c --argjson prev "$PREV_METRICS" --argjson defaults "$DEFAULT_WEIGHTS" '$prev.composite.weights // $defaults')"
thresholds_json="$(jq -n -c --argjson prev "$PREV_METRICS" --argjson defaults "$DEFAULT_THRESHOLDS" '$prev.thresholds // $defaults')"

computed_at="$(date +%s)"
agent_level_num="$(jq -n --arg value "$AGENT_LEVEL" '($value | tonumber? // 2 | floor)')"

composite_score="$(jq -n --argjson signals "$signals_json" --argjson weights "$weights_json" '(
  reduce ($signals | keys[]) as $k (0; . + (((($signals[$k].score // 0) | tonumber? // 0) * ($weights[$k] // 0))) / 100)
) | if . < 0 then 0 elif . > 100 then 100 else . end | floor')"

healthy_min="$(echo "$thresholds_json" | jq -r '(.healthy.min // 70) | tonumber? // 70')"
warning_min="$(echo "$thresholds_json" | jq -r '(.warning.min // 40) | tonumber? // 40')"
hard_block_signals="$(echo "$thresholds_json" | jq -c '.hard_block.signals // ["plan_adherence","hierarchy_freshness"]')"
hard_block_below="$(echo "$thresholds_json" | jq -r '(.hard_block.below // 20) | tonumber? // 20')"

status="critical"
if [ "$(jq -n --argjson score "$composite_score" --argjson min "$healthy_min" '$score >= $min')" = "true" ]; then
  status="healthy"
elif [ "$(jq -n --argjson score "$composite_score" --argjson min "$warning_min" '$score >= $min')" = "true" ]; then
  status="warning"
fi

hard_blocked="$(jq -n --argjson signals "$signals_json" --argjson names "$hard_block_signals" --argjson below "$hard_block_below" '
  any($names[]; ((($signals[.].score // 50) | tonumber? // 50) < $below))
')"

signal_count="$(jq -n --argjson signals "$signals_json" '$signals | keys | length')"

history_entry="$(jq -n --argjson score "$composite_score" --arg status "$status" --argjson hardBlocked "$hard_blocked" --argjson computedAt "$computed_at" '{score: $score, status: $status, hard_blocked: $hardBlocked, computed_at: $computedAt}')"

output_json="$(jq -n \
  --argjson score "$composite_score" \
  --arg status "$status" \
  --argjson hardBlocked "$hard_blocked" \
  --argjson signals "$signals_json" \
  --argjson signalCount "$signal_count" \
  --argjson computedAt "$computed_at" \
  '{
    composite: {
      score: $score,
      status: $status,
      hard_blocked: $hardBlocked
    },
    signals: $signals,
    signal_count: $signalCount,
    computed_at: $computedAt
  }')"

new_state_json="$(jq -n \
  --argjson prev "$PREV_METRICS" \
  --argjson computedAt "$computed_at" \
  --argjson agentLevel "$agent_level_num" \
  --argjson signals "$signals_json" \
  --argjson signalCount "$signal_count" \
  --argjson score "$composite_score" \
  --arg status "$status" \
  --argjson hardBlocked "$hard_blocked" \
  --argjson defaults "$DEFAULT_WEIGHTS" \
  --argjson thresholds "$thresholds_json" \
  --argjson historyEntry "$history_entry" '
  ($prev // {})
  | ."$schema" = (."$schema" // "gx-health-metrics-v1")
  | .version = ((.version // 1) | tonumber? // 1 | floor)
  | .turn_number = ((.turn_number // 0) | tonumber? // 0 | floor)
  | .task_type = (.task_type // "implementation")
  | .computed_at = $computedAt
  | .agent_level = $agentLevel
  | .signals = $signals
  | .signal_count = $signalCount
  | .thresholds = (.thresholds // $thresholds)
  | .composite = {
      score: $score,
      status: $status,
      hard_blocked: $hardBlocked,
      weights: ((.composite.weights // $defaults))
    }
  | .history = (((if (.history | type) == "array" then .history else [] end) + [$historyEntry]) | if length > 10 then .[-10:] else . end)
  | del(.velocity)
')"

tmp_file="$(mktemp "$STATE_FILE.tmp.XXXXXX")"
cleanup_tmp() {
  if [ -n "${tmp_file:-}" ] && [ -f "$tmp_file" ]; then
    rm -f "$tmp_file"
  fi
}
trap cleanup_tmp EXIT

printf '%s\n' "$new_state_json" > "$tmp_file"
mv "$tmp_file" "$STATE_FILE"
trap - EXIT

printf '%s\n' "$output_json"
