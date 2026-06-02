#!/usr/bin/env bats
#
# 02-snapshot-and-capture.bats — Server URL detection and tmux version capture.
#
# Tests detectServerUrl() and getTmuxVersion() — the two "snapshot" functions
# that capture environment state (port file + tmux binary version) and turn
# it into a usable runtime configuration.

load "helpers"

setup() {
  tmux_bats_require_dist
}

@test "getTmuxVersion returns null for a non-existent tmux path" {
  # When the tmux binary path is bogus, getTmuxVersion must return null
  # (silent fallback) rather than throw. This protects the factory from
  # surfacing exec errors to the user.
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    try {
      const result = await m.getTmuxVersion('/nonexistent/tmux-binary-xyz');
      process.stdout.write(result === null ? 'NULL' : 'GOT:' + result);
    } catch (e) {
      process.stdout.write('THREW:' + e.message);
    }
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"NULL"* ]]
}

@test "getTmuxVersion returns a string when given a real binary" {
  # /bin/echo accepts --version and prints to stdout — substitute for tmux
  # to verify the function plumbing works end-to-end without needing tmux
  # installed.
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    try {
      const result = await m.getTmuxVersion('/bin/echo');
      process.stdout.write(result === null ? 'NULL' : 'GOT:' + result);
    } catch (e) {
      process.stdout.write('THREW:' + e.message);
    }
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"GOT:"* ]]
}

@test "detectServerUrl returns a localhost URL for a fresh project" {
  # No persisted port file → deterministic hash fallback → URL.
  project="$(tmux_bats_make_project)"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.detectServerUrl('${project}');
    process.stdout.write(result ?? 'NULL');
  "
  [ "$status" -eq 0 ]
  [[ "$output" == http://localhost:* ]]
}

@test "detectServerUrl honors a persisted port file" {
  # Persist a known port, then verify detectServerUrl surfaces it.
  project="$(tmux_bats_make_project)"
  port=42424
  mkdir -p "${project}/.hivemind/state"
  printf '{"port":%d,"updatedAt":0}\n' "${port}" > "${project}/.hivemind/state/tmux-port.json"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.detectServerUrl('${project}');
    process.stdout.write(result ?? 'NULL');
  "
  [ "$status" -eq 0 ]
  [[ "$output" == "http://localhost:${port}" ]]
}

@test "detectServerUrl returns null when persisted file is malformed" {
  # A corrupt port file (invalid JSON) must surface as a null return so
  # the caller can decide whether to fall back to a fresh hash or surface
  # the error to the user.
  project="$(tmux_bats_make_project)"
  mkdir -p "${project}/.hivemind/state"
  printf 'not-valid-json{' > "${project}/.hivemind/state/tmux-port.json"
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.detectServerUrl('${project}');
    process.stdout.write(result === null ? 'NULL' : 'GOT:' + result);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"NULL"* ]]
}
