#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/../scripts/gx-context-retrieve.sh"

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

assert_cmd() {
  local name="$1"
  shift
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if "$@" >/dev/null 2>&1; then
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

run_retrieve() {
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

  printf '%s\n' '{"id":"dec/gx/test/001","content":"Decision 1","rationale":"R1","supersedes":null,"superseded_by":null}' > "$state_dir/decisions.jsonl"
  printf '%s\n' '{"id":"dec/gx/test/002","content":"Decision 2","rationale":"R2","supersedes":null,"superseded_by":null}' >> "$state_dir/decisions.jsonl"

  printf '%s\n' '{"workflow_id":"test-wf","current_step":2,"total_steps":5,"step_name":"2_diagnose","is_blocked":false}' > "$state_dir/wf-test.json"

  cat > "$state_dir/health-metrics.json" <<'JSON'
{
  "composite": {
    "score": 65,
    "status": "warning"
  },
  "signals": {
    "hierarchy_freshness": {"score": 35},
    "todo_progression": {"score": 30},
    "plan_adherence": {"score": 75}
  }
}
JSON

  printf '%s\n' '{"items":[{"id":"t1","content":"Task 1","status":"in_progress","priority":"high"},{"id":"t2","content":"Task 2","status":"pending","priority":"medium"}],"last_updated":1709337600}' > "$state_dir/todo.json"

  printf '%s\n' '{"id":"traj/gx","type":"trajectory","content":"GX-Pack","status":"active","children":[{"id":"tactic/r2","type":"tactic","content":"R2 Fix State","status":"active","children":[{"id":"action/decision-log","type":"action","content":"Build decision log","status":"in_progress"}]}]}' > "$state_dir/hierarchy.json"

  printf '%s\n' '{"id":"gx-profile-1","intent":"build_new"}' > "$state_dir/runtime-profile.json"
}

seed_many_todos_fixture() {
  local workdir="$1"
  local state_dir="$workdir/.hivemind/state"
  mkdir -p "$state_dir"

  jq -n '{
    items: [range(1; 16) | {
      id: ("t" + (tostring)),
      content: ("Task " + (tostring)),
      status: "pending",
      priority: "medium"
    }],
    last_updated: 1709337600
  }' > "$state_dir/todo.json"

  printf '%s\n' '{"id":"traj/gx","type":"trajectory","content":"GX-Pack","status":"active","children":[{"id":"tactic/r2","type":"tactic","content":"R2 Fix State","status":"active","children":[{"id":"action/decision-log","type":"action","content":"Build decision log","status":"in_progress"}]}]}' > "$state_dir/hierarchy.json"
}

seed_partial_todo_fixture() {
  local workdir="$1"
  local state_dir="$workdir/.hivemind/state"
  mkdir -p "$state_dir"

  printf '%s\n' '{"items":[{"id":"t1","content":"Task 1","status":"in_progress","priority":"high"},{"id":"t2","content":"Task 2","status":"pending","priority":"medium"}],"last_updated":1709337600}' > "$state_dir/todo.json"
}

