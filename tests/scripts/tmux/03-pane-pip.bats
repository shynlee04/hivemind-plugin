#!/usr/bin/env bats
#
# 03-pane-pip.bats — Port persistence for pane-pip forwarding.
#
# Tests persistPort() — the write side of the port file that lets the MCP
# server's PTY session expose a port that downstream panes can connect to.
# This is the "pane-pip" handoff: write a port, then another process reads
# it back. The round-trip must preserve the value exactly.

load "helpers"

setup() {
  tmux_bats_require_dist
}

@test "persistPort writes a JSON file with the given port" {
  project="$(tmux_bats_make_project)"
  port=37891
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', ${port});
    process.stdout.write('OK');
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"OK"* ]]
  # File must exist and contain the port value verbatim (allow optional
  # whitespace after the colon — JSON.stringify emits `"port": N` not
  # `"port":N`).
  [ -f "${project}/.hivemind/state/tmux-port.json" ]
  grep -Eq "\"port\":[[:space:]]*${port}" "${project}/.hivemind/state/tmux-port.json"
}

@test "persistPort creates .hivemind/state/ directory if missing" {
  project="$(tmux_bats_make_project)"
  [ ! -d "${project}/.hivemind/state" ]
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', 40001);
    process.stdout.write('OK');
  "
  [ "$status" -eq 0 ]
  [ -d "${project}/.hivemind/state" ]
}

@test "persistPort overwrites a previous port value" {
  project="$(tmux_bats_make_project)"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', 10001);
    await m.persistPort('${project}', 20002);
    process.stdout.write('OK');
  "
  [ "$status" -eq 0 ]
  # JSON.stringify emits `"port": N` with a space; allow optional whitespace.
  grep -Eq "\"port\":[[:space:]]*20002" "${project}/.hivemind/state/tmux-port.json"
  ! grep -Eq "\"port\":[[:space:]]*10001" "${project}/.hivemind/state/tmux-port.json"
}

@test "persistPort records a numeric updatedAt timestamp" {
  project="$(tmux_bats_make_project)"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', 11111);
    process.stdout.write('OK');
  "
  [ "$status" -eq 0 ]
  # updatedAt must be a non-empty numeric field (allow optional whitespace
  # after the colon — JSON.stringify emits `"updatedAt": N`).
  grep -Eq '"updatedAt":[[:space:]]*[0-9]+' "${project}/.hivemind/state/tmux-port.json"
}
