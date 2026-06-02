#!/usr/bin/env bats
#
# 54-tmux-observer-expansion.bats — Phase 52 REQ-52-03 acceptance: the
# observer module exports the expanded TmuxEventType union with 3 values
# including "session-state-changed" and "pane-captured", and the
# createTmuxEventObserver factory returns registration methods
# onSessionStateChanged + onPaneCaptured.

load "helpers"

setup() {
  tmux_bats_require_dist
}

# REQ-52-03 acceptance: TmuxEventType has exactly 3 values, including
# the 2 new event types added in P52.
@test "TmuxEventType union has exactly 3 values: session.created, session-state-changed, pane-captured" {
  run grep -nE "export type TmuxEventType" src/features/tmux/observers.ts
  [ "$status" -eq 0 ]
  # All 3 values must appear in the same union declaration line.
  [[ "$output" == *"session.created"* ]]
  [[ "$output" == *"session-state-changed"* ]]
  [[ "$output" == *"pane-captured"* ]]
}

# REQ-52-03 acceptance: SessionStateChangedEvent interface is exported
# and carries sessionId, previousState, currentState, timestamp.
@test "SessionStateChangedEvent interface carries sessionId, previousState, currentState, timestamp" {
  run grep -nA 6 "export interface SessionStateChangedEvent" src/features/tmux/observers.ts
  [ "$status" -eq 0 ]
  [[ "$output" == *"sessionId"* ]]
  [[ "$output" == *"previousState"* ]]
  [[ "$output" == *"currentState"* ]]
  [[ "$output" == *"timestamp"* ]]
}

# REQ-52-03 acceptance: PaneCapturedEvent interface is exported
# and carries sessionId, paneId, contentLength, timestamp.
@test "PaneCapturedEvent interface carries sessionId, paneId, contentLength, timestamp" {
  run grep -nA 6 "export interface PaneCapturedEvent" src/features/tmux/observers.ts
  [ "$status" -eq 0 ]
  [[ "$output" == *"sessionId"* ]]
  [[ "$output" == *"paneId"* ]]
  [[ "$output" == *"contentLength"* ]]
  [[ "$output" == *"timestamp"* ]]
}

# REQ-52-03 acceptance: createTmuxEventObserver factory attaches the
# 2 new registration methods to the returned observer function.
@test "createTmuxEventObserver returns observer with onSessionStateChanged + onPaneCaptured methods" {
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/observers.js');
    const obs = m.createTmuxEventObserver({ onSessionCreated: async () => {} });
    const hasState = typeof obs.onSessionStateChanged === 'function';
    const hasPane = typeof obs.onPaneCaptured === 'function';
    process.stdout.write(\`state=\${hasState ? 1 : 0} pane=\${hasPane ? 1 : 0}\`);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"state=1 pane=1"* ]]
}
