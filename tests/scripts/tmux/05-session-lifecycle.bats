#!/usr/bin/env bats
#
# 05-session-lifecycle.bats — Round-trip persistence for session lifecycle.
#
# Tests persistPort ↔ readOrMigratePort round-trip semantics. The MCP
# server's PTY session must be able to write a port on startup, and the
# downstream pane-grid layout must read the same port back. This is the
# D-04 graceful-degradation anchor: even when tmux is unavailable, the
# port file lifecycle is exercised by the read-side alone, so the
# factory's null path is fully covered.

load "helpers"

setup() {
  tmux_bats_require_dist
}

@test "persistPort and readOrMigratePort are inverses" {
  project="$(tmux_bats_make_project)"
  port=47117
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', ${port});
    const back = await m.readOrMigratePort('${project}');
    process.stdout.write(String(back));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == "${port}" ]]
}

@test "persistPort updates an existing port (lifecycle update)" {
  project="$(tmux_bats_make_project)"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', 10001);
    const v1 = await m.readOrMigratePort('${project}');
    await m.persistPort('${project}', 20002);
    const v2 = await m.readOrMigratePort('${project}');
    process.stdout.write(String(v1) + '->' + String(v2));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == "10001->20002" ]]
}

@test "readOrMigratePort handles absolute paths with spaces" {
  # Edge case: project directory name with embedded spaces (e.g.,
  # "My Project" on macOS). The hash must work regardless of path
  # whitespace — the port determinism invariant must hold.
  project="${BATS_TEST_TMPDIR}/project with spaces"
  mkdir -p "${project}"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const a = await m.readOrMigratePort('${project}');
    const b = await m.readOrMigratePort('${project}');
    process.stdout.write(a === b ? 'STABLE:' + a : 'UNSTABLE');
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"STABLE:"* ]]
}

@test "persistPort handles paths with spaces in project directory" {
  project="${BATS_TEST_TMPDIR}/spaced project"
  mkdir -p "${project}"
  port=32987
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    await m.persistPort('${project}', ${port});
    const back = await m.readOrMigratePort('${project}');
    process.stdout.write(String(back));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == "${port}" ]]
  [ -f "${project}/.hivemind/state/tmux-port.json" ]
}
