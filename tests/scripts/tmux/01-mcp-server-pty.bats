#!/usr/bin/env bats
#
# 01-mcp-server-pty.bats — Binary resolution for the MCP server's PTY mode.
#
# Tests the resolveBinary() function from src/features/tmux/integration.ts,
# which is the entry point that the factory uses to find tmux and opencode
# on the host PATH. This is the first step of the D-04 graceful-degradation
# chain — if resolveBinary returns null, the factory bails out silently
# (REQ-51-05 silent-fallback contract).

load "helpers"

setup() {
  tmux_bats_require_dist
}

@test "resolveBinary('opencode') returns the opencode path when installed" {
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.resolveBinary('opencode');
    process.stdout.write(result ?? 'NULL');
  "
  [ "$status" -eq 0 ]
  # opencode is installed at /usr/local/bin/opencode on this host.
  [[ "$output" == *"opencode"* ]]
  [[ "$output" != *"NULL"* ]]
}

@test "resolveBinary('tmux') returns null when tmux binary is not on PATH" {
  # Sanitize PATH so only /usr/local/bin, /usr/bin, and /bin are available.
  # /usr/local/bin is kept because node lives there on this host; tmux is not
  # installed anywhere on this host, so the narrowed set must produce a null
  # return (D-04 graceful-degradation contract).
  run bash -c "
    export PATH=/usr/local/bin:/usr/bin:/bin
    cd '${TMUX_BATS_ROOT}' && node --input-type=module -e \"
      const m = await import('${TMUX_BATS_DIST}/integration.js');
      const result = await m.resolveBinary('tmux');
      process.stdout.write(result === null ? 'NULL' : 'FOUND:' + result);
    \"
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"NULL"* ]]
}

@test "resolveBinary('nonexistent-binary-xyz-12345') returns null" {
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    const result = await m.resolveBinary('nonexistent-binary-xyz-12345');
    process.stdout.write(result === null ? 'NULL' : 'FOUND:' + result);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"NULL"* ]]
}

@test "resolveBinary never throws on bad input" {
  # Empty string is a degenerate but legal call. Must not throw.
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/integration.js');
    try {
      const result = await m.resolveBinary('');
      process.stdout.write(result === null ? 'NULL' : 'FOUND:' + result);
    } catch (e) {
      process.stdout.write('THREW:' + e.message);
    }
  "
  [ "$status" -eq 0 ]
  # Either NULL or FOUND is acceptable; the contract is "no throw".
  [[ "$output" == *"NULL"* ]] || [[ "$output" == *"FOUND"* ]]
}
