#!/usr/bin/env bash
# gx-handoff-purify.sh — Pre-export: Build purified handoff from state files
# USAGE: gx-handoff-purify.sh <workdir>

set -euo pipefail

WORKDIR="${1:-.}"
STATE_DIR="$WORKDIR/.hivemind/state"
HANDOFF_DIR="$WORKDIR/.hivemind/handoffs"

RUNTIME_PROFILE_FILE="$STATE_DIR/runtime-profile.json"
HEALTH_FILE="$STATE_DIR/health-metrics.json"
TODO_FILE="$STATE_DIR/todo.json"
DECISIONS_FILE="$STATE_DIR/decisions.jsonl"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"

if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq_missing","message":"jq is required"}'
  exit 1
fi

mkdir -p "$HANDOFF_DIR"

created_at="$(date +%s)"
handoff_id="ho-${created_at}"
json_file="$HANDOFF_DIR/handoff-${created_at}.json"
md_file="$HANDOFF_DIR/handoff-${created_at}.md"

intent="unknown"
profile_id="unknown"
health_at_exit=0
health_status="unknown"
turns_completed=0
scope_violations=0
trajectory_position="Unknown"

decisions_made='[]'
evidence_collected='[]'
pending_actions='[]'
workflow_positions='[]'
warnings='[]'
recommended_next="No pending actions"

if [[ -f "$RUNTIME_PROFILE_FILE" ]]; then
  intent="$(jq -r '.intent // "unknown"' "$RUNTIME_PROFILE_FILE" 2>/dev/null || printf 'unknown')"
  profile_id="$(jq -r '.id // .profile_id // "unknown"' "$RUNTIME_PROFILE_FILE" 2>/dev/null || printf 'unknown')"
fi

if [[ -f "$HEALTH_FILE" ]]; then
  health_at_exit="$(jq -r '(.composite.score // 0) | tonumber? // 0 | floor' "$HEALTH_FILE" 2>/dev/null || printf '0')"
  health_status="$(jq -r '.composite.status // "unknown"' "$HEALTH_FILE" 2>/dev/null || printf 'unknown')"
  warnings="$(jq -c '
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
        | "\($name):\(($score | floor))"
      )
  ' "$HEALTH_FILE" 2>/dev/null || printf '[]')"
fi

