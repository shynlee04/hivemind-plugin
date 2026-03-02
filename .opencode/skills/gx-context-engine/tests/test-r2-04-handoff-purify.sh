#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/../scripts/gx-handoff-purify.sh"

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0
CMD_OUTPUT=""
CMD_STATUS=0
TMP_ROOT=""

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS: %s\n' "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'FAIL: %s\n' "$1"
}

assert_true() {
  local name="$1"
  shift
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if "$@"; then
    pass "$name"
  else
    fail "$name"
  fi
}

assert_json_file_expr() {
  local name="$1"
  local json_file="$2"
  local expr="$3"
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if jq -e "$expr" "$json_file" >/dev/null 2>&1; then
    pass "$name"
  else
    fail "$name"
  fi
}

assert_contains() {
  local name="$1"
  local haystack="$2"
  local needle="$3"
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if [[ "$haystack" == *"$needle"* ]]; then
    pass "$name"
  else
    fail "$name"
  fi
}

run_purify() {
  local workdir="$1"
  set +e
  CMD_OUTPUT="$(/bin/bash "$SCRIPT_PATH" "$workdir" 2>&1)"
  CMD_STATUS=$?
  set -e
}

cleanup() {
  if [[ -n "${TMP_ROOT:-}" && -d "$TMP_ROOT" ]]; then
    rm -rf "$TMP_ROOT"
  fi
}

seed_primary_fixture() {
  local workdir="$1"
  local state_dir="$workdir/.hivemind/state"
  mkdir -p "$state_dir"

  cat > "$state_dir/runtime-profile.json" <<'JSON'
{
  "intent": "build_new",
  "id": "gx-profile-abc123"
}
JSON

  cat > "$state_dir/health-metrics.json" <<'JSON'
{
  "composite": {
    "score": 65,
    "status": "warning"
  },
  "signals": {
    "hierarchy_freshness": {"score": 0},
    "todo_progression": {"score": 0},
    "plan_adherence": {"score": 81}
  }
}
JSON

  cat > "$state_dir/todo.json" <<'JSON'
{
  "items": [
    {
      "id": "t1",
      "content": "Build decision log",
      "status": "in_progress",
      "priority": "medium"
    },
    {
      "id": "t2",
      "content": "Build handoff purify",
      "status": "completed",
      "priority": "high",
      "evidence": "37/37 tests pass"
    },
    {
      "id": "t3",
      "content": "Build workflow state",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": "t4",
      "content": "Cleanup notes",
      "status": "pending",
      "priority": "low"
    }
  ],
  "last_updated": 1709337600
}
JSON

  cat > "$state_dir/decisions.jsonl" <<'JSONL'
{"id":"dec/gx/test/001","content":"Use JSONL for decisions","rationale":"Append-only safety","superseded_by":null}
{"id":"dec/gx/test/002","content":"Old approach","rationale":"Superseded plan","superseded_by":"dec/gx/test/003"}
{"id":"dec/gx/test/003","content":"Use workflow state files","rationale":"State continuity","superseded_by":null}
JSONL

  cat > "$state_dir/wf-gx-recover-loop.json" <<'JSON'
{
  "workflow_id": "gx-recover-loop",
  "current_step": 2,
  "step_name": "2_diagnose",
  "is_blocked": false
}
JSON

  cat > "$state_dir/hierarchy.json" <<'JSON'
{
  "id": "traj/gx",
  "type": "trajectory",
  "content": "GX-Pack",
  "status": "active",
  "children": [
    {
      "id": "tactic/r2",
      "type": "tactic",
      "content": "R2 Fix State",
      "status": "active",
      "children": [
        {
          "id": "action/decision-log",
          "type": "action",
          "content": "Decision Log",
          "status": "in_progress"
        }
      ]
    }
  ]
}
JSON

  cat > "$state_dir/enforcement.json" <<'JSON'
{
  "turnCount": 15,
  "scopeViolations": []
}
JSON
}

