#!/usr/bin/env bats
#
# 75-pane-captured-journal.bats — Phase 58.9 (P58.9 sticky-bug-busting) REQ-58.9-01
# acceptance: After SessionManager.startPolling captures content, the pane-captured
# event fires to the registered observer and the P53 pane-monitor hook writes BOTH
# (1) the 7-field JSON entry <ts>-pane.json AND (2) the sibling full-content file
# <ts>-pane-content.txt to .hivemind/journal/<sid>/.
#
# RED-FIRST (P58.9): this test intentionally fails with
# `not ok 1 — journal file <ts>-pane.json not found in .hivemind/journal/<sid>/`
# until Wave 2A wires the pane-captured emit from SessionManager.startPolling
# to the observer. Root cause documented at
# `.planning/debug/p51-plus-sticky-bugs-2026-06-04.md:39-50`.
#
# Test outline:
#   1. Construct a SessionManager with a real TmuxMultiplexer + a tmux session
#      spawned with `cat` (so capturePaneContent returns stable content).
#   2. Construct a TmuxEventObserver wrapping the SessionManager, plus a
#      P53 pane-monitor hook subscribing to onPaneCaptured.
#   3. Call sessionManager.setObserver(observer) to wire the emit.
#   4. Call sessionManager.startPolling(500) for a short interval, wait ~3s.
#   5. Assert BOTH <ts>-pane.json (7 fields) AND <ts>-pane-content.txt (full
#      content) are written to .hivemind/journal/<sid>/.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p58-9-journal-$$" 2>/dev/null || true
}

@test "pane-captured emit from startPolling writes both <ts>-pane.json (7 fields) and <ts>-pane-content.txt (P58.9 REQ-01, slot 75)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58-9-journal-$$"
  local journal_root="${project}/.hivemind/journal"
  local sid="bats-75-journal-$$"

  # Step 1: spawn tmux session with `cat` so capturePaneContent returns stable content
  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  tmux has-session -t "$tmux_session"
  local pane_id
  pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$pane_id" ]

  # Step 2-4: construct SessionManager, observer, hook, wire, start polling
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/integration.js').then(async (integration) => {
      const tmuxIntegration = await integration.createTmuxIntegrationIfSupported('${project}', { log: { debug() {}, info() {}, warn() {}, error() {} } });
      if (!tmuxIntegration) {
        process.stdout.write('skip-no-tmux-integration');
        return;
      }
      const sm = tmuxIntegration.sessionManager_;
      const observer = tmuxIntegration.adapter;
      // P58.9 REQ-01: wire the observer into the SessionManager so the
      // polling tick emits pane-captured events. This call is a no-op
      // before Wave 2A (setObserver doesn't exist) — RED.
      if (typeof sm.setObserver === 'function') {
        sm.setObserver(observer);
      } else {
        // RED: pre-Wave-2A code path — emit is missing
        process.stdout.write('red-no-setObserver');
        return;
      }
      // P53 hook
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const { createTmuxEventObserver } = await import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js');
      const tmuxObserver = createTmuxEventObserver(observer);
      const hook = createPaneMonitorHook({
        sessionId: '${sid}',
        observer: tmuxObserver,
        journalRoot: '${journal_root}',
        logWarn: () => {},
      });

      // Manually add a tracked session so polling has work to do
      // The SessionManager's sessions map is private; use the public
      // startPolling entry point which iterates whatever is currently tracked.
      // We simulate by calling the multiplexer capture path via startPolling.
      sm.startPolling(500);

      // Wait ~3s for at least one polling tick + journal write
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // Stop polling and clean up
      sm.stopPolling();
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      tmuxIntegration.multiplexer.closePane?.('${pane_id}');

      process.stdout.write('written=' + hook.counters.written);
    }).catch((err) => {
      process.stdout.write('error=' + err.message);
    });
  "
  [ "$status" -eq 0 ]

  # RED: pre-Wave-2A the output contains "red-no-setObserver" or "written=0"
  if [[ "$output" == *"red-no-setObserver"* ]]; then
    echo "RED-EXPECTED-FAIL: SessionManager.setObserver() not yet wired"
    return 1
  fi
  if [[ "$output" != *"written=1"* ]]; then
    echo "RED-EXPECTED-FAIL: hook did not write any journal entries; output:"
    echo "$output"
    return 1
  fi

  # GREEN: assert both files exist
  local journal_file
  journal_file="$(ls "${journal_root}/${sid}/" | grep -E '\-pane\.json$' | head -1)"
  [ -n "$journal_file" ] || { echo "FAIL: no *-pane.json found in ${journal_root}/${sid}/"; return 1; }

  local content_file
  content_file="$(ls "${journal_root}/${sid}/" | grep -E '\-pane-content\.txt$' | head -1)"
  [ -n "$content_file" ] || { echo "FAIL: no *-pane-content.txt found in ${journal_root}/${sid}/"; return 1; }

  # 7-field JSON schema assertion
  run jq -r 'keys | length' "${journal_root}/${sid}/${journal_file}"
  [ "$status" -eq 0 ]
  [ "$output" = "7" ]

  # Content file is non-empty
  run wc -c < "${journal_root}/${sid}/${content_file}"
  [ "$status" -eq 0 ]
  [ "$output" -gt 0 ]

  tmux kill-session -t "$tmux_session"
}
