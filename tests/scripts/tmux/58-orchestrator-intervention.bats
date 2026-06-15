#!/usr/bin/env bats
#
# 58-orchestrator-intervention.bats — Phase 55 REQ-55-02 acceptance (criterion 2):
# the TmuxMultiplexer.sendKeys() method delivers the supplied text to a
# real tmux pane, and the pane's capture-pane buffer reflects the sent
# text (proving the keystrokes actually arrive on the receiving OS process).

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p55-intervention-$$" 2>/dev/null || true
}

@test "TmuxMultiplexer.sendKeys delivers text to a real tmux pane (cat renders the probe in capture-pane)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p55-intervention-$$"
  local probe="E2E-INTERVENTION-PROBE-1780434056"

  # Step 1: spawn a real tmux session with `cat` (reads stdin, renders to buffer)
  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Step 2: discover the live paneId
  local live_pane_id
  live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$live_pane_id" ]

  # Step 3: call TmuxMultiplexer.sendKeys() directly (bypasses the integration
  # factory's `if (!process.env.TMUX) return null` gate, which would block
  # BATS from running outside a tmux session). TmuxMultiplexer.sendKeys is
  # the underlying transport — it executes `tmux send-keys -t <paneId> <text>`.
  # This bypasses both the integration factory AND the tmux-copilot tool's
  # permission gate (orchestrator-tier required) by calling the underlying
  # transport directly — the same delivery mechanism the tool uses.
  run tmux_node_eval "
    const { TmuxMultiplexer } = await import('${TMUX_BATS_DIST}/tmux-multiplexer.js');
    const multiplexer = new TmuxMultiplexer('main-vertical', 60);
    await multiplexer.sendKeys('${live_pane_id}', '${probe}', false);
    process.stdout.write('sent=true paneId=' + '${live_pane_id}');
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"sent=true"* ]]
  [[ "$output" == *"paneId=${live_pane_id}"* ]]

  # Step 4: wait 200ms for tmux to flush the keys to the receiving process (D-55-08)
  sleep 0.2

  # Step 5: capture the pane buffer and assert the probe is present
  run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c '${probe}'"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]   # the probe appears in the rendered output

  # Cleanup
  tmux kill-session -t "$tmux_session"
}