if [[ -f "$TODO_FILE" ]]; then
  pending_actions="$(jq -c '
    [
      (.items // [])[]
      | select((.status // "") == "in_progress" or (.status // "") == "pending")
      | {
          id: (.id // ""),
          content: (.content // ""),
          status: (.status // "pending"),
          priority: (.priority // "medium")
        }
    ]
  ' "$TODO_FILE" 2>/dev/null || printf '[]')"

  evidence_collected="$(jq -c '
    [
      (.items // [])[]
      | select((.status // "") == "completed" or (.status // "") == "complete" or (.status // "") == "done")
      | select((.evidence // "") != "")
      | {
          todo_id: (.id // ""),
          content: (.content // ""),
          evidence: (.evidence // "")
        }
    ]
    | if length > 10 then .[-10:] else . end
  ' "$TODO_FILE" 2>/dev/null || printf '[]')"

  next_content="$(printf '%s' "$pending_actions" | jq -r '
    def priority_rank($p):
      if $p == "high" then 0
      elif $p == "medium" then 1
      elif $p == "low" then 2
      else 3
      end;

    . as $items
    | ($items | map(select(.status == "pending")) | sort_by(priority_rank(.priority), .id)) as $pending
    | if ($pending | length) > 0 then
        ($pending[0].content // "")
      elif ($items | length) > 0 then
        (($items | sort_by(priority_rank(.priority), .id))[0].content // "")
      else
        ""
      end
  ' 2>/dev/null || printf '')"

  if [[ -n "$next_content" ]]; then
    recommended_next="Continue: $next_content"
  fi
fi

if [[ -f "$DECISIONS_FILE" ]]; then
  decisions_made="$(jq -s -c '
    [
      .[]
      | select((.superseded_by // null) == null)
      | {
          id: (.id // ""),
          content: (.content // ""),
          rationale: (.rationale // "")
        }
    ]
    | if length > 10 then .[-10:] else . end
  ' "$DECISIONS_FILE" 2>/dev/null || printf '[]')"
fi

shopt -s nullglob
workflow_files=("$STATE_DIR"/wf-*.json)
shopt -u nullglob

if [[ ${#workflow_files[@]} -gt 0 ]]; then
  workflow_positions='[]'
  for wf_file in "${workflow_files[@]}"; do
    wf_item="$(jq -c '
      select((.status // "active") != "archived" and ((.active // true) != false) and ((.is_active // true) != false))
      | {
          workflow_id: (.workflow_id // ""),
          current_step: ((.current_step // 0) | tonumber? // 0 | floor),
          step_name: (.step_name // null),
          is_blocked: (.is_blocked // false)
        }
    ' "$wf_file" 2>/dev/null || true)"

    if [[ -n "$wf_item" && "$wf_item" != "null" ]]; then
      workflow_positions="$(jq -cn --argjson current "$workflow_positions" --argjson next "$wf_item" '$current + [$next]')"
    fi
  done
fi

if [[ -f "$HIERARCHY_FILE" ]]; then
  hierarchy_path="$(jq -r '
    def status_rank($status):
      if $status == "in_progress" then 0
      elif $status == "active" then 1
      elif $status == "pending" then 2
      else 9
      end;

    def is_active($node):
      (($node.status // "active") == "active")
      or (($node.status // "") == "in_progress")
      or (($node.status // "") == "pending");

    def pick_child($node):
      if ($node.children | type) == "array" then
        (
          $node.children
          | map(select(is_active(.)))
          | sort_by(status_rank(.status // "active"))
          | .[0]
        )
      else
        null
      end;

    def breadcrumb($node):
      (pick_child($node)) as $next
      | if $next == null then
          [($node.content // "Unknown")]
        else
          [($node.content // "Unknown")] + breadcrumb($next)
        end;

    if type == "object" then
      (breadcrumb(.) | join(" → "))
    else
      "Unknown"
    end
  ' "$HIERARCHY_FILE" 2>/dev/null || printf 'Unknown')"

  if [[ -n "$hierarchy_path" && "$hierarchy_path" != "null" ]]; then
    trajectory_position="$hierarchy_path"
  fi
fi

if [[ -f "$ENFORCEMENT_FILE" ]]; then
  turns_completed="$(jq -r '(.turnCount // .turn_count // 0) | tonumber? // 0 | floor' "$ENFORCEMENT_FILE" 2>/dev/null || printf '0')"
  scope_violations="$(jq -r '
    (.scopeViolations // .scope_violations // 0) as $value
    | if ($value | type) == "array" then
        ($value | length)
      elif ($value | type) == "number" then
        ($value | floor)
      else
        0
      end
  ' "$ENFORCEMENT_FILE" 2>/dev/null || printf '0')"
fi

tmp_json="$(mktemp "$HANDOFF_DIR/.handoff-json.XXXXXX")"
tmp_md="$(mktemp "$HANDOFF_DIR/.handoff-md.XXXXXX")"

cleanup() {
  rm -f "$tmp_json" "$tmp_md"
}
trap cleanup EXIT

jq -n \
  --arg handoff_id "$handoff_id" \
  --argjson created_at "$created_at" \
  --arg intent "$intent" \
  --arg profile_id "$profile_id" \
  --argjson health_at_exit "$health_at_exit" \
  --arg health_status "$health_status" \
  --argjson turns_completed "$turns_completed" \
  --argjson scope_violations "$scope_violations" \
  --arg trajectory_position "$trajectory_position" \
  --argjson decisions_made "$decisions_made" \
  --argjson evidence_collected "$evidence_collected" \
  --argjson pending_actions "$pending_actions" \
  --argjson workflow_positions "$workflow_positions" \
  --arg recommended_next "$recommended_next" \
  --argjson warnings "$warnings" \
  '{
    handoff_id: $handoff_id,
    created_at: $created_at,
    session_summary: {
      intent: $intent,
      profile_id: $profile_id,
      health_at_exit: $health_at_exit,
      health_status: $health_status,
      turns_completed: $turns_completed,
      scope_violations: $scope_violations,
      trajectory_position: $trajectory_position
    },
    decisions_made: $decisions_made,
    evidence_collected: $evidence_collected,
    pending_actions: $pending_actions,
    workflow_positions: $workflow_positions,
    recommended_next: $recommended_next,
    warnings: $warnings
  }' > "$tmp_json"

jq -r '
  "# Session Handoff: \(.handoff_id)\n\n"
  + "## Summary\n"
  + "- **Intent:** \(.session_summary.intent)\n"
  + "- **Health:** \(.session_summary.health_at_exit)/100 (\(.session_summary.health_status))\n"
  + "- **Turns:** \(.session_summary.turns_completed)\n\n"
  + "## Decisions Made\n"
  + (
      if (.decisions_made | length) == 0 then
        "1. None"
      else
        (.decisions_made
          | to_entries
          | map("\(.key + 1). \(.value.content) — \(.value.rationale)")
          | join("\n"))
      end
    )
  + "\n\n## Pending Actions\n"
  + (
      if (.pending_actions | length) == 0 then
        "- [ ] None"
      else
        (.pending_actions
          | map("- [ ] \(.content) (\(.priority))")
          | join("\n"))
      end
    )
  + "\n\n## Warnings\n"
  + (
      if (.warnings | length) == 0 then
        "- none"
      else
        (.warnings
          | map("- " + (gsub(":"; ": ")))
          | join("\n"))
      end
    )
  + "\n"
' "$tmp_json" > "$tmp_md"

mv "$tmp_json" "$json_file"
mv "$tmp_md" "$md_file"
trap - EXIT

jq -cn \
  --arg status "purified" \
  --arg handoff_id "$handoff_id" \
  --arg json_file "$json_file" \
  --arg md_file "$md_file" \
  '{status: $status, handoff_id: $handoff_id, json_file: $json_file, md_file: $md_file}'
