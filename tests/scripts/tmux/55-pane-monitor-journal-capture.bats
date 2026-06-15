#!/usr/bin/env bats
#
# 55-pane-monitor-journal-capture.bats — Phase 53 REQ-53-01 + REQ-53-02
# acceptance: the createPaneMonitorHook factory fires against a synthetic
# PaneCapturedEvent, writes a 7-field JSON entry to
# .hivemind/journal/<sid>/<ISO-ts>-pane.json, and dispose() stops further
# writes.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

# REQ-53-02 acceptance: the hook writes a journal file with 7 fields
@test "pane-monitor writes 7-field JSON journal entry on pane-captured event" {
  local journal_root="${BATS_TEST_TMPDIR}/project/.hivemind/journal"
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'test-session', observer, journalRoot: '${journal_root}' });
      // Dispatch the pane-captured event through the observer's main fn;
      // this iterates ALL registered paneCaptureListeners (including the
      // hook's handler).
      await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 2048, timestamp: 1780434056789 } });
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=1"* ]]

  # Glob the journal file
  run bash -c "ls ${journal_root}/test-session/ | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*-pane.json$'"
  [ "$status" -eq 0 ]
  local journal_file="${journal_root}/test-session/$(echo "$output" | head -1)"

  # jq assertions
  run jq -r .eventType "$journal_file"
  [ "$status" -eq 0 ]
  [ "$output" = "pane-captured" ]
  run jq -r .schemaVersion "$journal_file"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]   # CONTEXT-locked number, not "1.0" string (D-53-13)
  run jq -r 'keys | length' "$journal_file"
  [ "$status" -eq 0 ]
  [ "$output" = "7" ]
}

# REQ-53-01 acceptance: dispose() removes the listener
@test "pane-monitor dispose() prevents further writes" {
  local journal_root="${BATS_TEST_TMPDIR}/project/.hivemind/journal"
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'test-session', observer, journalRoot: '${journal_root}' });
      // Pre-dispose dispatch: writes 1 file
      await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 100, timestamp: 1780434056000 } });
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      // Post-dispose dispatch: must NOT write a new file (disposed flag short-circuits)
      await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 100, timestamp: 1780434057000 } });
      await hook.__waitForPendingRetries?.();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=1"* ]]
  # Confirm only 1 file exists (not 2)
  run bash -c "ls ${journal_root}/test-session/ | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]
}

# REQ-53-01 acceptance: dispose() is permanent — multiple post-dispose dispatches
# do not create any additional files. Verifies the `disposed: true` flag is
# sticky, not a one-shot that re-arms on next event.
@test "pane-monitor dispose() is permanent across multiple subsequent dispatches" {
  local journal_root="${BATS_TEST_TMPDIR}/project/.hivemind/journal"
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'test-session', observer, journalRoot: '${journal_root}' });
      // Pre-dispose: 1 event → 1 file
      await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 50, timestamp: 1780434056000 } });
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      // Post-dispose: 3 events — none should write
      for (let i = 0; i < 3; i++) {
        await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 50, timestamp: 1780434057000 + i } });
      }
      await hook.__waitForPendingRetries?.();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=1"* ]]
  # Confirm still only 1 file exists (not 4)
  run bash -c "ls ${journal_root}/test-session/ | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]
}
