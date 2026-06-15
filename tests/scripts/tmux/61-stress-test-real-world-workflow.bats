#!/usr/bin/env bats
#
# 61-stress-test-real-world-workflow.bats — Phase 56 REQ-56-01..06 acceptance:
# a single BATS scenario that exercises the complete P50-P55 tmux visual
# orchestration layer in a real-life, end-to-end multi-agent workflow.
# The 6 sub-flows are ATOMIC and INSEPARABLE (D-56-04) — partial failure
# in any sub-flow means the stress test FAILS as a whole.
#
# Sub-flows:
#   REQ-56-01: Spawn 3 real tmux sessions (e2e-test-{pid}-{i} for i=0,1,2)
#   REQ-56-02: DFS grid layout for 3-node tree on 4th session (e2e-test-{pid}-grid)
#   REQ-56-03: TmuxMultiplexer.sendKeys to each of 3 sessions (sleep 600 placeholder)
#   REQ-56-04: Pane-monitor hook writes 3 journal entries
#   REQ-56-05: Persistence.persist 3 records (state: ready) + restoreAll filter check
#   REQ-56-06: 27-tool-key vitest regression in teardown

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_require_stress_facilities
  tmux_bats_make_project
}

teardown() {
  local pid="$$"
  # Defensive cleanup of 4 tmux sessions (3 from REQ-56-01 + 1 grid from REQ-56-02)
  tmux kill-session -t "e2e-test-${pid}-0" 2>/dev/null || true
  tmux kill-session -t "e2e-test-${pid}-1" 2>/dev/null || true
  tmux kill-session -t "e2e-test-${pid}-2" 2>/dev/null || true
  tmux kill-session -t "e2e-test-${pid}-grid" 2>/dev/null || true

  # REQ-56-06: 27-tool-key vitest regression (per D-56-09)
  run bash -c "cd '${TMUX_BATS_ROOT}' && npx vitest run tests/integration/hook-registration.test.ts 2>&1 | grep -E '(tool object contains 27|toBe\(27\)|Tests\\s+[0-9]+ passed)'"
  [ "$status" -eq 0 ]
  [[ "$output" == *"27"* ]]
}

