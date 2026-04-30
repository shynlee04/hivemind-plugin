---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
reviewed: 2026-04-21T11:55:50Z
fix_date: 2026-04-21T19:30:00Z
findings_in_scope: 3
fixed: 3
skipped: 0
iteration: 1
status: all_fixed
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-04-21T19:30:00Z
**Source review:** `.planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Verification Results

- **Typecheck:** All errors are pre-existing (globalThis.Bun indexing, bun-pty missing, SDK version mismatch). No new errors introduced by fixes.
- **Tests:** 443 passed, 1 skipped, 1 todo. No regressions.

## Fixed Issues

### CR-01: PTY child runtime inherits the full parent environment

**Files modified:** `src/lib/delegation-manager.ts`
**Commit:** `98344693`
**Applied fix:** Replaced broad `process.env` cloning in `buildRuntimeEnv()` with an explicit allowlist of only the variables required to launch the runtime: `["PATH", "HOME", "TERM", "LANG", "PWD"]`. Only string-valued entries are included. This prevents leaking credentials, tokens, and unrelated secrets into delegated child processes.

### WR-01: PTY-mode metadata is not actually tied to the created child session

**Files modified:** `src/lib/spawner/pty-setup.ts`, `src/lib/delegation-manager.ts`, `tests/lib/spawner/pty-setup.test.ts`
**Commits:** `18445aad`, `7d2ff13b`
**Applied fix:** Added `childSessionId` field to `StartDelegationRuntimeArgs` type. When PTY mode succeeds, the function now returns the passed-in `childSessionId` (the real API-created child session ID) instead of the PTY session ID. `ptySessionId` remains strictly for PTY bookkeeping. The `delegation-manager.ts` now passes the real `childSessionId` into the runtime setup call. Updated test to match the new behavior.

### WR-02: Restart recovery skips persisted dispatched delegations

**Files modified:** `src/lib/delegation-manager.ts`
**Commit:** `50343a64`
**Applied fix:** Expanded the `recoverPending()` status filter to include `"dispatched"` alongside `"running"`. Now both statuses trigger session-index registration and reconciliation against actual child-session state. For dispatched delegations where the session is idle, `handleSessionIdle()` handles the transition to running and starts stability polling. For sessions still busy, the safety ceiling is scheduled. For sessions not found, the delegation is failed closed with an error status.

---

_Fixed: 2026-04-21T19:30:00Z_
_Fixer: gsd-code-fixer_
_Iteration: 1_
