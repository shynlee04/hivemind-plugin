#!/usr/bin/env bats
#
# 72-user-inject.bats — Phase 58.8 (P58 gap-fix) REQ-58-08 acceptance:
# tmux-copilot {action: take-over}, {action: peek}, and {action: release}
# are accessible to user-tier callers (agent = "user" or "__user__"),
# returning success envelopes (NOT permission-denied).
#
# Slot 72. RED-FIRST (P58.8): this test intentionally fails with
# `not ok 1 — take-over returned permission-denied for agent "user"`
# because the orchestrator-only whitelist in tmux-copilot.ts:51-56 does
# NOT include "user" yet. The test flips to GREEN once the USER_SESSION
# tier is added and the new `peek` action lands on tmux-copilot.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p58-user-72-$$" 2>/dev/null || true
  tmux_node_eval "
    const { setManualOverrideState } = await import('${TMUX_BATS_ROOT}/dist/features/session-tracker/index.js');
    setManualOverrideState('ses-p58-72-$$', { manualOverride: false });
  " 2>/dev/null || true
}

@test "tmux-copilot take-over / peek / release accessible to user-tier caller (S2, slot 72 — P58.8)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58-user-72-$$"
  local session_id="ses-p58-72-$$"

  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  local live_pane_id
  live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$live_pane_id" ]

  # Mock multiplexer — peek will need a getLatestCapture-style call, but for
  # take-over / release we only need sendKeys to exist (and not be invoked).
  run tmux_node_eval "
    const { tmuxCopilotTool, __setTmuxMultiplexerForTesting } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    __setTmuxMultiplexerForTesting({
      sendKeys: async () => Promise.resolve(),
    });
    // Step 1: take-over from user-tier (agent = 'user'). Currently returns
    // permission-denied because user is not in ORCHESTRATOR_AGENT_NAMES.
    const result = await tmuxCopilotTool.execute(
      { action: 'take-over', sessionId: '${session_id}', paneId: '${live_pane_id}' },
      { sessionID: '${session_id}', agent: 'user' }
    );
    process.stdout.write('result=' + result);
  "
  [ "$status" -eq 0 ]
  if [[ "$output" == *"permission-denied"* ]]; then
    echo "RED-EXPECTED-FAIL: take-over from user-tier returned permission-denied; output:"
    echo "$output"
    return 1
  fi
  [[ "$output" == *"takenBy"* ]]

  # Step 2: release from user-tier.
  run tmux_node_eval "
    const { tmuxCopilotTool, __setTmuxMultiplexerForTesting } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    __setTmuxMultiplexerForTesting({
      sendKeys: async () => Promise.resolve(),
    });
    const result = await tmuxCopilotTool.execute(
      { action: 'release', sessionId: '${session_id}' },
      { sessionID: '${session_id}', agent: 'user' }
    );
    process.stdout.write('result=' + result);
  "
  [ "$status" -eq 0 ]
  if [[ "$output" == *"permission-denied"* ]]; then
    echo "RED-EXPECTED-FAIL: release from user-tier returned permission-denied; output:"
    echo "$output"
    return 1
  fi
  [[ "$output" == *"releasedAt"* ]]

  # Step 3: peek action from user-tier.
  run tmux_node_eval "
    const { tmuxCopilotTool, __setTmuxMultiplexerForTesting } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    __setTmuxMultiplexerForTesting({
      sendKeys: async () => Promise.resolve(),
    });
    const result = await tmuxCopilotTool.execute(
      { action: 'peek', paneId: '${live_pane_id}' },
      { sessionID: '${session_id}', agent: 'user' }
    );
    process.stdout.write('result=' + result);
  "
  [ "$status" -eq 0 ]
  if [[ "$output" == *"permission-denied"* ]] || [[ "$output" == *"invalid-input"* ]]; then
    echo "RED-EXPECTED-FAIL: peek from user-tier rejected; output:"
    echo "$output"
    return 1
  fi

  # Restore the multiplexer to null.
  run tmux_node_eval "
    const { __setTmuxMultiplexerForTesting } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    __setTmuxMultiplexerForTesting(null);
  " 2>/dev/null || true

  tmux kill-session -t "$tmux_session"
}
