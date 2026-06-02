#!/usr/bin/env bats
#
# 04-grid-layout.bats — Port read/migration invariants for grid layouts.
#
# Tests readOrMigratePort() — the read side. When no persisted port file
# exists, the function must fall back to a deterministic hash of the
# project directory so the same project always gets the same port
# (birthday-collision invariant per D-06: ~236 projects before first
# collision across 55,535 distinct ports).

load "helpers"

setup() {
  tmux_bats_require_dist
}

@test "readOrMigratePort returns a port in 10000..65535 for a fresh project" {
  project="$(tmux_bats_make_project)"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.readOrMigratePort('${project}');
    process.stdout.write(String(result));
  "
  [ "$status" -eq 0 ]
  port="${output}"
  # Must be numeric and within the 10000..65535 range.
  [[ "$port" =~ ^[0-9]+$ ]]
  [ "$port" -ge 10000 ]
  [ "$port" -le 65535 ]
}

@test "readOrMigratePort is deterministic for the same project directory" {
  project="$(tmux_bats_make_project)"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const a = await m.readOrMigratePort('${project}');
    const b = await m.readOrMigratePort('${project}');
    process.stdout.write(a === b ? 'SAME' : 'DIFF');
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"SAME"* ]]
}

@test "readOrMigratePort gives different ports for different projects" {
  projectA="$(tmux_bats_make_project)"
  projectB="${BATS_TEST_TMPDIR}/project-other-$$"
  mkdir -p "${projectB}"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const a = await m.readOrMigratePort('${projectA}');
    const b = await m.readOrMigratePort('${projectB}');
    process.stdout.write(String(a) + ':' + String(b));
  "
  [ "$status" -eq 0 ]
  # Format is "A:B"; assert A != B.
  portA="${output%:*}"
  portB="${output#*:}"
  [ "$portA" != "$portB" ]
}

@test "readOrMigratePort surfaces the persisted port verbatim" {
  project="$(tmux_bats_make_project)"
  persisted=50005
  mkdir -p "${project}/.hivemind/state"
  printf '{"port":%d,"updatedAt":0}\n' "${persisted}" > "${project}/.hivemind/state/tmux-port.json"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.readOrMigratePort('${project}');
    process.stdout.write(String(result));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == "${persisted}" ]]
}

@test "readOrMigratePort returns null for a malformed persisted file" {
  project="$(tmux_bats_make_project)"
  mkdir -p "${project}/.hivemind/state"
  printf 'not-valid-json{' > "${project}/.hivemind/state/tmux-port.json"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.readOrMigratePort('${project}');
    process.stdout.write(result === null ? 'NULL' : 'GOT:' + String(result));
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"NULL"* ]]
}
