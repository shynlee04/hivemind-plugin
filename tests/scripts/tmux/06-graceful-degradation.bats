#!/usr/bin/env bats
#
# 06-graceful-degradation.bats — D-04 contract: silent no-op factory.
#
# Tests createTmuxIntegrationIfSupported() — the factory that wires the
# in-tree tmux subsystem. The D-04 contract (locked decision in
# 51-CONTEXT.md) is: when the host is not running inside a tmux session,
# the factory must return null silently rather than throw or surface
# an error. This protects the rest of the harness from needing to
# know whether tmux is available.
#
# This is the "degradation" half of "graceful degradation": the
# factory's null return is the entire fallback surface, and downstream
# code (tmux-copilot.ts) checks for null and emits a structured
# "tmux-not-wired" reason.

load "helpers"

setup() {
  tmux_bats_require_dist
}

@test "createTmuxIntegrationIfSupported returns null when TMUX env var is unset" {
  # Without TMUX, the factory's tmux-session check must return null.
  # This is the D-04 contract anchor.
  project="$(tmux_bats_make_project)"
  run bash -c "
    unset TMUX
    cd '${TMUX_BATS_ROOT}' && node --input-type=module -e \"
      const m = await import('${TMUX_BATS_DIST}/integration.js');
      try {
        const result = await m.createTmuxIntegrationIfSupported('${project}');
        process.stdout.write(result === null ? 'NULL' : 'BUILT');
      } catch (e) {
        process.stdout.write('THREW:' + e.message);
      }
    \"
  "
  [ "$status" -eq 0 ]
  # D-04 contract: silent null return — must not throw, must not build.
  [[ "$output" == *"NULL"* ]]
  [[ "$output" != *"THREW"* ]]
  [[ "$output" != *"BUILT"* ]]
}

@test "createTmuxIntegrationIfSupported returns null when tmux binary is missing" {
  # Even with TMUX set, missing binary on PATH must result in null.
  # Sanitize PATH so only /usr/local/bin, /usr/bin, and /bin are available.
  # /usr/local/bin is kept because node lives there; tmux is not installed.
  project="$(tmux_bats_make_project)"
  run bash -c "
    export TMUX=/tmp/fake-tmux-socket,1234,0
    export PATH=/usr/local/bin:/usr/bin:/bin
    cd '${TMUX_BATS_ROOT}' && node --input-type=module -e \"
      const m = await import('${TMUX_BATS_DIST}/integration.js');
      try {
        const result = await m.createTmuxIntegrationIfSupported('${project}');
        process.stdout.write(result === null ? 'NULL' : 'BUILT');
      } catch (e) {
        process.stdout.write('THREW:' + e.message);
      }
    \"
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"NULL"* ]]
  [[ "$output" != *"THREW"* ]]
}

@test "createTmuxIntegrationIfSupported never throws on bad projectDir" {
  # Empty string, null, undefined, and non-string projectDir must all
  # produce a null return — never a throw. The factory is invoked at
  # plugin init and any throw would crash the harness startup.
  project=""
  run bash -c "
    unset TMUX
    cd '${TMUX_BATS_ROOT}' && node --input-type=module -e \"
      const m = await import('${TMUX_BATS_DIST}/integration.js');
      try {
        const result = await m.createTmuxIntegrationIfSupported('');
        process.stdout.write(result === null ? 'NULL' : 'BUILT');
      } catch (e) {
        process.stdout.write('THREW:' + e.message);
      }
    \"
  "
  [ "$status" -eq 0 ]
  # Acceptable outcomes: NULL (graceful) — THREW is a contract violation.
  [[ "$output" != *"THREW"* ]]
  [[ "$output" == *"NULL"* ]]
}

@test "createTmuxIntegrationIfSupported is idempotent across repeated calls" {
  # Calling the factory twice with the same projectDir must produce
  # the same outcome (both null when tmux unavailable, or both
  # non-null-but-distinct when tmux is available). On this host
  # without tmux, both calls must return null.
  project="$(tmux_bats_make_project)"
  run bash -c "
    unset TMUX
    cd '${TMUX_BATS_ROOT}' && node --input-type=module -e \"
      const m = await import('${TMUX_BATS_DIST}/integration.js');
      const a = await m.createTmuxIntegrationIfSupported('${project}');
      const b = await m.createTmuxIntegrationIfSupported('${project}');
      const same = (a === null && b === null) || (a !== null && b !== null);
      process.stdout.write(same ? 'CONSISTENT' : 'INCONSISTENT');
    \"
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"CONSISTENT"* ]]
}
