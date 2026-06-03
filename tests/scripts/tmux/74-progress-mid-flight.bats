#!/usr/bin/env bats
#
# 74-progress-mid-flight.bats — Phase 58.8 (P58 gap-fix) REQ-58-10 acceptance:
# delegation-status {action: "progress", delegationId} returns live counters
# (actionCount, messageCount, toolCallCount) and the latest event from an
# in-memory bus. The capturedAt is fresh.
#
# Slot 74. RED-FIRST (P58.8): this test intentionally fails with
# `not ok 1 — progress action returned error: action "progress" not found`
# because the `progress` action is not in the delegation-status Zod union
# and the in-memory bus (childEventStream) does not exist yet. The test
# flips to GREEN once:
#   1. delegation-status Zod union is extended with `action: "progress"`.
#   2. child-event-stream.ts module exports `childEventStream` (singleton
#      with subscribe/unsubscribe/getLastEvent/getCounters).
#   3. The progress action handler reads counters + lastEvent from the
#      in-memory bus.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  :  # nothing to clean
}

@test "delegation-status progress returns counters and lastEvent (S4, slot 74 — P58.8)" {
  cd "${TMUX_BATS_ROOT}"

  # Step 1: confirm the child-event-stream module exists. RED: the module
  # does not exist yet, so the import in the progress action handler
  # cannot resolve.
  if [[ ! -f "src/features/session-tracker/streaming/child-event-stream.ts" ]]; then
    echo "RED-EXPECTED-FAIL: child-event-stream.ts does not exist yet (S4, REQ-58-10)."
    return 1
  fi

  # Step 2: confirm the delegation-status Zod union has the 'progress' action.
  # RED: the union is currently z.enum(['status','get','list','control','find-stackable','pool'])
  local action_enum
  action_enum="$(awk '/action:/ && /z\.enum/' src/tools/delegation/delegation-status.ts | head -1)"
  if [[ "$action_enum" != *"progress"* ]]; then
    echo "RED-EXPECTED-FAIL: delegation-status Zod enum does not include 'progress'; current: $action_enum"
    return 1
  fi

  # Step 3: invoke the progress action and assert counters + lastEvent are present.
  # The mock manager returns a stub delegation; the in-memory bus is empty
  # (no events yet), so lastEvent is null but counters are zeroed (still
  # a well-formed response).
  run tmux_node_eval "
    const { createDelegationStatusTool } = await import('${TMUX_BATS_ROOT}/dist/tools/delegation/delegation-status.js');
    const tool = createDelegationStatusTool({
      getAllDelegations: () => [],
      getStatus: (id) => ({
        id, childSessionId: 'ses-child-74', parentSessionId: 'ses-parent-74',
        agent: 'hm-l2-researcher', status: 'running', createdAt: Date.now(),
        lastMessageCount: 0, stablePollCount: 0, lastMessageCountChangeAt: Date.now(),
        nestingDepth: 1, executionMode: 'sdk', workingDirectory: process.cwd(),
        queueKey: 'q74', actionCount: 0, messageCount: 0, toolCallCount: 0,
      }),
      canSessionAccessDelegation: () => true,
    });
    const result = await tool.execute(
      { action: 'progress', delegationId: 'dt-74' },
      { sessionID: 'ses-parent-74' }
    );
    process.stdout.write('result=' + result);
  "
  [ "$status" -eq 0 ]
  if [[ "$output" == *"Invalid delegation-status input"* ]]; then
    echo "RED-EXPECTED-FAIL: delegation-status rejected 'progress' action; output:"
    echo "$output"
    return 1
  fi
  # GREEN: result includes actionCount, messageCount, toolCallCount, lastEvent, capturedAt.
  [[ "$output" == *"actionCount"* ]]
  [[ "$output" == *"messageCount"* ]]
  [[ "$output" == *"toolCallCount"* ]]
  [[ "$output" == *"capturedAt"* ]]
}
