#!/usr/bin/env bats
#
# 64-forward-prompt.bats — Phase 58 REQ-58-04 acceptance:
# tmux-copilot forward-prompt action prepends [orchestrator-forward ISO]\n
# sentinel and delivers the text to a live cat process in a tmux pane.
# The sentinel line and the probe text are both visible in capture-pane.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p58-forward-$$" 2>/dev/null || true
}

@test "tmux-copilot forward-prompt delivers sentinel-prepended text to live pane (G4)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58-forward-$$"
  local probe="E2E-FORWARD-PROBE-1780434056"

  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  local live_pane_id
  live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$live_pane_id" ]

  run tmux_node_eval "
    const { tmuxCopilotTool, __setTmuxMultiplexerForTesting } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    // P58 PLAN-07 (Gap 3 fix): Inject a hybrid multiplexer mock. The mock
    // captures sendKeys calls (so we can assert the paneId was passed through)
    // AND forwards to the real tmux send-keys (so capture-pane can verify
    // the actual key delivery to the live cat process).
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileP = promisify(execFile);
    const captured = { sentToPaneId: null, sentText: null };
    __setTmuxMultiplexerForTesting({
      sendKeys: async (paneId, text, literal) => {
        captured.sentToPaneId = paneId;
        captured.sentText = text;
        // Forward to real tmux so capture-pane can verify delivery
        if (literal) {
          await execFileP('tmux', ['send-keys', '-t', paneId, '-l', text]);
        } else {
          await execFileP('tmux', ['send-keys', '-t', paneId, text]);
        }
      },
    });
    const result = await tmuxCopilotTool.execute(
      { action: 'forward-prompt', paneId: '${live_pane_id}', text: '${probe}' },
      { sessionID: 'ses-p58-64-$$', agent: 'hm-l0-orchestrator' }
    );
    process.stdout.write('result=' + result + ' captured=' + JSON.stringify(captured));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"deliveredAt"* ]]
  [[ "$output" == *"byteLength"* ]]
  [[ "$output" == *"\"sentToPaneId\":\"${live_pane_id}\""* ]]

  sleep 0.2

  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c 'orchestrator-forward'"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]

  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c '${probe}'"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]

  # P58 PLAN-07 (Gap 3 fix): Restore the multiplexer to null so subsequent
  # tests in the same process don't see the mock.
  run tmux_node_eval "
    const { __setTmuxMultiplexerForTesting } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    __setTmuxMultiplexerForTesting(null);
  " 2>/dev/null || true

  tmux kill-session -t "$tmux_session"
}
