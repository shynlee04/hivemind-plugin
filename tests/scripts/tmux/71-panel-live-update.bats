#!/usr/bin/env bats
#
# 71-panel-live-update.bats — Phase 58.8 (P58 gap-fix) REQ-58-07 acceptance:
# After delegate-task + 5s polling, capture-pane content is updated and
# delegation-status {action: "peek"} returns the captured content with
# non-empty `content` field for active delegations.
#
# Slot 71 (renamed from 67 in the original gap-fix plan: slot 67 was already
# occupied by `67-delegate-task-no-native-task-tool.bats` per
# 67-delegate-task-no-native-task-tool.bats:5-6 deferred-idea resolution).
#
# RED-FIRST (P58.8): this test intentionally fails with
# `not ok 1 — peek action returned error: action "peek" not found in
# discriminated union` until the implementation lands (delegation-status Zod
# union is extended with the `peek` action and TmuxMultiplexer.capturePaneContent
# is implemented).
#
# Test outline:
#   1. Spawn tmux session with `cat`, write probe text via tmux send-keys.
#   2. Wait 7s (covers the 5s polling cadence + 2s slack).
#   3. Invoke `delegation-status {action: "peek", paneId}` via the tool
#      factory and assert the returned `content` field contains the probe.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p58-panel-71-$$" 2>/dev/null || true
}

@test "delegation-status peek returns capture-pane content within 7s of send-keys (S1, slot 71 — P58.8)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58-panel-71-$$"
  local probe="PANEL-LIVE-UPDATE-PROBE-1780434056"

  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  local live_pane_id
  live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$live_pane_id" ]

  # Step 1: write probe text into the pane.
  run tmux send-keys -t "$live_pane_id" -l "$probe"
  [ "$status" -eq 0 ]

  # Step 2: wait 7s to allow the polling loop to capture the content.
  sleep 7

  # Step 3: invoke delegation-status peek action.
  # The peek action does not exist yet — RED. Expected error: "peek not in
  # discriminated union" / Zod parse failure. The test must FAIL until
  # delegation-status Zod union is extended with `action: "peek"`.
  run tmux_node_eval "
    const { createDelegationStatusTool } = await import('${TMUX_BATS_ROOT}/dist/tools/delegation/delegation-status.js');
    const tool = createDelegationStatusTool({
      getAllDelegations: () => [],
      getStatus: () => undefined,
      canSessionAccessDelegation: () => true,
    });
    const result = await tool.execute(
      { action: 'peek', paneId: '${live_pane_id}' },
      { sessionID: 'ses-p58-71-$$' }
    );
    process.stdout.write('result=' + result);
  "
  [ "$status" -eq 0 ]
  # RED: until peek action lands, output contains a Zod invalid-input error
  # and the probe is NOT in the content field. This assertion MUST fail in RED
  # state (no "content" key) and pass once peek is implemented.
  if [[ "$output" != *"\"content\":\"${probe}"* ]]; then
    echo "RED-EXPECTED-FAIL: peek did not return capture-pane content; output:"
    echo "$output"
    return 1
  fi

  tmux kill-session -t "$tmux_session"
}
