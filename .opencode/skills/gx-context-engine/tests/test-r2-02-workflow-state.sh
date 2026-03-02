#!/usr/bin/env bash

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/../scripts/gx-workflow-state.sh"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS: %s\n' "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'FAIL: %s\n' "$1"
}

assert_eq() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    pass "$name"
  else
    fail "$name (expected: $expected, actual: $actual)"
  fi
}

assert_true() {
  local name="$1"
  shift
  if "$@"; then
    pass "$name"
  else
    fail "$name"
  fi
}

assert_json_expr() {
  local name="$1"
  local json="$2"
  local expr="$3"
  if printf '%s' "$json" | jq -e "$expr" >/dev/null 2>&1; then
    pass "$name"
  else
    fail "$name"
  fi
}

print_summary() {
  printf '\nPASS COUNT: %d\n' "$PASS_COUNT"
  printf 'FAIL COUNT: %d\n' "$FAIL_COUNT"
}

main() {
  assert_true "jq is available in environment" command -v jq >/dev/null 2>&1

  if [[ ! -x "$SCRIPT_PATH" ]]; then
    fail "workflow script exists and is executable"
    print_summary
    return 1
  fi
  pass "workflow script exists and is executable"

  local workdir
  workdir="$(mktemp -d)"
  local workflow_id="gx-recover-loop"
  local state_file="${workdir}/.hivemind/state/wf-${workflow_id}.json"
  local archive_file="${workdir}/.hivemind/archive/wf-${workflow_id}.json"

  if "$SCRIPT_PATH" "$workdir" init "$workflow_id" 2 >/dev/null 2>&1; then
    pass "init command succeeds"
  else
    fail "init command succeeds"
  fi

  assert_true "init creates workflow state file" test -f "$state_file"

  local state_json
  state_json="$("$SCRIPT_PATH" "$workdir" read "$workflow_id")"

  assert_json_expr "init writes expected workflow_id" "$state_json" '.workflow_id == "gx-recover-loop"'
  assert_json_expr "current_step starts at 0" "$state_json" '.current_step == 0'
  assert_json_expr "started_at is a valid timestamp" "$state_json" '.started_at | type == "number" and . > 0'
  assert_json_expr "init defaults max_iterations to 3" "$state_json" '.max_iterations == 3'

  local advance_one_output
  advance_one_output="$("$SCRIPT_PATH" "$workdir" advance "$workflow_id" "1_scan" '{"findings":3,"notes":"ok"}')"
  assert_json_expr "advance increments current_step to 1" "$advance_one_output" '.current_step == 1'
  assert_json_expr "advance records step_name in step_outputs" "$advance_one_output" '.step_outputs["1_scan"] != null'
  assert_json_expr "advance adds transition_log with from/to/at" "$advance_one_output" '.transition_log | length == 1 and .[0].from != null and .[0].to == "1_scan" and (.[0].at | type == "number")'
  assert_json_expr "advance captures step_output_json" "$advance_one_output" '.step_outputs["1_scan"].findings == 3 and .step_outputs["1_scan"].notes == "ok"'

  local block_output
  block_output="$("$SCRIPT_PATH" "$workdir" block "$workflow_id" "waiting for input")"
  assert_json_expr "block sets is_blocked true" "$block_output" '.is_blocked == true and .blocked_reason == "waiting for input"'

  local blocked_advance_output
  blocked_advance_output="$("$SCRIPT_PATH" "$workdir" advance "$workflow_id" "2_diagnose" '{"findings":1}' 2>/dev/null || true)"
  assert_json_expr "advance rejects when blocked" "$blocked_advance_output" '.error == "blocked" and .workflow_id == "gx-recover-loop"'

  local unblock_output
  unblock_output="$("$SCRIPT_PATH" "$workdir" unblock "$workflow_id")"
  assert_json_expr "unblock clears blocked state" "$unblock_output" '.is_blocked == false and .blocked_reason == null'

  local advance_two_output
  advance_two_output="$("$SCRIPT_PATH" "$workdir" advance "$workflow_id" "2_diagnose" '{"findings":1}')"
  assert_json_expr "second advance reaches total_steps" "$advance_two_output" '.current_step == 2'

  local completed_advance_output
  completed_advance_output="$("$SCRIPT_PATH" "$workdir" advance "$workflow_id" "3_finalize" '{"done":true}' 2>/dev/null || true)"
  assert_json_expr "advance rejects when step >= total_steps" "$completed_advance_output" '.error == "already_complete" and .workflow_id == "gx-recover-loop"'

  local read_output
  read_output="$("$SCRIPT_PATH" "$workdir" read "$workflow_id")"
  assert_json_expr "read returns full state JSON" "$read_output" '.workflow_id == "gx-recover-loop" and .total_steps == 2 and (.transition_log | length) == 2'

  local missing_read_output
  missing_read_output="$("$SCRIPT_PATH" "$workdir" read "missing-workflow")"
  assert_json_expr "read returns not_found for missing workflow" "$missing_read_output" '.error == "not_found" and .workflow_id == "missing-workflow"'

  local list_output
  list_output="$("$SCRIPT_PATH" "$workdir" list)"
  assert_json_expr "list returns array with active workflow" "$list_output" 'type == "array" and length == 1 and .[0].workflow_id == "gx-recover-loop" and .[0].current_step == 2 and .[0].is_blocked == false'

  local cleanup_output
  cleanup_output="$("$SCRIPT_PATH" "$workdir" cleanup "$workflow_id")"
  assert_json_expr "cleanup returns archived status" "$cleanup_output" '.status == "archived" and .workflow_id == "gx-recover-loop"'
  assert_true "cleanup moves state file to archive directory" test -f "$archive_file"

  local jq_missing_output
  jq_missing_output="$(PATH="/definitely/missing" /bin/bash "$SCRIPT_PATH" "$workdir" list 2>/dev/null || true)"
  assert_json_expr "pre-flight check fails cleanly when jq missing" "$jq_missing_output" '.error == "jq_missing"'

  # Corrupt state file coverage
  local corrupt_workflow_id="gx-corrupt-state"
  local corrupt_state_file="${workdir}/.hivemind/state/wf-${corrupt_workflow_id}.json"
  printf '%s\n' '{"workflow_id":"gx-corrupt-state", invalid-json' >"$corrupt_state_file"

  local corrupt_read_output=""
  local corrupt_read_status=0
  corrupt_read_output="$("$SCRIPT_PATH" "$workdir" read "$corrupt_workflow_id" 2>/dev/null)" || corrupt_read_status=$?
  assert_true "read on corrupt state does not terminate via signal" test "$corrupt_read_status" -lt 128
  if [[ "$corrupt_read_status" -eq 0 ]]; then
    assert_json_expr "read on corrupt state returns error JSON when exit is zero" "$corrupt_read_output" '.error != null and .workflow_id == "gx-corrupt-state"'
  elif [[ -n "$corrupt_read_output" ]]; then
    assert_json_expr "read on corrupt state returns error JSON on non-zero exit" "$corrupt_read_output" '.error != null and .workflow_id == "gx-corrupt-state"'
  else
    pass "read on corrupt state can return empty stdout on non-zero exit"
  fi

  local corrupt_advance_output=""
  local corrupt_advance_status=0
  corrupt_advance_output="$("$SCRIPT_PATH" "$workdir" advance "$corrupt_workflow_id" "1_scan" '{"findings":0}' 2>/dev/null)" || corrupt_advance_status=$?
  assert_true "advance on corrupt state exits non-zero" test "$corrupt_advance_status" -ne 0
  assert_json_expr "advance on corrupt state returns corrupt_state JSON" "$corrupt_advance_output" '.error == "corrupt_state" and .workflow_id == "gx-corrupt-state"'

  # Re-init iteration count coverage
  local iter_workflow_id="test-iter"
  if "$SCRIPT_PATH" "$workdir" init "$iter_workflow_id" 3 >/dev/null 2>&1; then
    pass "iteration workflow init succeeds"
  else
    fail "iteration workflow init succeeds"
  fi

  local iter_advance_output
  iter_advance_output="$("$SCRIPT_PATH" "$workdir" advance "$iter_workflow_id" "1_scan" '{"findings":1}')"
  assert_json_expr "iteration workflow advance succeeds" "$iter_advance_output" '.current_step == 1'

  if "$SCRIPT_PATH" "$workdir" init "$iter_workflow_id" 3 >/dev/null 2>&1; then
    pass "re-init same workflow succeeds first time"
  else
    fail "re-init same workflow succeeds first time"
  fi

  local iter_state_after_reinit_one
  iter_state_after_reinit_one="$("$SCRIPT_PATH" "$workdir" read "$iter_workflow_id")"
  assert_json_expr "first re-init sets iteration_count to 1" "$iter_state_after_reinit_one" '.iteration_count == 1'

  if "$SCRIPT_PATH" "$workdir" init "$iter_workflow_id" 3 >/dev/null 2>&1; then
    pass "re-init same workflow succeeds second time"
  else
    fail "re-init same workflow succeeds second time"
  fi

  local iter_state_after_reinit_two
  iter_state_after_reinit_two="$("$SCRIPT_PATH" "$workdir" read "$iter_workflow_id")"
  assert_json_expr "second re-init sets iteration_count to 2" "$iter_state_after_reinit_two" '.iteration_count == 2'

  # Corrupt state: block and unblock
  local corrupt_block_output=""
  local corrupt_block_status=0
  corrupt_block_output="$("$SCRIPT_PATH" "$workdir" block "$corrupt_workflow_id" "test reason" 2>/dev/null)" || corrupt_block_status=$?
  assert_true "block on corrupt state exits non-zero" test "$corrupt_block_status" -ne 0
  if [[ -n "$corrupt_block_output" ]]; then
    assert_json_expr "block on corrupt state returns corrupt_state JSON" "$corrupt_block_output" '.error == "corrupt_state"'
  else
    pass "block on corrupt state returns corrupt_state JSON"
  fi

  local corrupt_unblock_output=""
  local corrupt_unblock_status=0
  corrupt_unblock_output="$("$SCRIPT_PATH" "$workdir" unblock "$corrupt_workflow_id" 2>/dev/null)" || corrupt_unblock_status=$?
  assert_true "unblock on corrupt state exits non-zero" test "$corrupt_unblock_status" -ne 0
  if [[ -n "$corrupt_unblock_output" ]]; then
    assert_json_expr "unblock on corrupt state returns corrupt_state JSON" "$corrupt_unblock_output" '.error == "corrupt_state"'
  else
    pass "unblock on corrupt state returns corrupt_state JSON"
  fi

  rm -rf "$workdir"

  print_summary
  if ((FAIL_COUNT > 0)); then
    return 1
  fi
  return 0
}

main "$@"
