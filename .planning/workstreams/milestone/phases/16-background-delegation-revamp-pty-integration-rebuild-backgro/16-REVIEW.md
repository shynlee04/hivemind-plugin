---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
reviewed: 2026-04-21T11:55:50Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/lib/concurrency.ts
  - src/lib/session-api.ts
  - src/lib/spawner/concurrency-key.ts
  - src/lib/spawner/parent-directory.ts
  - src/lib/spawner/session-creator.ts
  - src/lib/spawner/pty-setup.ts
  - src/lib/delegation-manager.ts
  - src/lib/delegation-persistence.ts
  - src/lib/types.ts
  - src/lib/lifecycle-manager.ts
  - src/plugin.ts
  - src/tools/delegate-task.ts
  - src/tools/delegation-status.ts
  - tests/lib/concurrency.test.ts
  - tests/lib/session-api.test.ts
  - tests/lib/spawner/concurrency-key.test.ts
  - tests/lib/spawner/parent-directory.test.ts
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-04-21T11:55:50Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the Phase 16 delegation-runtime changes plus the directly referenced supporting tests. The new queue-key canonicalization and tool wiring are coherent overall, but the runtime integration still has three correctness/security gaps: PTY child processes inherit the full parent environment, PTY-mode tracking is not actually bound to the created OpenCode child session, and persisted `dispatched` records are not recoverable after restart.

Targeted verification passed:

```text
npx vitest run tests/lib/spawner/pty-setup.test.ts tests/lib/spawner/session-creator.test.ts tests/lib/delegation-manager.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts tests/plugins/plugin-lifecycle.test.ts
```

## Critical Issues

### CR-01: PTY child runtime inherits the full parent environment

**File:** `src/lib/delegation-manager.ts:495-500,535-540`

**Issue:** `startRuntimeMetadata()` passes `env: this.buildRuntimeEnv()` into the delegated PTY command, and `buildRuntimeEnv()` currently copies every string-valued entry from `process.env`. That means every delegated child process receives the full host environment, including unrelated credentials or tokens present in the parent shell. Because Phase 16 explicitly creates write-capable delegated children, this is a real privilege-expansion boundary and can leak secrets into background agents that do not need them.

**Fix:** Replace broad environment cloning with an explicit allowlist of only the variables required to launch the runtime.

```ts
private buildRuntimeEnv(): Record<string, string> {
  const keys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
  return Object.fromEntries(
    keys
      .map((key) => [key, process.env[key]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
}
```

## Warnings

### WR-01: PTY-mode metadata is not actually tied to the created child session

**File:** `src/lib/delegation-manager.ts:103-110,112-125,491-505`; `src/lib/spawner/pty-setup.ts:20-25`

**Issue:** `dispatch()` creates an OpenCode child session first, then starts PTY runtime separately. The PTY request does not receive the created `childSessionId`, and on PTY success `startDelegationRuntime()` returns the PTY session ID as `childSessionId`. `DelegationManager` then ignores that value and continues prompting/tracking the API-created child session. This can mark a delegation as `executionMode: "pty"` even though the tracked OpenCode session was never actually attached to that PTY runtime.

**Fix:** Thread the real OpenCode `childSessionId` through the runtime setup and reserve `ptySessionId` strictly for PTY bookkeeping.

```ts
type StartDelegationRuntimeArgs = {
  childSessionId: string
  ptyManager: Pick<PtyManager, "spawn">
  request: PtySpawnRequest
  spawnHeadless: () => Promise<SpawnHeadlessResult>
}

return {
  childSessionId: args.childSessionId,
  executionMode: "pty",
  workingDirectory: ptySession.cwd,
  ptySessionId: ptySession.id,
}
```

### WR-02: Restart recovery skips persisted `dispatched` delegations

**File:** `src/lib/delegation-manager.ts:128-133,231-270`

**Issue:** `dispatch()` persists a delegation before the prompt send resolves, but `recoverPending()` only rehydrates delegations whose status is already `running`. If the process exits after persistence but before the async prompt transition runs, the stored record remains `dispatched` forever after restart: it is loaded into memory, but no status reconciliation, prompt resend, or safety monitoring is reattached.

**Fix:** Recover both `dispatched` and `running` delegations, then reconcile actual child-session state before deciding whether to resume polling, resend the prompt, or fail the record.

```ts
if (delegation.status !== "running" && delegation.status !== "dispatched") {
  continue
}

this.delegationsBySession.set(delegation.childSessionId, delegation.id)
// reconcile session state here and either resume or fail closed
```

---

_Reviewed: 2026-04-21T11:55:50Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
