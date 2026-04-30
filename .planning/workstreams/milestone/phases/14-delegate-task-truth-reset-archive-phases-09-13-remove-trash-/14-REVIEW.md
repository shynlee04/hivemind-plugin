---
phase: 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash
reviewed: 2026-04-17T11:28:36Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - AGENTS.md
  - src/lib/delegation-manager.ts
  - src/lib/types.ts
  - src/plugin.ts
  - src/tools/delegate-task.ts
  - tests/lib/delegation-manager.test.ts
  - tests/tools/delegate-task.test.ts
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-04-17T11:28:36Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the rebuilt delegation path across `DelegationManager`, the `delegate-task` tool, plugin wiring, and focused Vitest coverage. Fresh verification succeeded (`npm run typecheck`, `CI=true npx vitest run tests/lib/delegation-manager.test.ts tests/tools/delegate-task.test.ts`), but I found three correctness issues in the new delegation flow.

The most important problem is a sync-completion race: a child session can finish before `delegateSync()` registers its resolver, leaving the caller hanging forever. I also found that deleted async child sessions are not reported back to the parent, and the runtime agent allowlist is narrower than the project’s configured agent surface.

## Warnings

### WR-01: `delegateSync()` can hang if the child completes before the callback is registered

**File:** `src/lib/delegation-manager.ts:44-49`, `src/lib/delegation-manager.ts:57-65`, `src/lib/delegation-manager.ts:201-211`
**Issue:** `delegateSync()` waits for `createDelegation()` to finish before storing the completion callback. If the child session reaches `session.idle` during or immediately after prompt dispatch, `handleSessionIdle()`/`finalizeDelegation()` can complete the delegation before `completionCallbacks` contains an entry. In that case the result is only sent through `notifyParent()`, while the original `delegateSync()` promise remains unresolved forever.
**Fix:** Register the sync resolver before any event can finalize the delegation. For example, create the promise first, pass its callbacks into the delegation creation path, and only expose the delegation as runnable after `completionCallbacks` is populated.

```ts
async delegateSync(params: DelegateParams): Promise<DelegationResult> {
  let callbacks!: DelegationCallbacks
  const result = new Promise<DelegationResult>((resolve, reject) => {
    callbacks = { resolve, reject }
  })

  await this.createDelegation(params, callbacks)
  return result
}
```

Then let `createDelegation()` store `callbacks` before scheduling timeout/prompt dispatch.

### WR-02: Deleted async child sessions never notify the parent session

**File:** `src/lib/delegation-manager.ts:68-90`, `src/lib/delegation-manager.ts:249-255`
**Issue:** `handleSessionDeleted()` rejects synchronous waiters, but for async delegations it only persists the error and cleans up tracking. Unlike timeout and finalize paths, it never calls `notifyParent()`. That leaves the parent session with no completion/error signal when a background child is deleted externally.
**Fix:** Mirror the timeout/finalize behavior: if no sync callback exists, notify the parent after persistence.

```ts
const callback = this.completionCallbacks.get(delegationId)
if (callback) {
  callback.reject(new Error(`[Harness] ${delegation.error}`))
  this.completionCallbacks.delete(delegationId)
} else {
  await this.notifyParent(delegation)
}
```

### WR-03: Hard-coded valid-agent list can reject project-configured agents

**File:** `src/lib/types.ts:23-25`, `AGENTS.md:166-170`
**Issue:** `VALID_AGENTS` hard-codes only `researcher`, `builder`, `critic`, and `general`, but the project documents a broader configured agent surface under `.opencode/agents/`. This makes delegate-task availability depend on a manually maintained constant, so adding or renaming a real configured agent can silently break delegation with `[Harness] Invalid agent` until code is updated.
**Fix:** Resolve valid agent names from the runtime/project agent registry instead of a duplicated constant, or keep the constant synchronized with the actual configured agents and add a test that fails when the registry and allowlist diverge.

```ts
// Example direction
const validAgents = await client.app.agents()
if (!validAgents.some((entry) => entry.name === agent)) {
  throw new Error(`[Harness] Invalid agent: ${agent}`)
}
```

---

_Reviewed: 2026-04-17T11:28:36Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
