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
#   1. Spawn a real tmux session running `cat` (so capturePaneContent returns
#      stable content).
#   2. Construct a TmuxMultiplexer + SessionManager directly (bypassing the
#      createTmuxIntegrationIfSupported factory which requires TMUX env).
#   3. Manually inject a tracked session so startPolling has work to do.
#   4. Construct a TmuxEventObserver + pane-monitor hook.
#   5. Call sessionManager.setObserver(observer) to wire the emit.
#   6. Call sessionManager.startPolling(500) and wait ~3s.
#   7. Assert BOTH <ts>-pane.json (7 fields) AND <ts>-pane-content.txt (full
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

  # Skip if no tmux server
  if ! tmux has-session -t "_nonexistent_test_session_$$" 2>/dev/null; then
    if ! tmux start-server 2>/dev/null; then
      skip "no tmux server available"
    fi
  fi

  # Step 1: spawn tmux session with `cat` (so capture-pane returns stable content)
  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  tmux has-session -t "$tmux_session"
  local pane_id
  pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$pane_id" ]

  # Steps 2-6: construct multiplexer + SessionManager directly, manually inject
  # a tracked session, wire observer, start polling, wait, assert journal
  run tmux_node_eval "
    (async () => {
      const mux = await import('${TMUX_BATS_ROOT}/dist/features/tmux/tmux-multiplexer.js');
      const sm = await import('${TMUX_BATS_ROOT}/dist/features/tmux/session-manager.js');
      const obs = await import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js');
      const hook = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const logger = { debug() {}, info() {}, warn() {}, error() {} };
      const multiplexer = new mux.TmuxMultiplexer('main-vertical', 60, logger);
      const sessionManager_ = new sm.SessionManager(
        multiplexer,
        'http://localhost:0',
        '${project}',
        logger,
      );

      // P58.9 REQ-01: wire observer into SessionManager so the polling tick
      // emits pane-captured events. This call is a no-op before Wave 2A
      // (setObserver doesn't exist) — RED.
      if (typeof sessionManager_.setObserver === 'function') {
        // No-op until later; we'll wire a real observer below
      } else {
        process.stdout.write('red-no-setObserver');
        return;
      }

      // Manually inject a tracked session so startPolling has work to do.
      // The 'sessions' Map is private; we use a small reflection trick to
      // reach it without changing the public API.
      const sessionsMap = sessionManager_.sessions;
      sessionsMap.set('${sid}', {
        sessionId: '${sid}',
        agent: 'bats',
        delegationId: '${sid}',
        directory: '${project}',
        paneId: '${pane_id}',
        spawnTime: Date.now(),
        ageTimer: null,
        state: 'ready',
      });

      // P53 hook consumes pane-captured events
      const tmuxObserver = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const paneMonitorHook = hook.createPaneMonitorHook({
        sessionId: '${sid}',
        observer: tmuxObserver,
        journalRoot: '${journal_root}',
        logWarn: () => {},
      });

      // Wire SessionManager observer → tmuxObserver (production-style wiring)
      sessionManager_.setObserver({
        onPaneCaptured: (event) => {
          // Forward to the real tmuxObserver via its async dispatch fn
          // (mirrors what the production adapter does in src/plugin.ts).
          void tmuxObserver({ event });
        },
      });

      // Start polling with a short interval (MIN_POLL_MS is 5000ms hard
      // constant — the polling tick will fire ~5s after startPolling).
      sessionManager_.startPolling(500);

      // Drive the pane with a probe so the first polling tick detects a
      // hash change (otherwise the initial empty pane has the same
      // content as the first capture, and the event is gated on hash CHANGE).
      const { execSync } = await import('node:child_process');
      execSync('tmux send-keys -t ' + JSON.stringify('${pane_id}') + ' -l ' + JSON.stringify('PROBE-58-9-' + Date.now()));
      await new Promise((r) => setTimeout(r, 200));

      // Wait ~7s for at least 1 polling tick + journal write
      await new Promise((resolve) => setTimeout(resolve, 7000));

      // Stop polling and clean up
      sessionManager_.stopPolling();
      await paneMonitorHook.__waitForPendingRetries?.();
      await paneMonitorHook.dispose();

      process.stdout.write('written=' + paneMonitorHook.counters.written);
    })().catch((err) => {
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
  journal_file="$(ls "${journal_root}/${sid}/" 2>/dev/null | grep -E '\-pane\.json$' | head -1)"
  [ -n "$journal_file" ] || { echo "FAIL: no *-pane.json in ${journal_root}/${sid}/"; return 1; }

  local content_file
  content_file="$(ls "${journal_root}/${sid}/" 2>/dev/null | grep -E '\-pane-content\.txt$' | head -1)"
  [ -n "$content_file" ] || { echo "FAIL: no *-pane-content.txt in ${journal_root}/${sid}/"; return 1; }

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
