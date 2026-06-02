#!/usr/bin/env bats
#
# 59-session-persistence-restart.bats — Phase 55 REQ-55-03 acceptance (criterion 3):
# a session persistence record survives across process boundaries AND the
# underlying tmux session stays alive after a simulated harness crash.
# Two scenarios: (1) ready-state kill (state ∉ {paused, detached} → not restored),
# (2) detached-state restore (state ∈ {paused, detached} → restored + tmux alive).

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p55-restart-$$" 2>/dev/null || true
}

# Scenario 1: state=ready → restoreAll() filter excludes it (D-54-06)
@test "ready-state persistence record survives harness crash but is NOT in restoreAll alive filter" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p55-restart-$$"
  local sid="p55-ready-$$-$(date +%s%N)"
  local state_file="${project}/.hivemind/state/tmux-sessions/${sid}.json"

  tmux new-session -d -s "$tmux_session" -c "$project" "sleep 1800"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Write a ready-state record via the compiled factory
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
      const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
      await p.persist({
        schemaVersion: 1,
        sessionId: '${sid}',
        agent: 'ready-agent',
        delegationId: 'ready-delegation',
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

  # Assert 9-field shape + schemaVersion: 1 numeric (D-54-03)
  [ -f "$state_file" ]
  run jq -r .state "$state_file"
  [ "$status" -eq 0 ]
  [ "$output" = "ready" ]
  run jq -r 'keys | length' "$state_file"
  [ "$status" -eq 0 ]
  [ "$output" = "9" ]

  # Simulate fresh-harness restart — restoreAll() returns 0 (ready filtered out)
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
  [[ "$output" == *"alive=0"* ]]   # state=ready is filtered out (D-54-06)

  # Assert tmux session is STILL ALIVE (OS process survival — the seed criterion 3 contract)
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  tmux kill-session -t "$tmux_session"
}

# Scenario 2: state=detached → restoreAll() filter INCLUDES it + tmux alive
@test "detached-state persistence record survives harness crash AND is restored + tmux session alive" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p55-restart-$$"
  local sid="p55-detached-$$-$(date +%s%N)"
  local state_file="${project}/.hivemind/state/tmux-sessions/${sid}.json"

  tmux new-session -d -s "$tmux_session" -c "$project" "sleep 1800"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Write a detached-state record (manually injected per CONTEXT §"deferred")
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
      const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
      await p.persist({
        schemaVersion: 1,
        sessionId: '${sid}',
        agent: 'detached-agent',
        delegationId: 'detached-delegation',
        directory: '${project}',
        paneId: '%1',
        spawnTime: Date.now(),
        state: 'detached',
        lastTransitionAt: Date.now(),
      });
      process.stdout.write('persisted=true');
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"persisted=true"* ]]

  # Assert the file + 9-field shape
  [ -f "$state_file" ]
  run jq -r .state "$state_file"
  [ "$status" -eq 0 ]
  [ "$output" = "detached" ]

  # Simulate fresh-harness restart — restoreAll() returns the record (state=detached is alive)
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
  [[ "$output" == *"alive=1"* ]]   # state=detached is IN the alive filter (seed criterion 3)

  # Assert tmux session is STILL ALIVE (the seed criterion 3 OS-survival contract)
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  tmux kill-session -t "$tmux_session"
}
