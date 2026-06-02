#!/usr/bin/env bats
#
# 57-live-pane-monitoring.bats — Phase 55 REQ-55-01 acceptance (criterion 1):
# the createPaneMonitorHook hook writes a 7-field JSON journal entry to
# .hivemind/journal/<sid>/<ISO-ts>-pane.json when a REAL tmux session emits
# a pane-captured event (NOT a synthetic stub). The journal entry's paneId
# matches the live tmux pane — proving the end-to-end chain: real tmux
# server → observer → hook → journal.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p55-monitor-$$" 2>/dev/null || true
}

@test "live tmux pane-captured event writes 7-field JSON journal entry with live paneId" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p55-monitor-$$"
  local journal_root="${project}/.hivemind/journal"
  local sid="p55-monitor-$$-$(date +%s%N)"

  # Step 1: spawn a real tmux session (real OS process — not a mock)
  tmux new-session -d -s "$tmux_session" -c "$project" "sleep 600"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Step 2: discover the live paneId
  local live_pane_id
  live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$live_pane_id" ]

  # Step 3: wire the P52 observer + P53 hook (same as P53 BATS slot 55,
  # but with the LIVE paneId instead of hard-coded "%7")
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: '${sid}', observer, journalRoot: '${journal_root}' });
      await observer({ event: { type: 'pane-captured', sessionId: '${sid}', paneId: '${live_pane_id}', contentLength: 2048, timestamp: Date.now() } });
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      process.stdout.write('written=' + hook.counters.written + ' paneId=' + '${live_pane_id}');
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=1"* ]]
  [[ "$output" == *"paneId=${live_pane_id}"* ]]

  # Step 4: assert the journal file exists with 7 fields (D-53-13 schema)
  local journal_file
  journal_file="$(ls ${journal_root}/${sid}/ 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*-pane.json$' | head -1)"
  [ -n "$journal_file" ]
  local full_path="${journal_root}/${sid}/${journal_file}"

  run jq -r .eventType "$full_path"
  [ "$status" -eq 0 ]
  [ "$output" = "pane-captured" ]
  run jq -r .schemaVersion "$full_path"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]   # P53 uses numeric 1 (D-53-13 + JournalEntry interface in pane-monitor.ts:108) — NOT "1.0" string (per actual source code)
  run jq -r 'keys | length' "$full_path"
  [ "$status" -eq 0 ]
  [ "$output" = "7" ]
  run jq -r .paneId "$full_path"
  [ "$status" -eq 0 ]
  [ "$output" = "${live_pane_id}" ]   # matches the LIVE tmux paneId (E2E contract)

  # Cleanup
  tmux kill-session -t "$tmux_session"
}
