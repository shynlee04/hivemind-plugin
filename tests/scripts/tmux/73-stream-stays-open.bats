#!/usr/bin/env bats
#
# 73-stream-stays-open.bats — Phase 58.8 (P58 gap-fix) REQ-58-09 acceptance:
# After dispatching a slow delegation, dispatch() does NOT block on
# sendPromptAsync. The orchestrator's main stream is not coupled to
# the child prompt's send latency.
#
# Slot 73. RED-FIRST (P58.8): this test intentionally fails with
# `not ok 1 — manager-runtime.ts still awaits sendPromptAsync at line 244`
# because the current code uses `await sendPromptAsync(...)` which blocks
# the dispatch return until the SDK accepts the prompt. The test flips
# to GREEN once the call is replaced with `void sendPromptAsync(...).catch(...)`
# (true fire-and-forget WaiterModel).
#
# Test outline (structural + behavioral):
#   1. Grep manager-runtime.ts to confirm the fire-and-forget pattern
#      (`void sendPromptAsync`) at line 244 (the dispatch call site).
#      This is a deterministic, fast RED test that does not require a
#      real OpenCode SDK connection.
#   2. Verify the WaiterModel comment in delegate-task.ts:32 was updated
#      to "true-fire-and-forget WaiterModel (P58.3)" (per AC-58-09-04).

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  :  # nothing to clean
}

@test "manager-runtime dispatch does not await sendPromptAsync (S3, slot 73 — P58.8)" {
  cd "${TMUX_BATS_ROOT}"

  # Step 1: confirm the fire-and-forget pattern at manager-runtime.ts:244.
  # The current RED state has `await sendPromptAsync(...)` which blocks
  # the dispatch return. After the implementation lands, it becomes
  # `void sendPromptAsync(...).catch(err => logger.error({err, dispatchId}, "..."))`.
  #
  # The grep is line-bounded to 235-260 to tolerate minor future shifts;
  # it asserts the await form is absent and the void form is present.
  local mgr_runtime="src/coordination/delegation/manager-runtime.ts"
  local has_await send_block
  has_await="$(awk 'NR>=235 && NR<=260' "$mgr_runtime" | grep -cE '^\s*await sendPromptAsync' || true)"
  send_block="$(awk 'NR>=235 && NR<=260' "$mgr_runtime" | grep -cE '^\s*void sendPromptAsync' || true)"

  if [[ "$has_await" -ge 1 ]]; then
    echo "RED-EXPECTED-FAIL: manager-runtime.ts still has 'await sendPromptAsync' between lines 235-260; this blocks dispatch return."
    return 1
  fi
  if [[ "$send_block" -lt 1 ]]; then
    echo "RED-EXPECTED-FAIL: manager-runtime.ts does not yet use 'void sendPromptAsync' between lines 235-260; fire-and-forget pattern missing (send_block=$send_block)."
    return 1
  fi

  # Step 2: verify the comment fix in delegate-task.ts:32 (AC-58-09-04).
  # The previous comment said 'always-background WaiterModel' but the
  # code at line 78-87 was actually awaiting. After the fix, the
  # comment says 'true-fire-and-forget WaiterModel (P58.3)'.
  local comment_present
  comment_present="$(grep -c 'true-fire-and-forget WaiterModel (P58.3)' src/tools/delegation/delegate-task.ts)"
  if [[ "$comment_present" -lt 1 ]]; then
    echo "RED-EXPECTED-FAIL: delegate-task.ts comment not yet updated to 'true-fire-and-forget WaiterModel (P58.3)'; AC-58-09-04 unmet."
    return 1
  fi
}