main() {
  printf '=== TDD Test: R2-04 Handoff Purify ===\n'

  assert_true "Script exists" test -f "$SCRIPT_PATH"
  assert_true "jq is available" command -v jq

  if [[ ! -f "$SCRIPT_PATH" ]]; then
    printf '\nPASS COUNT: %d\n' "$PASS_COUNT"
    printf 'FAIL COUNT: %d\n' "$FAIL_COUNT"
    printf 'TOTAL COUNT: %d\n' "$TOTAL_COUNT"
    return 1
  fi

  TMP_ROOT="$(mktemp -d)"
  trap cleanup EXIT

  local workdir_full="$TMP_ROOT/full"
  seed_primary_fixture "$workdir_full"

  run_purify "$workdir_full"
  assert_true "Primary fixture run exits zero" test "$CMD_STATUS" -eq 0

  local status
  status="$(printf '%s' "$CMD_OUTPUT" | jq -r '.status // ""' 2>/dev/null || printf '')"
  assert_true "Status is purified" test "$status" = "purified"

  local json_file
  local md_file
  local handoff_id
  json_file="$(printf '%s' "$CMD_OUTPUT" | jq -r '.json_file // ""' 2>/dev/null || printf '')"
  md_file="$(printf '%s' "$CMD_OUTPUT" | jq -r '.md_file // ""' 2>/dev/null || printf '')"
  handoff_id="$(printf '%s' "$CMD_OUTPUT" | jq -r '.handoff_id // ""' 2>/dev/null || printf '')"

  assert_true "Handoff JSON file created" test -f "$json_file"
  assert_true "Handoff markdown file created" test -f "$md_file"
  assert_true "Handoff ID format is ho-{digits}" bash -c '[[ "$1" =~ ^ho-[0-9]+$ ]]' _ "$handoff_id"

  assert_json_file_expr "Active decisions included" "$json_file" '.decisions_made | map(.id) | index("dec/gx/test/001") != null and index("dec/gx/test/003") != null'
  assert_json_file_expr "Superseded decisions excluded" "$json_file" '.decisions_made | map(.id) | index("dec/gx/test/002") == null'
  assert_json_file_expr "Completed todo evidence extracted" "$json_file" '.evidence_collected | length == 1 and .[0].todo_id == "t2" and .[0].evidence == "37/37 tests pass"'
  assert_json_file_expr "Pending actions include in_progress + pending" "$json_file" '.pending_actions | length == 3 and (map(.id) | sort) == ["t1","t3","t4"]'
  assert_json_file_expr "Workflow positions included" "$json_file" '.workflow_positions | length == 1 and .[0].workflow_id == "gx-recover-loop" and .[0].current_step == 2 and .[0].step_name == "2_diagnose" and .[0].is_blocked == false'
  assert_json_file_expr "Health summary captured" "$json_file" '.session_summary.health_at_exit == 65 and .session_summary.health_status == "warning"'
  assert_json_file_expr "Hierarchy trajectory path captured" "$json_file" '.session_summary.trajectory_position == "GX-Pack → R2 Fix State → Decision Log"'
  assert_json_file_expr "Enforcement counters captured" "$json_file" '.session_summary.turns_completed == 15 and .session_summary.scope_violations == 0'
  assert_json_file_expr "Recommended next is highest priority pending action" "$json_file" '.recommended_next == "Continue: Build workflow state"'
  assert_json_file_expr "Warnings include degraded health signals" "$json_file" '(.warnings | sort) == ["hierarchy_freshness:0","todo_progression:0"]'

  local markdown_content
  markdown_content=""
  if [[ -f "$md_file" ]]; then
    markdown_content="$(<"$md_file")"
  fi
  assert_contains "Markdown contains Session Handoff header" "$markdown_content" "# Session Handoff:"

  assert_true "handoffs directory created" test -d "$workdir_full/.hivemind/handoffs"

  local workdir_empty="$TMP_ROOT/empty"
  mkdir -p "$workdir_empty"
  run_purify "$workdir_empty"
  assert_true "Empty state run exits zero" test "$CMD_STATUS" -eq 0

  local empty_json
  empty_json="$(printf '%s' "$CMD_OUTPUT" | jq -r '.json_file // ""' 2>/dev/null || printf '')"
  assert_true "Empty state still writes handoff JSON" test -f "$empty_json"
  assert_json_file_expr "Empty state uses graceful defaults" "$empty_json" '.decisions_made == [] and .evidence_collected == [] and .pending_actions == [] and .workflow_positions == [] and .session_summary.intent == "unknown" and .session_summary.health_at_exit == 0 and .session_summary.scope_violations == 0'

  printf '\nPASS COUNT: %d\n' "$PASS_COUNT"
  printf 'FAIL COUNT: %d\n' "$FAIL_COUNT"
  printf 'TOTAL COUNT: %d\n' "$TOTAL_COUNT"

  if ((FAIL_COUNT > 0)); then
    return 1
  fi
  return 0
}

main "$@"
