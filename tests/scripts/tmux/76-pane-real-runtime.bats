#!/usr/bin/env bats
#
# 76-pane-real-runtime.bats — Phase 58.9 (P58.9 sticky-bug-busting) REQ-58.9-03
# acceptance: A real opencode process running in a real tmux pane is captured
# by the real TmuxMultiplexer.capturePaneContent path. The pane content is then
# routed through a real TmuxEventObserver + P53 pane-monitor hook, producing
# a journal file with the captured content.
#
# RED-FIRST (P58.9): this test fails when (a) the observer + hook chain is
# broken, or (b) the multiplexer cannot capture real opencode output. After
# Wave 2C lands, this should exit 0.
#
# Skip pattern: per AC-58.9-03-06, scenario skips when no tmux server OR no
# opencode binary. On dev/laptop with both, the scenario asserts the
# production multiplexer → observer → hook chain.
#
# This test does NOT use the polling loop (that is tested in
# 75-pane-captured-journal.bats). It uses direct multiplexer capture to
# avoid hanging on polling timer chains.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
  tmux_bats_require_tmux_server
  tmux_bats_require_opencode
}

teardown() {
  tmux kill-session -t "p58-9-runtime-$$" 2>/dev/null || true
}

@test "real opencode output in tmux pane is captured by multiplexer + observer + hook (P58.9 REQ-03, slot 76)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58-9-runtime-$$"
  local journal_root="${project}/.hivemind/journal"
  local sid="bats-76-runtime-$$"

  # Step 1: spawn tmux session with REAL `opencode` (NOT `cat`) in the pane.
  # We pipe the opencode --version output into a file the multiplexer can
  # capture from a stable prompt. Then we use `cat` to keep the pane open.
  # The visible pane content includes both "opencode 1.15.13" (real binary
  # output) and the cat prompt, so capture-pane returns the opencode output.
  tmux new-session -d -s "$tmux_session" -c "$project" "opencode --version 2>&1 | tee /tmp/p58-9-opencode-output-$$.txt; cat"
  tmux has-session -t "$tmux_session"
  local pane_id
  pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$pane_id" ]

  # Wait briefly for opencode --version to write its output to the pane
  sleep 2

  # Step 2: capture the pane via the REAL TmuxMultiplexer, then dispatch
  # the pane-captured event through a real TmuxEventObserver + P53 hook.
  # This is the production path (without the polling loop) and exercises:
  #   real tmux session -> real capture-pane -> real observer -> real hook
  #   -> real journal write
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/tmux-multiplexer.js').then(async (mux) => {
      const obs = await import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js');
      const hook = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const multiplexer = new mux.TmuxMultiplexer('main-vertical', 60, { debug() {}, info() {}, warn() {}, error() {} });
      // Real capture via production path
      const capture = await multiplexer.capturePaneContent('${pane_id}', 5000);
      if (!capture || capture.byteLength === 0) {
        process.stdout.write('red-no-capture');
        return;
      }
      // Dispatch through real observer
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const paneMonitorHook = hook.createPaneMonitorHook({
        sessionId: '${sid}',
        observer,
        journalRoot: '${journal_root}',
        logWarn: () => {},
      });
      // Fire the pane-captured event (this is what the polling loop emits
      // AFTER Wave 2A wires it; here we drive it manually for the test).
      await observer({ event: {
        type: 'pane-captured',
        sessionId: '${sid}',
        paneId: '${pane_id}',
        contentLength: capture.byteLength,
        timestamp: Date.now(),
      } });
      await paneMonitorHook.__waitForPendingRetries?.();
      await paneMonitorHook.dispose();
      // Output indicator (truncate content for testability)
      process.stdout.write('written=' + paneMonitorHook.counters.written + ' content_marker=' + capture.content.indexOf('opencode'));
    }).catch((err) => {
      process.stdout.write('error=' + err.message);
    });
  "
  [ "$status" -eq 0 ]

  # Cleanup tmp file written by the test
  rm -f /tmp/p58-9-opencode-output-$$.txt

  # RED check: capture MUST succeed
  if [[ "$output" == *"red-no-capture"* ]]; then
    echo "RED-EXPECTED-FAIL: TmuxMultiplexer could not capture opencode output from pane ${pane_id}"
    return 1
  fi
  if [[ "$output" != *"written=1"* ]]; then
    echo "RED-EXPECTED-FAIL: hook did not write journal entry; output:"
    echo "$output"
    return 1
  fi

  # GREEN assertions
  # 1. Real opencode output was captured (look for 'opencode' substring index in capture)
  if [[ "$output" != *"content_marker=-1"* ]]; then
    echo "RED-EXPECTED-FAIL: pane capture did not include 'opencode' output (got: ${output##*content_marker=})"
    return 1
  fi

  # 2. Journal file was written with 7 fields
  local journal_file
  journal_file="$(ls "${journal_root}/${sid}/" 2>/dev/null | grep -E '\-pane\.json$' | head -1)"
  [ -n "$journal_file" ] || { echo "FAIL: no *-pane.json in ${journal_root}/${sid}/"; return 1; }

  run jq -r 'keys | length' "${journal_root}/${sid}/${journal_file}"
  [ "$status" -eq 0 ]
  [ "$output" = "7" ]

  tmux kill-session -t "$tmux_session"
}
