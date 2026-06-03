#!/usr/bin/env bats
#
# 65-takeover-release.bats — Phase 58 REQ-58-05 acceptance:
# tmux-copilot take-over sets manualOverride=true; forward-prompt returns
# suppressed envelope when manualOverride is set; release clears the flag;
# subsequent forward-prompt delivers.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p58-takeover-$$" 2>/dev/null || true
  tmux_node_eval "
    const { setManualOverrideState } = await import('${TMUX_BATS_ROOT}/dist/features/session-tracker/index.js');
    setManualOverrideState('ses-p58-65-$$', { manualOverride: false });
  " 2>/dev/null || true
}

@test "tmux-copilot take-over / release suppresses and restores forward-prompt (G5)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58-takeover-$$"
  local session_id="ses-p58-65-$$"
  local probe_suppressed="SHOULD-BE-SUPPRESSED-1780434056"
  local probe_delivered="SHOULD-BE-DELIVERED-1780434056"

  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  local live_pane_id
  live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$live_pane_id" ]

  # Step 1: take-over
  run tmux_node_eval "
    const { tmuxCopilotTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    const { getManualOverrideState } = await import('${TMUX_BATS_ROOT}/dist/features/session-tracker/index.js');
    const result = await tmuxCopilotTool.execute(
      { action: 'take-over', sessionId: '${session_id}', paneId: '${live_pane_id}' },
      { sessionID: '${session_id}', agent: 'hm-l0-orchestrator' }
    );
    const state = getManualOverrideState('${session_id}');
    process.stdout.write('result=' + result + ' state=' + JSON.stringify(state));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"human-operator"* ]]
  [[ "$output" == *"\"manualOverride\":true"* ]]

  # Step 2: forward-prompt suppressed
  run tmux_node_eval "
    const { tmuxCopilotTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    const result = await tmuxCopilotTool.execute(
      { action: 'forward-prompt', paneId: '${live_pane_id}', text: '${probe_suppressed}' },
      { sessionID: '${session_id}', agent: 'hm-l0-orchestrator' }
    );
    process.stdout.write(result);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"\"suppressed\":true"* ]]
  [[ "$output" == *"manualOverride"* ]]

  sleep 0.2
  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c '${probe_suppressed}'"
  [ "$status" -eq 0 ]
  [ "$output" -eq 0 ]

  # Step 3: release
  run tmux_node_eval "
    const { tmuxCopilotTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    const { getManualOverrideState } = await import('${TMUX_BATS_ROOT}/dist/features/session-tracker/index.js');
    const result = await tmuxCopilotTool.execute(
      { action: 'release', sessionId: '${session_id}' },
      { sessionID: '${session_id}', agent: 'hm-l0-orchestrator' }
    );
    const state = getManualOverrideState('${session_id}');
    process.stdout.write('result=' + result + ' state=' + JSON.stringify(state));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"releasedAt"* ]]
  [[ "$output" == *"\"manualOverride\":false"* ]]

  # Step 4: forward-prompt delivered
  run tmux_node_eval "
    const { tmuxCopilotTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js');
    const result = await tmuxCopilotTool.execute(
      { action: 'forward-prompt', paneId: '${live_pane_id}', text: '${probe_delivered}' },
      { sessionID: '${session_id}', agent: 'hm-l0-orchestrator' }
    );
    process.stdout.write(result);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"deliveredAt"* ]]

  sleep 0.2
  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c '${probe_delivered}'"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]

  tmux kill-session -t "$tmux_session"
}