main() {
  printf '=== TDD Test: R2-03 Context Retrieve Enhancement ===\n'

  assert_true "Script exists" test -f "$SCRIPT_PATH"
  assert_cmd "jq is available" command -v jq

  if [[ ! -f "$SCRIPT_PATH" ]]; then
    printf '\nPASS COUNT: %d\n' "$PASS_COUNT"
    printf 'FAIL COUNT: %d\n' "$FAIL_COUNT"
    printf 'TOTAL COUNT: %d\n' "$TOTAL_COUNT"
    return 1
  fi

  local tmpdir
  TMP_ROOT="$(mktemp -d)"
  tmpdir="$TMP_ROOT"
  trap cleanup EXIT

  # Case 1: Full fixture
  local workdir_full="$tmpdir/full"
  seed_primary_fixture "$workdir_full"
  run_retrieve "$workdir_full"

  assert_true "Full fixture run exits zero" test "$CMD_STATUS" -eq 0
  assert_true "context-recovery.json written to state path" test -f "$workdir_full/.hivemind/state/context-recovery.json"

  local recovery_full="$workdir_full/.hivemind/state/context-recovery.json"
  assert_json_file_expr "Decisions recovered (2 items, not hardcoded empty)" "$recovery_full" '.key_decisions | length == 2'
  assert_json_file_expr "Workflow positions recovered with correct step" "$recovery_full" '.workflow_positions | length == 1 and .[0].workflow_id == "test-wf" and .[0].current_step == 2 and .[0].step_name == "2_diagnose" and .[0].is_blocked == false'
  assert_json_file_expr "Health summary recovered with composite score" "$recovery_full" '.health_summary.composite_score == 65 and .health_summary.status == "warning"'
  assert_json_file_expr "Health degraded signals recovered" "$recovery_full" '(.health_summary.degraded_signals | sort) == ["hierarchy_freshness","todo_progression"]'
  assert_json_file_expr "Recovery completeness map present" "$recovery_full" '.recovery_completeness.hierarchy == true and .recovery_completeness.todos == true and .recovery_completeness.decisions == true and .recovery_completeness.workflows == true and .recovery_completeness.health == true'

  # Case 2: Superseded decisions filtered out
  printf '%s\n' '{"id":"dec/gx/test/003","content":"Decision 3","rationale":"R3","supersedes":"dec/gx/test/001","superseded_by":"dec/gx/test/004"}' >> "$workdir_full/.hivemind/state/decisions.jsonl"
  run_retrieve "$workdir_full"
  assert_true "Run with superseded decision exits zero" test "$CMD_STATUS" -eq 0
  assert_json_file_expr "Superseded decision excluded from key_decisions" "$recovery_full" '.key_decisions | map(.id) | index("dec/gx/test/003") == null'

  # Case 3: Active todos are not truncated
  local workdir_todos="$tmpdir/todos"
  seed_many_todos_fixture "$workdir_todos"
  run_retrieve "$workdir_todos"
  assert_true "Many todos run exits zero" test "$CMD_STATUS" -eq 0
  assert_json_file_expr "All 15 active todos recovered (no truncation)" "$workdir_todos/.hivemind/state/context-recovery.json" '.active_todos | length == 15'

  # Case 4: Empty state files -> graceful defaults
  local workdir_empty="$tmpdir/empty"
  mkdir -p "$workdir_empty"
  run_retrieve "$workdir_empty"
  assert_true "Empty state run exits zero" test "$CMD_STATUS" -eq 0
  assert_json_file_expr "Empty state defaults and no crash" "$workdir_empty/.hivemind/state/context-recovery.json" '.active_todos == [] and .key_decisions == [] and .workflow_positions == [] and .health_summary.composite_score == 0'
  assert_json_file_expr "Empty state completeness reports missing data" "$workdir_empty/.hivemind/state/context-recovery.json" '.recovery_completeness.hierarchy == false and .recovery_completeness.todos == false and .recovery_completeness.decisions == false and .recovery_completeness.workflows == false and .recovery_completeness.health == false'

  # Case 5: Partial state (todo only)
  local workdir_partial="$tmpdir/partial"
  seed_partial_todo_fixture "$workdir_partial"
  run_retrieve "$workdir_partial"
  assert_true "Partial state run exits zero" test "$CMD_STATUS" -eq 0
  assert_json_file_expr "Partial state recovers todos" "$workdir_partial/.hivemind/state/context-recovery.json" '.active_todos | length == 2'
  assert_json_file_expr "Partial state notes missing non-todo files" "$workdir_partial/.hivemind/state/context-recovery.json" '.recovery_completeness.todos == true and .recovery_completeness.hierarchy == false and .recovery_completeness.decisions == false and .recovery_completeness.workflows == false and .recovery_completeness.health == false'

  printf '\nPASS COUNT: %d\n' "$PASS_COUNT"
  printf 'FAIL COUNT: %d\n' "$FAIL_COUNT"
  printf 'TOTAL COUNT: %d\n' "$TOTAL_COUNT"

  if ((FAIL_COUNT > 0)); then
    return 1
  fi
  return 0
}

main "$@"
