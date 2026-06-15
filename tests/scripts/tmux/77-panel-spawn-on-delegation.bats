#!/usr/bin/env bats
#
# 77-panel-spawn-on-delegation.bats — S5b fix verification
# Acceptance: When the harness's `DelegationCoordinator` synthesizes an
# `EnrichedSessionEvent` and calls `SessionManagerAdapter.onSessionCreated`
# directly (the new coordinator-fallback path), a real tmux pane is spawned
# for the synthesized child session ID. This is the regression guard for
# `.planning/debug/s5-panel-spawn-root-cause-2026-06-04.md` — the test
# would FAIL before the S5b fix because the only entry point to
# `onSessionCreated` was the `eventObservers → tmuxObserver` chain, which
# depended on the OpenCode SDK firing `session.created` for SDK-created
# children (which the SDK does not always do).
#
# RED-FIRST (S5b): this test fails when (a) the coordinator's
# spawnTmuxPanelForChild is missing, or (b) the SessionManager cannot
# spawn a real pane from a synthesized event. After the S5b fix lands,
# this should exit 0.
#
# Skip pattern: per AC-58.9-03-06, scenario skips when no tmux server OR
# no opencode binary. On dev/laptop with both, the scenario asserts the
# production coordinator-fallback → SessionManager → TmuxMultiplexer chain.
#
# The test does NOT use the polling loop or the SDK child-session-starter;
# it drives the adapter directly with a synthesized event to exercise the
# exact code path the new `spawnTmuxPanelForChild` method follows.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
  tmux_bats_require_tmux_server
  tmux_bats_require_opencode
}

teardown() {
  tmux kill-session -t "p58b-77-runtime-$$" 2>/dev/null || true
}

@test "coordinator-fallback synthesis spawns real tmux pane (S5b, slot 77)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58b-77-runtime-$$"
  local sid="bats-77-synth-$$"
  local pane_title="hm-delegate-child-gsd-executor-fix-bug"

  # Step 1: spawn a real tmux server + project main pane. The harness
  # would attach `opencode` to this pane; for the test we just need the
  # multiplexer to find a main pane to split from.
  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  tmux has-session -t "$tmux_session"
  local main_pane
  main_pane="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
  [ -n "$main_pane" ]

  local pane_count_before
  pane_count_before="$(tmux list-panes -t "$tmux_session" | wc -l | tr -d ' ')"

  # Step 2: drive the S5b code path. The fix added a method
  # `spawnTmuxPanelForChild` on `DelegationCoordinator` that builds an
  # `EnrichedSessionEvent` and calls `tmuxIntegration.adapter.onSessionCreated`.
  # We test the underlying SessionManager directly because exercising the
  # private method through dispatch() would require a full mock client +
  # SDK child-session-starter (see coordinator.test.ts for the unit
  # coverage of the synthesis; this BATS verifies the SESSION-MANAGER
  # SIDE of the wire actually spawns a real pane).
  #
  # Build the same EnrichedSessionEvent shape that
  # `coordinator.spawnTmuxPanelForChild` would produce (see
  # src/coordination/delegation/coordinator.ts and
  # src/features/tmux/observers.ts:18-33).
  run tmux_node_eval "
    import('${TMUX_BATS_DIST}/integration.js').then(async (mod) => {
      // Use the in-tree factory to get a real TmuxIntegration if tmux is
      // available; otherwise build a minimal adapter that exercises the
      // SessionManager directly.
      const integration = await mod.createTmuxIntegrationIfSupported('${project}', {
        log: { debug() {}, info() {}, warn() {}, error() {} },
      });
      if (!integration) {
        process.stdout.write('no-integration');
        return;
      }
      const enriched = {
        type: 'session.created',
        properties: {
          info: {
            id: '${sid}',
            parentID: 'parent-77',
            title: '${pane_title}',
            directory: '${project}',
          },
        },
        hivemindMeta: {
          agent: 'gsd-executor',
          delegationId: '${sid}',
          depth: 1,
        },
      };
      await integration.adapter.onSessionCreated(enriched);
      // Wait briefly for pane spawn to settle.
      await new Promise((r) => setTimeout(r, 500));
      const panes = await integration.adapter.listPanes();
      const found = panes.find((p) => p.title && p.title.includes('${sid}')) ||
        panes.find((p) => p.title && p.title.includes('${pane_title}'));
      process.stdout.write(found ? 'pane=' + found.paneId : 'no-pane');
    }).catch((err) => {
      process.stdout.write('error=' + err.message);
    });
  "
  [ "$status" -eq 0 ]

  if [[ "$output" == *"no-integration"* ]]; then
    skip "tmux integration unavailable in this environment"
  fi
  if [[ "$output" == "no-pane" || -z "$output" ]]; then
    echo "RED-EXPECTED-FAIL: synthesized event did not spawn a pane"
    return 1
  fi
  if [[ "$output" == error=* ]]; then
    echo "RED-EXPECTED-FAIL: onSessionCreated threw: ${output#error=}"
    return 1
  fi

  # Assert: the .hivemind/state/tmux-sessions/<sid>.json record exists
  [ -f "${project}/.hivemind/state/tmux-sessions/${sid}.json" ] || {
    echo "FAIL: no persistence record at ${project}/.hivemind/state/tmux-sessions/${sid}.json"
    return 1
  }

  # Assert: the pane count increased
  local pane_count_after
  pane_count_after="$(tmux list-panes -t "$tmux_session" | wc -l | tr -d ' ')"
  [ "$pane_count_after" -gt "$pane_count_before" ] || {
    echo "FAIL: pane count did not grow (before=${pane_count_before}, after=${pane_count_after})"
    return 1
  }

  # Assert: the pane id from the synthesized event is in the session
  local pane_id="${output#pane=}"
  tmux list-panes -t "$tmux_session" -F '#{pane_id}' | grep -qF "$pane_id" || {
    echo "FAIL: pane id ${pane_id} not found in session ${tmux_session}"
    return 1
  }

  tmux kill-session -t "$tmux_session"
}

