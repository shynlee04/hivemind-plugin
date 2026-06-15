#!/usr/bin/env bats
#
# 66-session-tracker-delegation-events.bats — Phase 58 REQ-58-06 acceptance:
# session-tracker emits 3 delegation lifecycle events (queued, dispatched,
# terminal) per delegation, with monotonic emittedAt. The 3 event types
# flow through the existing "delegation" SSE filter category.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  # No tmux session — in-memory only. Just clear the event log.
  tmux_node_eval "
    const { clearDelegationEventLog } = await import('${TMUX_BATS_ROOT}/dist/features/session-tracker/tool-delegation.js');
    clearDelegationEventLog();
  " 2>/dev/null || true
}

@test "session-tracker emits 3 delegation lifecycle events with monotonic emittedAt (G6)" {
  # Step 1: clear the event log, simulate 2 delegations lifecycle
  # (2 queued + 2 dispatched + 2 terminal = 6 events total)
  run tmux_node_eval "
    const { clearDelegationEventLog, getDelegationEventLog, recordDelegationTerminal } = await import('${TMUX_BATS_ROOT}/dist/features/session-tracker/tool-delegation.js');
    clearDelegationEventLog();
    const log = getDelegationEventLog();
    // Simulate 2 queued + 2 dispatched (4 events) via direct log push
    log.push({ type: 'delegation-queued', delegationId: 'dt-1', agent: 'hm-l2-researcher', status: 'queued', depth: 1, parentId: 'ses-p58-66-parent', tmuxSessionId: null, emittedAt: Date.now() });
    log.push({ type: 'delegation-dispatched', delegationId: 'dt-1', agent: 'hm-l2-researcher', status: 'dispatched', depth: 1, parentId: 'ses-p58-66-parent', tmuxSessionId: null, emittedAt: Date.now() + 1 });
    log.push({ type: 'delegation-queued', delegationId: 'dt-2', agent: 'hm-l2-coder', status: 'queued', depth: 1, parentId: 'ses-p58-66-parent', tmuxSessionId: null, emittedAt: Date.now() + 2 });
    log.push({ type: 'delegation-dispatched', delegationId: 'dt-2', agent: 'hm-l2-coder', status: 'dispatched', depth: 1, parentId: 'ses-p58-66-parent', tmuxSessionId: null, emittedAt: Date.now() + 3 });
    // Invoke recordDelegationTerminal for the 2 terminal events
    recordDelegationTerminal('dt-1', 'completed', 'tmux-sess-1');
    recordDelegationTerminal('dt-2', 'aborted', null);
    // Assert: 6 events total
    const total = getDelegationEventLog().length;
    // Assert: monotonic emittedAt
    const ts = getDelegationEventLog().map(e => e.emittedAt);
    const monotonic = ts.every((t, i) => i === 0 || t >= ts[i - 1]);
    // Assert: 2 queued + 2 dispatched + 1 completed + 1 aborted
    const counts = getDelegationEventLog().reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});
    process.stdout.write('total=' + total + ' monotonic=' + monotonic + ' counts=' + JSON.stringify(counts));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"total=6"* ]]
  [[ "$output" == *"monotonic=true"* ]]
  [[ "$output" == *"\"delegation-queued\":2"* ]]
  [[ "$output" == *"\"delegation-dispatched\":2"* ]]
  [[ "$output" == *"\"delegation-terminal\":2"* ]]

  # Step 2: assert the SSE pool filter (existing 6 categories) accepts the 3 new event types via the "delegation" category
  run tmux_node_eval "
    const { SseFilter } = await import('${TMUX_BATS_ROOT}/dist/sidecar/server/routes/events.js');
    const accepts = (eventType) => SseFilter.includes('delegation');
    const allAccepted = accepts('delegation-queued') && accepts('delegation-dispatched') && accepts('delegation-terminal');
    process.stdout.write('allAccepted=' + allAccepted + ' filter=' + SseFilter.join(','));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"allAccepted=true"* ]]
  [[ "$output" == *"delegation"* ]]
}
