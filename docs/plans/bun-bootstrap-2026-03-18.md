# Bun Bootstrap Preflight

## Wave 0

- Purpose: make the Bun prerequisite real before any `apps/opentui` work or Bun-based verification runs.
- Gate: Task 1 and Task 2 must not start until this preflight is green.

## Bootstrap Command

```bash
curl -fsSL https://bun.com/install | bash
```

## Verification Command

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun --version
```

## Current Result

- Install command executed on 2026-03-17.
- Verification succeeded with `bun --version` returning `1.3.10`.
- Local shell sessions need `BUN_INSTALL` and `PATH` exported before Bun commands if the shell has not been reloaded.

## Execution Rule

- Task 1 and Task 2 must not start until `bun --version` exits 0 in the active session.
