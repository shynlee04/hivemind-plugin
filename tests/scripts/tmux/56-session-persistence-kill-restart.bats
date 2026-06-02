#!/usr/bin/env bats
#
# 56-session-persistence-kill-restart.bats — Phase 54 REQ-54-05 acceptance
# (kill-parent-restart-recovery): a session persistence record survives
# across process boundaries. The test exercises the full contract:
#   1. Spawn a real tmux session (real OS process — not a mock)
#   2. Write a persistence record via the compiled factory
#   3. Verify the on-disk file has the 9-field shape + schemaVersion: 1 (numeric)
#   4. Verify the tmux session is still alive (cross-process state channel)
#   5. Simulate a harness restart by invoking restoreAll() in a fresh node process
#
# The "kill-parent" is simulated by the fact that each tmux_node_eval call
# is a fresh OS process. The on-disk persistence record IS the cross-process
# state channel that lets a new harness invocation find the live session.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  # Defensive cleanup — kill any tmux session we created during the test.
  # BATS auto-runs teardown per test.
  tmux kill-session -t "p54-kill-restart-$$" 2>/dev/null || true
}

@test "session persistence record survives harness parent kill and tmux session stays alive" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p54-kill-restart-$$"
  local sid="p54-survive-$$-$(date +%s%N)"
  local state_file="${project}/.hivemind/state/tmux-sessions/${sid}.json"

  # Step 1: spawn a real tmux session. This is a child OS process of the
  # tmux server (a system service), NOT of the harness — so when the
  # harness "dies" (simulated by ending the current node process), the
  # tmux session continues to live.
  tmux new-session -d -s "$tmux_session" -c "$project" "sleep 600"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Step 2: write a persistence record via the compiled factory. This
  # simulates the SessionManager's "active → ready" persist call after
  # a successful spawn.
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
      const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
      await p.persist({
        schemaVersion: 1,
        sessionId: '${sid}',
        agent: 'survive-agent',
        delegationId: 'survive-delegation',
        directory: '${project}',
        paneId: '%1',
        spawnTime: Date.now(),
        state: 'ready',
        lastTransitionAt: Date.now(),
      });
      process.stdout.write('persisted=true');
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"persisted=true"* ]]

  # Step 3: assert the persistence file exists with the 9-field shape
  [ -f "$state_file" ]
  run jq -r .state "$state_file"
  [ "$status" -eq 0 ]
  [ "$output" = "ready" ]
  run jq -r 'keys | length' "$state_file"
  [ "$status" -eq 0 ]
  [ "$output" = "9" ]
  run jq -r .schemaVersion "$state_file"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]   # numeric literal, NOT "1.0" (D-54-03)

  # Step 4: confirm the tmux session is STILL ALIVE (the kill-parent-restart-recovery contract)
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Step 5: simulate a fresh harness invocation by calling restoreAll() in
  # a brand-new node process. This proves that a new process can pick
  # up where the previous one died. The current record has state=ready
  # (not paused/detached), so the alive filter returns 0 — but the
  # file is still on disk and parseable.
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
      const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
      const records = await p.restoreAll();
      const alive = records.filter((r) => r.state === 'paused' || r.state === 'detached');
      process.stdout.write('total=' + records.length + ' alive=' + alive.length);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"total=1"* ]]
  [[ "$output" == *"alive=0"* ]]  # state=ready is filtered out (D-54-06)

  # Cleanup the tmux session
  tmux kill-session -t "$tmux_session"
}
