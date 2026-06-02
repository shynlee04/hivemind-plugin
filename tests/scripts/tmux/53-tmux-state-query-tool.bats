#!/usr/bin/env bats
#
# 53-tmux-state-query-tool.bats — Phase 52 REQ-52-02 acceptance: the
# `tmux-state-query` read-only tool file exists, exports a 3-action
# discriminated union, and returns the graceful `{available: false,
# reason: "tmux-not-wired"}` fallback when the in-tree integration is
# not wired.

load "helpers"

setup() {
  tmux_bats_require_dist
}

# REQ-52-02 acceptance: the tool source file exists and has the canonical
# tmux-state-query tool name constant.
@test "src/tools/tmux-state-query.ts exists" {
  [ -f "src/tools/tmux-state-query.ts" ]
}

# REQ-52-02 acceptance: the tool exports a tmuxStateQueryToolName constant
# equal to "tmux-state-query" (the registered tool key in plugin.ts).
@test "tmuxStateQueryToolName constant equals 'tmux-state-query'" {
  run grep -nE "export const tmuxStateQueryToolName" src/tools/tmux-state-query.ts
  [ "$status" -eq 0 ]
  [[ "$output" == *"\"tmux-state-query\""* ]]
}

# REQ-52-02 acceptance: the tool exports a tmuxStateQueryTool variable
# (the actual tool() registration object).
@test "tmuxStateQueryTool is exported from src/tools/tmux-state-query.ts" {
  run grep -nE "^export const tmuxStateQueryTool" src/tools/tmux-state-query.ts
  [ "$status" -eq 0 ]
}

# REQ-52-02 acceptance: when called at runtime with no adapter wired, the
# tool returns { available: false, reason: "tmux-not-wired" } (graceful
# degradation contract — no throw).
@test "tmux-state-query returns { available: false, reason: tmux-not-wired } when adapter is null" {
  # Ensure no adapter is wired (import the bridge and reset it).
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/types.js');
    m.setSessionManagerAdapter(null);
    const q = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-state-query.js');
    // Invoke with the default list-sessions action; renderToolResult wraps the JSON.
    const out = await q.tmuxStateQueryTool.execute(
      { action: 'list-sessions' },
      { sessionID: 'sess-bats', agent: 'hm-orchestrator' }
    );
    process.stdout.write(typeof out === 'string' ? out : JSON.stringify(out));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"available"* ]]
  [[ "$output" == *"tmux-not-wired"* ]]
}
