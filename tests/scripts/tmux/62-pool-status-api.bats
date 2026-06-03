#!/usr/bin/env bats
#
# 62-pool-status-api.bats — Phase 58 REQ-58-02 acceptance:
# DelegationManager.getPoolSnapshot() returns a frozen DelegationPool with
# 3 fake delegations, schemaVersion=1, promptPreview sanitized to <= 200
# chars single-line. JSON round-trip via JSON.stringify + JSON.parse proves
# the shape survives SSE-pool serialization.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p58-pool-$$" 2>/dev/null || true
}

@test "getPoolSnapshot returns frozen DelegationPool with 3 entries (G2)" {
  local project="$(tmux_bats_project_dir)"

  # Step 1: insert 3 fake delegations via the __getDelegationsForTesting test seam
  # then call getPoolSnapshot() and assert all 8 invariants
  run tmux_node_eval "
    const mgr = await import('${TMUX_BATS_ROOT}/dist/coordination/delegation/manager.js');
    const { freezeDelegationPool, sanitizePreview } = await import('${TMUX_BATS_ROOT}/dist/coordination/delegation/pool-types.js');
    // Construct a minimal DelegationManager via the v2 coordinator seam
    const Manager = mgr.DelegationManager;
    const instance = new Manager();
    const map = instance.__getDelegationsForTesting;
    map.set('dt-1', { id: 'dt-1', agent: 'hm-l2-researcher', parentSessionId: 'root', childSessionId: 'ses_1', nestingDepth: 1, createdAt: Date.now(), status: 'running', prompt: 'Investigate the auth flow in module X.' });
    map.set('dt-2', { id: 'dt-2', agent: 'hm-l2-coder', parentSessionId: 'root', childSessionId: 'ses_2', nestingDepth: 1, createdAt: Date.now(), status: 'completed', prompt: 'Fix the bug with newline' });
    map.set('dt-3', { id: 'dt-3', agent: 'hm-l2-tester', parentSessionId: null, childSessionId: 'ses_3', nestingDepth: 1, createdAt: Date.now(), status: 'aborted', prompt: 'A'.repeat(300) });
    const snapshot = instance.getPoolSnapshot();
    // Assert 1: schemaVersion === 1 (numeric)
    const assert1 = snapshot.schemaVersion === 1;
    // Assert 2: 3 entries
    const assert2 = snapshot.delegations.length === 3;
    // Assert 3: each id is a string
    const assert3 = snapshot.delegations.every(d => typeof d.id === 'string' && d.id.length > 0);
    // Assert 4: each promptPreview is <= 200 chars (note: ellipsized may be 201)
    const assert4 = snapshot.delegations.every(d => d.promptPreview.length <= 201);
    // Assert 5: no \n in any promptPreview
    const assert5 = snapshot.delegations.every(d => !d.promptPreview.includes('\n'));
    // Assert 6: Object.isFrozen(snapshot) is true
    const assert6 = Object.isFrozen(snapshot);
    // Assert 7: Object.isFrozen(snapshot.delegations[0]) is true
    const assert7 = Object.isFrozen(snapshot.delegations[0]);
    // Assert 8: JSON round-trip succeeds
    const roundtrip = JSON.parse(JSON.stringify(snapshot));
    const assert8 = roundtrip.schemaVersion === 1 && roundtrip.delegations.length === 3;
    process.stdout.write('a1=' + assert1 + ' a2=' + assert2 + ' a3=' + assert3 + ' a4=' + assert4 + ' a5=' + assert5 + ' a6=' + assert6 + ' a7=' + assert7 + ' a8=' + assert8);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"a1=true"* ]]
  [[ "$output" == *"a2=true"* ]]
  [[ "$output" == *"a3=true"* ]]
  [[ "$output" == *"a4=true"* ]]
  [[ "$output" == *"a5=true"* ]]
  [[ "$output" == *"a6=true"* ]]
  [[ "$output" == *"a7=true"* ]]
  [[ "$output" == *"a8=true"* ]]
}
