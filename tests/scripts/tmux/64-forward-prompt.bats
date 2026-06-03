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
    const { tmuxCopilotTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    const result = await tmuxCopilotTool.execute(
      { action: 'forward-prompt', paneId: '${live_pane_id}', text: '${probe}' },
      { sessionID: 'ses-p58-64-$$', agent: 'hm-l0-orchestrator' }
    );
    process.stdout.write(result);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"deliveredAt"* ]]
  [[ "$output" == *"byteLength"* ]]

  sleep 0.2

  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c 'orchestrator-forward'"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]

  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c '${probe}'"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]

  tmux kill-session -t "$tmux_session"
}
