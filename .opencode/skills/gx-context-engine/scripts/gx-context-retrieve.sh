#!/usr/bin/env bash
# gx-context-retrieve.sh — Synthesize recovery context from archives
#
# CHAIN: Auto-Purge (Chain 6) — Step 3 (run by retrieval agent)
# TRIGGER: After auto-purge snapshot, spawned retrieval agent runs this
# OUTPUT: .hivemind/state/context-recovery.json
#
# Reads: pre-purge-snapshot.json, hierarchy.json, todo.json
# Writes: context-recovery.json — picked up by messages.transform on next turn

set -euo pipefail

WORKDIR="${1:-.}"

STATE_DIR="$WORKDIR/.hivemind/state"
SNAPSHOT_FILE="$STATE_DIR/pre-purge-snapshot.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"
TODO_FILE="$STATE_DIR/todo.json"
DECISIONS_FILE="$STATE_DIR/decisions.jsonl"
RUNTIME_PROFILE_FILE="$STATE_DIR/runtime-profile.json"
HEALTH_FILE="$STATE_DIR/health-metrics.json"
RECOVERY_FILE="$STATE_DIR/context-recovery.json"

if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq_not_found"}'
  exit 1
fi

mkdir -p "$STATE_DIR"

# ── Defaults ──

TRAJECTORY_SUMMARY="No trajectory data available"
ACTIVE_TODOS='[]'
KEY_DECISIONS='[]'
WORKFLOW_POSITIONS='[]'
HEALTH_SUMMARY='{"composite_score":0,"status":"unknown","degraded_signals":[]}'
RECOMMENDED_NEXT="Resume from last known state"

COMPLETENESS_HIERARCHY=false
COMPLETENESS_TODOS=false
COMPLETENESS_DECISIONS=false
COMPLETENESS_WORKFLOWS=false
COMPLETENESS_HEALTH=false

IN_PROGRESS_TASK=""
DEEPEST_ACTIVE=""

# ── 1) Hierarchy: active node + breadcrumb path ──