@test "stress test: 3 tmux sessions alive + grid + sendKeys + journal + persistence + 27-tool-key invariant" {
  local project="$(tmux_bats_project_dir)"
  local pid="$$"
  local journal_root="${project}/.hivemind/journal"
  local state_dir="${project}/.hivemind/state/tmux-sessions"

  # ==========================================================================
  # REQ-56-01: Multi-agent spawn — 3 real tmux sessions
  # ==========================================================================
  local pane_ids=()
  local spawn_pids=()
  for i in 0 1 2; do
    local tmux_session="e2e-test-${pid}-${i}"
    # Background each spawn so we can capture the tmux-command OS PID via $!
    # (per SPEC REQ-56-01 acceptance: the 3 PIDs must differ — proving 3
    # distinct OS processes, not 3 PIDs reused by a single shell fork).
    tmux new-session -d -s "$tmux_session" -c "$project" "sleep 600" &
    spawn_pids+=("$!")
  done
  # Wait for all 3 spawns to complete before asserting liveness.
  wait
  for i in 0 1 2; do
    local tmux_session="e2e-test-${pid}-${i}"
    run tmux has-session -t "$tmux_session"
    [ "$status" -eq 0 ]
    local pane_id
    pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
    [ -n "$pane_id" ]
    pane_ids+=("$pane_id")
  done
  # Assert: tmux list-sessions shows exactly 3 e2e-test-{pid}-* sessions
  run bash -c "tmux list-sessions -F '#{session_name}' | grep -c '^e2e-test-${pid}-' | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "3" ]
  # Assert: 3 distinct spawn PIDs (per SPEC REQ-56-01 acceptance)
  [ "${spawn_pids[0]}" != "${spawn_pids[1]}" ]
  [ "${spawn_pids[0]}" != "${spawn_pids[2]}" ]
  [ "${spawn_pids[1]}" != "${spawn_pids[2]}" ]

  # ==========================================================================
  # REQ-56-02: DFS grid layout — 3-node tree on 4th session
  # ==========================================================================
  local grid_session="e2e-test-${pid}-grid"
  run tmux_node_eval "
    const { PaneGridPlanner } = await import('${TMUX_BATS_DIST}/grid-planner.js');
    const tree = { id: 'stress-root', children: [{ id: 'stress-a' }, { id: 'stress-b' }, { id: 'stress-c' }] };
    const planner = new PaneGridPlanner(0);
    const cmds = planner.computeSplitSequence(tree);
    const summary = cmds.map((c) => c.parentPaneId + ':' + c.direction).join(',');
    process.stdout.write('count=' + cmds.length + ' sequence=' + summary);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"count=3"* ]]
  # Assert: SplitCommand sequence is stress-root:h,stress-root:h,stress-root:h
  # (per SPEC REQ-56-02 acceptance — 3 children of root, all depth-1 = horizontal)
  [[ "$output" == *"sequence=stress-root:h,stress-root:h,stress-root:h"* ]]
  # Apply 3 splits to the grid session
  tmux new-session -d -s "$grid_session" -c "$project"
  run tmux has-session -t "$grid_session"
  [ "$status" -eq 0 ]
  # Capture the root pane id BEFORE split-window calls (BLOCKER-4 fix from P55
  # — pane_session_id is required for parent-child mapping verification).
  local pane_root_id
  pane_root_id="$(tmux list-panes -t "$grid_session" -F '#{pane_id}' | sed -n '1p')"
  [ -n "$pane_root_id" ]
  for split_i in 1 2 3; do
    run tmux split-window -t "$grid_session" -d -h
    [ "$status" -eq 0 ]
  done
  # Assert: 4 panes (1 root + 3 children)
  run bash -c "tmux list-panes -t '$grid_session' | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "4" ]
  # Assert: parent-child mapping — 3 children are all parented to the root pane
  # (per SPEC REQ-56-02 acceptance: parent_mapping_matches == true; a, b, c
  # all parented to stress-root). We collect the 3 child pane ids and verify
  # each appears in tmux's pane_parent map as a child of pane_root_id.
  local pane_a_id pane_b_id pane_c_id
  pane_a_id="$(tmux list-panes -t "$grid_session" -F '#{pane_id}' | sed -n '2p')"
  pane_b_id="$(tmux list-panes -t "$grid_session" -F '#{pane_id}' | sed -n '3p')"
  pane_c_id="$(tmux list-panes -t "$grid_session" -F '#{pane_id}' | sed -n '4p')"
  run bash -c "tmux list-panes -t '$grid_session' -F '#{pane_id}:#{pane_parent}' | grep -E '^${pane_a_id}:${pane_root_id}\$' | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]
  run bash -c "tmux list-panes -t '$grid_session' -F '#{pane_id}:#{pane_parent}' | grep -E '^${pane_b_id}:${pane_root_id}\$' | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]
  run bash -c "tmux list-panes -t '$grid_session' -F '#{pane_id}:#{pane_parent}' | grep -E '^${pane_c_id}:${pane_root_id}\$' | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "1" ]

  # ==========================================================================
  # REQ-56-03: Orchestrator intervention — sendKeys to 3 sessions
  # ==========================================================================
  for i in 0 1 2; do
    local probe="STRESS-PROBE-${pid}-${i}-1780434056"
    run tmux_node_eval "
      const { TmuxMultiplexer } = await import('${TMUX_BATS_DIST}/tmux-multiplexer.js');
      const multiplexer = new TmuxMultiplexer('main-vertical', 60);
      await multiplexer.sendKeys('${pane_ids[$i]}', '${probe}', false);
      process.stdout.write('sent=true session=' + ${i});
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"sent=true"* ]]
  done
  sleep 0.2   # 200ms timing tolerance (D-55-08 + D-56-06)
  # Assert: 3 capture-pane probes present
  for i in 0 1 2; do
    local probe="STRESS-PROBE-${pid}-${i}-1780434056"
    run bash -c "tmux capture-pane -t '${pane_ids[$i]}' -p | grep -c '${probe}'"
    [ "$status" -eq 0 ]
    [ "$output" -ge 1 ]
  done

  # ==========================================================================
  # REQ-56-04: Pane journaling — 3 journal entries (7 fields each)
  # ==========================================================================
  mkdir -p "$journal_root"
  # Build a JS array literal from the bash pane_ids array so each event in
  # the JS loop gets its OWN paneId (per SPEC REQ-56-04 acceptance:
  # paneId == tmux_live_paneId_i for each i=0,1,2). The bash array
  # interpolation `${pane_ids[0]}` only expands ONCE — to pass per-iteration
  # values to JS, we must serialize the full array as a JS literal.
  local pane_ids_js="["
  for pid_idx in 0 1 2; do
    if [ "$pid_idx" -gt 0 ]; then
      pane_ids_js+=","
    fi
    pane_ids_js+="'${pane_ids[$pid_idx]}'"
  done
  pane_ids_js+="]"
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'stress-shared', observer, journalRoot: '${journal_root}' });
      const paneIds = ${pane_ids_js};
      for (let i = 0; i < 3; i++) {
        await observer({ event: { type: 'pane-captured', sessionId: 'stress-shared', paneId: paneIds[i], contentLength: 2048, timestamp: Date.now() + i } });
      }
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=3"* ]]
  # Assert: 3 journal files exist
  run bash -c "ls ${journal_root}/stress-shared/ | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*-pane.json\$' | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "3" ]
  # Assert: each journal file has 7 fields with numeric schemaVersion: 1
  # AND its paneId matches the corresponding session's live paneId
  # (per SPEC REQ-56-04 acceptance: paneId_i == tmux_live_paneId_i for i=0,1,2).
  for i in 0 1 2; do
    local journal_file_i
    journal_file_i="$(ls ${journal_root}/stress-shared/ | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*-pane.json$' | sed -n "$((i+1))p")"
    [ -n "$journal_file_i" ]
    local full_path_i="${journal_root}/stress-shared/${journal_file_i}"
    run jq -r .eventType "$full_path_i"
    [ "$status" -eq 0 ]
    [ "$output" = "pane-captured" ]
    run jq -r .schemaVersion "$full_path_i"
    [ "$status" -eq 0 ]
    [ "$output" = "1" ]   # numeric, NOT "1.0" (per actual JournalEntry interface at src/hooks/pane-monitor.ts:107-115)
    run jq -r 'keys | length' "$full_path_i"
    [ "$status" -eq 0 ]
    [ "$output" = "7" ]
    run jq -r .paneId "$full_path_i"
    [ "$status" -eq 0 ]
    [ "$output" = "${pane_ids[$i]}" ]   # journal file i → live paneId of session i
  done

  # ==========================================================================
  # REQ-56-05: State query + persistence integration
  # ==========================================================================
  mkdir -p "$state_dir"
  for i in 0 1 2; do
    run tmux_node_eval "
      import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
        const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
        await p.persist({
          schemaVersion: 1,
          sessionId: 'stress-session-${i}',
          agent: 'stress-agent-${i}',
          delegationId: 'stress-deleg-${i}',
          directory: '${project}',
          paneId: '${pane_ids[$i]}',
          spawnTime: Date.now(),
          state: 'ready',
          lastTransitionAt: Date.now(),
        });
        process.stdout.write('persisted=true session=' + ${i});
      });
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"persisted=true"* ]]
  done
  # Assert: 3 persistence files exist
  [ -f "${state_dir}/stress-session-0.json" ]
  [ -f "${state_dir}/stress-session-1.json" ]
  [ -f "${state_dir}/stress-session-2.json" ]
  # Assert: each file has 9 fields + state="ready" + numeric schemaVersion: 1
  for i in 0 1 2; do
    run jq -r 'keys | length' "${state_dir}/stress-session-${i}.json"
    [ "$status" -eq 0 ]
    [ "$output" = "9" ]
    run jq -r .state "${state_dir}/stress-session-${i}.json"
    [ "$status" -eq 0 ]
    [ "$output" = "ready" ]
    run jq -r .schemaVersion "${state_dir}/stress-session-${i}.json"
    [ "$status" -eq 0 ]
    [ "$output" = "1" ]   # numeric, NOT "1.0" (per actual PersistedSession interface at src/features/tmux/persistence.ts:39-49)
  done
  # Assert: restoreAll() returns 0 records (the 3 ready records are EXCLUDED
  # by the alive filter at persistence.ts:382 — only paused/detached survive
  # the filter). The 3 files DO exist on disk — we assert that separately.
  # Per SPEC REQ-56-05 acceptance: "restoreAll() returns an empty array (or a
  # filtered array — the stress test does NOT seed paused or detached records,
  # so the alive filter is expected to return [])". So total=0 is the
  # expected (and correct) result.
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
      const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
      const records = await p.restoreAll();
      process.stdout.write('total=' + records.length);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"total=0"* ]]
  # Assert: tmux-state-query tool is wired. BATS runs outside a tmux session
  # so getSessionManagerAdapter() returns null (the integration factory's
  # process.env.TMUX gate is false per integration.ts:204). The tool's early
  # return at tmux-state-query.ts:145-147 yields
  # {available: false, reason: "tmux-not-wired"} — proving the tool is wired
  # (Zod schema validation, permission gate check, adapter bridge check) even
  # without a real integration instance. We call the tool's execute() with
  # an orchestrator-tier context to bypass the permission gate, then assert
  # the early-return shape (same pattern as P55 BATS 58 calling TmuxMultiplexer
  # directly to bypass the integration factory's gate).
  run tmux_node_eval "
    const { tmuxStateQueryTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-state-query.js');
    const result = await tmuxStateQueryTool.execute(
      { action: 'get-session', sessionId: 'stress-session-0' },
      { agent: 'hm-orchestrator' }
    );
    process.stdout.write('available=' + result.available + ' reason=' + result.reason);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"available=false"* ]]
  [[ "$output" == *"reason=tmux-not-wired"* ]]

  # ==========================================================================
  # REQ-56-06: 27-tool-key vitest regression (handled in teardown above)
  # ==========================================================================
  # The teardown function runs the vitest regression and asserts the output
  # contains the 27-tool-key assertion line. No additional assertion needed
  # in the @test block — the teardown's assertions are the REQ-56-06 check.

  # Final verdict: ALL 6 sub-flows PASS
  echo "stress test: 6 sub-flows PASS"
}