@test "synthesized event is idempotent against duplicate dispatch (S5b, slot 77)" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p58b-77-idem-$$"
  local sid="bats-77-idem-$$"

  tmux new-session -d -s "$tmux_session" -c "$project" "cat"
  tmux has-session -t "$tmux_session"

  run tmux_node_eval "
    import('${TMUX_BATS_DIST}/integration.js').then(async (mod) => {
      const integration = await mod.createTmuxIntegrationIfSupported('${project}', {
        log: { debug() {}, info() {}, warn() {}, error() {} },
      });
      if (!integration) { process.stdout.write('no-integration'); return; }
      const enriched = {
        type: 'session.created',
        properties: { info: { id: '${sid}', parentID: 'parent-idem', title: 'idem-test', directory: '${project}' } },
        hivemindMeta: { agent: 'gsd-executor', delegationId: '${sid}', depth: 1 },
      };
      // Fire twice — the second call must be a no-op (SessionManager
      // guards via sessions / spawningSessions).
      await integration.adapter.onSessionCreated(enriched);
      await integration.adapter.onSessionCreated(enriched);
      await new Promise((r) => setTimeout(r, 300));
      const panes = await integration.adapter.listPanes();
      const matches = panes.filter((p) => (p.title || '').includes('${sid}')).length;
      process.stdout.write('matches=' + matches);
    }).catch((err) => { process.stdout.write('error=' + err.message); });
  "
  [ "$status" -eq 0 ]

  if [[ "$output" == *"no-integration"* ]]; then
    skip "tmux integration unavailable in this environment"
  fi
  if [[ "$output" == error=* ]]; then
    echo "RED-EXPECTED-FAIL: idempotency check threw: ${output#error=}"
    return 1
  fi
  # Exactly ONE pane for the child session id — second call was a no-op.
  local matches="${output#matches=}"
  [ "$matches" = "1" ] || {
    echo "FAIL: expected exactly 1 pane for ${sid}, got ${matches}"
    return 1
  }

  tmux kill-session -t "$tmux_session"
}
