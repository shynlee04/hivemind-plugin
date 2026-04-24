---
phase: 16.3-recent-changes
reviewed: 2026-04-24T12:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/lib/command-delegation.ts
  - src/lib/delegation-manager.ts
  - src/lib/delegation-persistence.ts
  - src/lib/pty/pty-manager.ts
  - src/lib/pty/pty-types.ts
  - src/lib/types.ts
  - src/tools/delegation-status.ts
  - src/tools/run-background-command.ts
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Code Review Report — Phase 16.3 Recent Changes

**Reviewed:** 2026-04-24T12:00:00Z
**Depth:** standard
**Files Reviewed:** 8 (source) + 4 (test — skimming only)
**Status:** issues_found

## Summary

Reviewed the 8 source files changed in the last 10 commits covering delegation lifecycle hardening, PTY cancellation, terminal detail surfacing, notification replay, and recovery contracts. The codebase is well-structured with strong typing and clear separation of concerns. No critical bugs or security vulnerabilities were found.

Three warnings identified: an unchecked type assertion in persistence normalization that could cause stuck delegations from corrupted JSON, a misleading exitCode default for signal-killed headless processes, and a fragile `setTimeout(0)` pattern in the dispatch status transition path.

Test coverage is extensive (395 test cases across 4 files, 3352 LOC) with proper use of `vi.advanceTimersByTimeAsync` for timer-dependent logic.

## Warnings

### WR-01: Unchecked type assertion accepts invalid delegation status

**File:** `src/lib/delegation-persistence.ts:89`
**Issue:** `record.status as Delegation["status"]` is an unchecked assertion. If the persisted JSON file contains a corrupted status value (e.g., `"bogus"`), it passes through normalization as-is. Downstream, `DelegationManager.transitionToTerminal()` guards against `"running" | "dispatched"` — any unknown status would never match, causing the delegation to become permanently stuck with no path to a terminal state. The `normalizePersistedDelegation` function validates primitive types but not enum values.
**Fix:**
```typescript
const VALID_STATUSES: ReadonlySet<string> = new Set(["dispatched", "running", "completed", "error", "timeout"])

// In normalizePersistedDelegation, replace line 89:
status: VALID_STATUSES.has(record.status) ? record.status as Delegation["status"] : "error",
// Also set delegation.error when defaulting to "error":
...(VALID_STATUSES.has(record.status) ? {} : { error: `[Harness] Unknown status '${record.status}' normalized to 'error'` }),
```

### WR-02: Misleading exitCode=0 stored for signal-killed headless processes

**File:** `src/lib/command-delegation.ts:200`
**Issue:** When a headless child process is killed by signal, Node.js provides `exitCode=null` and `signal="SIGTERM"`. The code defaults `exitCode ?? 0`, storing `exitCode: 0` in the delegation result. While `finalizeCommandDelegation` correctly checks `outcome.signal` before `outcome.exitCode` (so the delegation status is correct), the stored delegation metadata claims exit code 0 for a process that never exited normally. Status consumers (e.g., the `delegation-status` tool) could be misled.
**Fix:**
```typescript
// Line 200 — preserve null to signal "killed, not exited":
exitCode: exitCode ?? null,
signal: signal ?? undefined,

// In finalizeCommandDelegation, update the outcome type to allow null:
outcome: { output?: string; exitCode?: number | null; error?: string; signal?: string }

// Line 311 — already handles null via ?? 0:
} else if ((outcome.exitCode ?? 0) === 0) {
```

### WR-03: Fragile setTimeout(0) for dispatched→running transition

**File:** `src/lib/delegation-manager.ts:146-161`
**Issue:** After sending a prompt to the child session, the status transition from `"dispatched"` to `"running"` is deferred via `setTimeout(() => { ... }, 0)`. This has three issues:
1. The transition bypasses `transitionToTerminal()` — no `[Harness]` logging (violates R-OBS-01), no notification scheduling.
2. If the process crashes between dispatch and the macrotask callback, the delegation is stuck in `"dispatched"` until the safety ceiling fires.
3. The `setTimeout(0)` is a code smell — it's used to defer past the Promise resolution but the rationale is not documented.
**Fix:**
```typescript
// Add a dedicated micro-method with logging:
private markAsRunning(delegationId: string): void {
  const current = this.delegations.get(delegationId)
  if (current && current.status === "dispatched") {
    const previous = current.status
    current.status = "running"
    this.persistAllDelegations()
    console.error(`[Harness] Delegation ${delegationId} transitioned: ${previous} → running`)
  }
}

// Then use queueMicrotask for deterministic ordering:
}).then(() => { queueMicrotask(() => this.markAsRunning(delegation.id)) })
  .catch(() => { queueMicrotask(() => this.transitionToTerminal(delegation.id, "error", "Failed to send prompt")) })
```

## Info

### IN-01: Inconsistent indentation in delegation-status tool

**File:** `src/tools/delegation-status.ts:34-68`
**Issue:** The `if (args.delegationId)` block body uses mixed indentation levels (8, 10, and 12 spaces). Lines 37-67 are indented 2 spaces less than they should be, and the success object properties on lines 50-65 use an inconsistent 12-space indent vs the 10-space on line 49. This doesn't affect runtime behavior but makes the code harder to maintain.
**Fix:** Re-indent lines 37-68 to use consistent 10-space indentation within the `if (args.delegationId)` block.

### IN-02: `as never` type assertion bypasses type checking

**File:** `src/lib/delegation-manager.ts:121`
**Issue:** `client: this.client as never` casts the OpenCode client to `never`, bypassing all type checking when passing to `spawnDelegatedSession`. If the spawn function's signature changes, this won't be caught at compile time. This is acknowledged tech debt (AGENTS.md mentions `client: any` as known debt).
**Fix:** Create a minimal interface for what `spawnDelegatedSession` needs and cast to that interface instead.

### IN-03: Silent catch on session abort

**File:** `src/lib/delegation-manager.ts:332`
**Issue:** `try { await this.client.session.abort(...) } catch { /* no-op */ }` silently swallows abort errors. While the abort is best-effort after safety ceiling timeout, logging at debug level would help diagnose why sessions sometimes survive past their ceiling.
**Fix:** Add `console.debug(`[Harness] Session abort after safety ceiling failed: ${describeError(error)}`)` in the catch block.

### IN-04: Deprecated constants still exported

**File:** `src/lib/types.ts:472-475`
**Issue:** `STABILITY_THRESHOLD` and `STABILITY_POLL_INTERVAL_MS` are marked `@deprecated` but still exported. They delegate to the new constants, so there's no correctness issue, but they add to the public API surface unnecessarily.
**Fix:** Consider adding a `@deprecated` JSDoc with removal target version, or plan removal in the next major version.

---

_Reviewed: 2026-04-24T12:00:00Z_
_Reviewer: gsd-code-reviewer (standard depth)_