if [ -f "$HIERARCHY_FILE" ]; then
  HIERARCHY_CONTEXT=$(jq -c '
    def status_rank($s):
      if $s == "in_progress" then 0
      elif $s == "active" then 1
      elif $s == "pending" then 2
      elif $s == "" then 3
      elif $s == "blocked" then 4
      else 9
      end;

    def pick_child($node):
      if ($node.children | type) == "array" then
        ($node.children
          | map(select((.status // "") != "complete" and (.status // "") != "cancelled"))
          | sort_by(status_rank(.status // ""))
          | .[0])
      else
        null
      end;

    def breadcrumb($node):
      (pick_child($node)) as $next
      | if $next == null then
          [($node.content // "unknown")]
        else
          [($node.content // "unknown")] + breadcrumb($next)
        end;

    if type == "object" then
      (breadcrumb(.)) as $path
      | {
          root_content: (.content // "unknown"),
          deepest_content: ($path[-1] // .content // "unknown"),
          breadcrumb: $path
        }
    else
      {
        root_content: "unknown",
        deepest_content: "unknown",
        breadcrumb: []
      }
    end
  ' "$HIERARCHY_FILE" 2>/dev/null || true)

  if [ -n "$HIERARCHY_CONTEXT" ] && [ "$HIERARCHY_CONTEXT" != "null" ]; then
    ROOT_CONTENT=$(printf '%s' "$HIERARCHY_CONTEXT" | jq -r '.root_content // "unknown"')
    DEEPEST_ACTIVE=$(printf '%s' "$HIERARCHY_CONTEXT" | jq -r '.deepest_content // "unknown"')
    TRAJECTORY_SUMMARY="Root: $ROOT_CONTENT → Active: $DEEPEST_ACTIVE"
    COMPLETENESS_HIERARCHY=true
  fi
fi

# ── 2) TODOs: all active + recently completed ──

if [ -f "$TODO_FILE" ]; then
  TODOS_JSON=$(jq -c '
    (.items // []) as $items
    | ([
        $items[]
        | select((.status // "") == "pending" or (.status // "") == "in_progress")
        | (.content // empty)
      ]) as $active
    | ([
        $items[]
        | select((.status // "") == "complete" or (.status // "") == "completed" or (.status // "") == "done")
        | (.content // empty)
      ] | reverse | .[0:5]) as $recent
    | $active + $recent
  ' "$TODO_FILE" 2>/dev/null || true)

  if [ -n "$TODOS_JSON" ] && [ "$TODOS_JSON" != "null" ]; then
    ACTIVE_TODOS="$TODOS_JSON"
    IN_PROGRESS_TASK=$(jq -r '[.items[]? | select((.status // "") == "in_progress") | .content][0] // ""' "$TODO_FILE" 2>/dev/null || echo "")
    if [ -n "$IN_PROGRESS_TASK" ]; then
      RECOMMENDED_NEXT="Continue: $IN_PROGRESS_TASK"
    fi
    COMPLETENESS_TODOS=true
  fi
fi

# ── 3) Decisions: last active (non-superseded) ──

if [ -f "$DECISIONS_FILE" ]; then
  DECISION_BUFFER='[]'
  while IFS= read -r line; do
    if [ -z "$line" ]; then
      continue
    fi

    DECISION_ITEM=$(printf '%s' "$line" | jq -c '
      select((.superseded_by // null) == null)
      | {
          id: (.id // ""),
          content: (.content // ""),
          rationale: (.rationale // "")
        }
    ' 2>/dev/null || true)

    if [ -n "$DECISION_ITEM" ] && [ "$DECISION_ITEM" != "null" ]; then
      DECISION_BUFFER=$(jq -cn \
        --argjson current "$DECISION_BUFFER" \
        --argjson next "$DECISION_ITEM" \
        '$current + [$next]' \
      )
    fi
  done < <(tail -20 "$DECISIONS_FILE" 2>/dev/null || true)

  KEY_DECISIONS=$(printf '%s' "$DECISION_BUFFER" | jq -c 'if length > 10 then .[-10:] else . end')
  COMPLETENESS_DECISIONS=true
fi

# ── 4) Workflows: aggregate wf-*.json positions ──

shopt -s nullglob
WORKFLOW_FILES=("$STATE_DIR"/wf-*.json)
shopt -u nullglob

if [ "${#WORKFLOW_FILES[@]}" -gt 0 ]; then
  WORKFLOW_BUFFER='[]'
  WORKFLOW_VALID_COUNT=0
  for workflow_file in "${WORKFLOW_FILES[@]}"; do
    WORKFLOW_ITEM=$(jq -c '
      {
        workflow_id: (.workflow_id // ""),
        current_step: ((.current_step // 0) | tonumber? // 0),
        step_name: (.step_name // null),
        is_blocked: (.is_blocked // false)
      }
    ' "$workflow_file" 2>/dev/null || true)

    if [ -n "$WORKFLOW_ITEM" ] && [ "$WORKFLOW_ITEM" != "null" ]; then
      WORKFLOW_BUFFER=$(jq -cn \
        --argjson current "$WORKFLOW_BUFFER" \
        --argjson next "$WORKFLOW_ITEM" \
        '$current + [$next]' \
      )
      WORKFLOW_VALID_COUNT=$((WORKFLOW_VALID_COUNT + 1))
    fi
  done

  WORKFLOW_POSITIONS="$WORKFLOW_BUFFER"
  if [ "$WORKFLOW_VALID_COUNT" -gt 0 ]; then
    COMPLETENESS_WORKFLOWS=true
  fi
fi

# ── 5) Health: composite + degraded signals ──

if [ -f "$HEALTH_FILE" ]; then
  HEALTH_JSON=$(jq -c '
    {
      composite_score: ((.composite.score // 0) | tonumber? // 0 | floor),
      status: (.composite.status // "unknown"),
      degraded_signals: (
        (.signals // {})
        | to_entries
        | map(
            .key as $name
            | (
                if (.value | type) == "object" then
                  (.value.score // 100)
                else
                  .value
                end
                | tonumber? // 100
              ) as $score
            | select($score < 40)
            | $name
          )
      )
    }
  ' "$HEALTH_FILE" 2>/dev/null || true)

  if [ -n "$HEALTH_JSON" ] && [ "$HEALTH_JSON" != "null" ]; then
    HEALTH_SUMMARY="$HEALTH_JSON"
    COMPLETENESS_HEALTH=true
  fi
fi

# ── 6) Runtime profile: intent + profile ID (fallback to snapshot) ──

PROFILE_INTENT=""
PROFILE_ID=""

if [ -f "$RUNTIME_PROFILE_FILE" ]; then
  PROFILE_INTENT=$(jq -r '.intent // "unknown"' "$RUNTIME_PROFILE_FILE" 2>/dev/null || echo "unknown")
  PROFILE_ID=$(jq -r '.id // "none"' "$RUNTIME_PROFILE_FILE" 2>/dev/null || echo "none")
elif [ -f "$SNAPSHOT_FILE" ]; then
  PROFILE_INTENT=$(jq -r '.runtime_profile.intent // "unknown"' "$SNAPSHOT_FILE" 2>/dev/null || echo "unknown")
  PROFILE_ID=$(jq -r '.runtime_profile.id // "none"' "$SNAPSHOT_FILE" 2>/dev/null || echo "none")
fi

if [ -n "$PROFILE_INTENT" ] || [ -n "$PROFILE_ID" ]; then
  TRAJECTORY_SUMMARY="$TRAJECTORY_SUMMARY | Intent: ${PROFILE_INTENT:-unknown} | Profile: ${PROFILE_ID:-none}"
fi

if [ -z "$IN_PROGRESS_TASK" ] && [ -n "$DEEPEST_ACTIVE" ] && [ "$DEEPEST_ACTIVE" != "unknown" ]; then
  RECOMMENDED_NEXT="Continue: $DEEPEST_ACTIVE"
fi

# ── Build recovery context ──

jq -n \
  --arg trajectory_summary "$TRAJECTORY_SUMMARY" \
  --argjson active_todos "$ACTIVE_TODOS" \
  --argjson key_decisions "$KEY_DECISIONS" \
  --argjson workflow_positions "$WORKFLOW_POSITIONS" \
  --argjson health_summary "$HEALTH_SUMMARY" \
  --arg recommended_next "$RECOMMENDED_NEXT" \
  --argjson recovery_hierarchy "$COMPLETENESS_HIERARCHY" \
  --argjson recovery_todos "$COMPLETENESS_TODOS" \
  --argjson recovery_decisions "$COMPLETENESS_DECISIONS" \
  --argjson recovery_workflows "$COMPLETENESS_WORKFLOWS" \
  --argjson recovery_health "$COMPLETENESS_HEALTH" \
  --argjson recovered_at "$(date +%s)" \
  '{
    trajectory_summary: $trajectory_summary,
    active_todos: $active_todos,
    key_decisions: $key_decisions,
    workflow_positions: $workflow_positions,
    health_summary: $health_summary,
    recommended_next: $recommended_next,
    recovered_at: $recovered_at,
    recovery_completeness: {
      hierarchy: $recovery_hierarchy,
      todos: $recovery_todos,
      decisions: $recovery_decisions,
      workflows: $recovery_workflows,
      health: $recovery_health
    }
  }' > "$RECOVERY_FILE"

echo "{\"status\":\"recovered\",\"file\":\"$RECOVERY_FILE\",\"trajectory\":$(echo "$TRAJECTORY_SUMMARY" | jq -Rs .)}"
