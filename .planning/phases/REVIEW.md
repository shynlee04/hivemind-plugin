---
phase: code-review
reviewed: 2026-05-23T10:30:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/coordination/delegation/manager.ts
findings:
  critical: 2
  warning: 4
  info: 1
  total: 7
status: issues_found
---

# Code Review Report

**Reviewed:** 2026-05-23T10:30:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `src/coordination/delegation/manager.ts` (362 lines) — the public facade for WaiterModel delegation dispatch. Acts as a thin adapter between the legacy runtime adapter (`manager-runtime.ts`) and the v2 `DelegationCoordinator`. Architecture is sound (facade pattern is intentional), but two BLOCKER-level defects were found: one causes getter-based access to crash in v2-only mode, the other returns contradictory state for the `change-agent` control action. Additional WARNINGs include direct mutation of shared state, unsafe type assertions, and a dead-code conditional.

---

## Critical Issues

### CR-01: Property getters crash when runtime is undefined (v2-only mode)

**File:** `src/coordination/delegation/manager.ts:332-338`
**Issue:** Five property getters (`stabilityTimers`, `delegations`, `delegationsBySession`, `safetyTimers`, `semaphore`) call `this.requireRuntime()` unconditionally. When the `DelegationManager` is constructed without a `client` argument (valid v2-only mode — i.e., `options.coordinator` and `options.lifecycle` are provided), `this.runtime` remains `undefined`. Any access to these getters throws `[Harness] DelegationManager runtime adapter is not configured.`, crashing the caller.

This is a BLOCKER because it's a runtime crash path that depends only on constructor configuration, not on an explicit misuse. Any code that accesses `manager.delegations` (e.g., a status tool enumerating all delegations) will fail silently or crash the host process.

**Fix:** Guard each getter with an optional chain fallback, the same pattern used by `listDelegations()` on line 138:

```typescript
get delegations(): Map<string, Delegation> {
  return this.runtime?.delegations ?? new Map()
}
```

Or provide a meaningful fallback for each getter's return type:
```typescript
get stabilityTimers(): Map<string, NodeJS.Timeout> { return this.runtime?.stabilityTimers ?? new Map() }
get delegations(): Map<string, Delegation> { return this.runtime?.delegations ?? new Map() }
get delegationsBySession(): Map<string, string> { return this.runtime?.delegationsBySession ?? new Map() }
get safetyTimers(): Map<string, NodeJS.Timeout> { return this.runtime?.safetyTimers ?? new Map() }
get semaphore(): { acquire: (...args: unknown[]) => Promise<() => void> } {
  return this.runtime?.semaphore ?? { acquire: async () => () => {} }
}
```

---

### CR-02: `change-agent` returns "running" for an aborted delegation without creating a new record

**File:** `src/coordination/delegation/manager.ts:206-219`
**Issue:** The `change-agent` action calls `this.options.coordinator?.abortDelegation?.(request.delegationId, ...)` on line 215, which transitions the original delegation to a terminal error state. However, on line 218, it returns `{ delegationId: request.delegationId, childSessionId, status: "running" as const }` — claiming the *same* delegation ID is now running. No new delegation record is created via `lifecycle.register`, so any subsequent `getStatus(request.delegationId)` returns the terminal (aborted) state.

This creates a direct contradiction between the method's return value and the stored state. The caller receives `status: "running"` but `getStatus()` returns the aborted record. Downstream consumers (status tools, completion detectors, recovery logic) operate on stale or contradictory state.

**Fix:** After aborting, create a new delegation record (similar to the resume/chain path on lines 235-268) and register it:

```typescript
if (request.action === "change-agent") {
  if (!request.agent) throw new Error("[Harness] change-agent requires an agent name")
  const childSessionId = delegation.childSessionId
  if (!childSessionId || !this.options.sendPromptAsync) {
    throw new Error("[Harness] Cannot change-agent: no active session or sendPromptAsync unavailable")
  }
  const prompt = request.restartPrompt ?? delegation.prompt
  if (!prompt) throw new Error("[Harness] change-agent requires a prompt")

  // Abort current delegation record
  this.options.coordinator?.abortDelegation?.(request.delegationId, `[Harness] Delegation change-agent`)

  // Create a new record, preserving the child session
  const newRecord: Delegation = {
    ...delegation,
    id: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    agent: request.agent,
    childSessionId,
    prompt,
    status: "running",
    createdAt: Date.now(),
    completedAt: undefined,
    restartedFrom: delegation.id,
    executionState: "pending",
    // ... reset all lifecycle fields
  }
  this.options.lifecycle?.register?.(newRecord)

  // Send prompt with new agent context to existing session
  await this.options.sendPromptAsync(childSessionId, prompt)
  return { delegationId: newRecord.id, childSessionId, status: "running" as const }
}
```

---

## Warnings

### WR-01: Direct mutation of stored delegation records via leaked reference

**File:** `src/coordination/delegation/manager.ts:283-287`
**Issue:** Inside `controlDelegation()`'s legacy abort+dispatch path, `this.getStatus(replacement.delegationId)` returns the stored `Delegation` object by reference (not a copy). Lines 283-287 directly mutate fields on it:

```typescript
const replacementRecord = this.getStatus(replacement.delegationId)
if (replacementRecord) {
  if (request.action === "restart") replacementRecord.restartedFrom = delegation.id
  if (request.action === "resume") replacementRecord.resumedFrom = delegation.id
  if (request.action === "chain") replacementRecord.chainedFrom = delegation.id
}
```

This violates the project's documented "deep-clone-on-read" pattern in continuity store (from AGENTS.md: *"Deep-clone-on-read in continuity store"*). Direct mutation of shared reference-typed records opens race conditions where another consumer reading the record simultaneously sees an incomplete state, or the mutation is silently lost if the record is serialized/deserialized between layers.

**Fix:** Perform a clone before mutation, or use the lifecycle module's transition/update mechanism:

```typescript
const replacementRecord = this.getStatus(replacement.delegationId)
if (replacementRecord) {
  const updated = { ...replacementRecord }
  if (request.action === "restart") updated.restartedFrom = delegation.id
  if (request.action === "resume") updated.resumedFrom = delegation.id
  if (request.action === "chain") updated.chainedFrom = delegation.id
  // Persist updated record
  this.options.lifecycle?.register?.(updated)
}
```

---

### WR-02: Unsafe type assertion `DispatchParams as DelegateParams`

**File:** `src/coordination/delegation/manager.ts:90`
**Issue:** The `dispatchDelegation` method casts the entire `DispatchParams` object to `DelegateParams`:

```typescript
return this.requireRuntime().dispatch(params as DelegateParams)
```

`DispatchParams` is a type alias for `PreflightParams` (from `dispatcher.ts`), while `DelegateParams` is defined in `spawn-request-builder.ts`. These types may have different shapes. The cast suppresses all type-checker errors — if they diverge (e.g., a new required field is added to one but not the other), this becomes a silent runtime failure.

**Fix:** Either (a) stop casting and adapt the objects explicitly with a mapping function, or (b) add a shared interface that both `DispatchParams` and `DelegateParams` extend to guarantee shape compatibility. At minimum, use a runtime spread:

```typescript
return this.requireRuntime().dispatch({
  agent: params.agent,
  parentSessionId: params.parentSessionId,
  prompt: params.prompt,
  workingDirectory: params.workingDirectory,
} as DelegateParams)
```

---

### WR-03: Unsafe type escape hatch on `semaphore` getter

**File:** `src/coordination/delegation/manager.ts:336-338`
**Issue:** The `semaphore` getter uses a double `as unknown as` cast to extract a sub-property from the runtime module:

```typescript
get semaphore(): { acquire: (...args: unknown[]) => Promise<() => void> } {
  return (this.requireRuntime() as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore
}
```

The intermediate `as unknown` bypasses all TypeScript structural type checking. If `RuntimeDelegationManager` restructures its internals, renames `semaphore`, or changes the `acquire` signature, the cast silently produces `undefined` or a wrong-shaped object, leading to hard-to-debug runtime errors.

**Fix:** Either expose `semaphore` as a proper public property on `RuntimeDelegationManager` (so TypeScript can enforce structural compatibility), or make it optional with fallback:

```typescript
get semaphore(): { acquire: (...args: unknown[]) => Promise<() => void> } | undefined {
  return (this.runtime as any)?.semaphore
}
```

---

### WR-04: New delegation records silently dropped when `lifecycle.register` is undefined

**File:** `src/coordination/delegation/manager.ts:269`
**Issue:** On the resume/chain path (lines 235-270), a new delegation record is built with full detail and then registered via optional chaining:

```typescript
this.options.lifecycle?.register?.(newRecord)
```

The `register` property on `FacadeLifecycle` (line 20) is declared as optional: `register?: (record: Delegation) => void`. If the injected lifecycle object does not provide a `register` implementation (which is valid according to the type definition), the new record created with a unique ID (`dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`) is silently discarded. The caller on line 270 returns the new `delegationId`, but calling `getStatus(newDelegationId)` immediately afterward returns `undefined`.

**Fix:** Either make `register` required on `FacadeLifecycle`, or add an assertion/warning:

```typescript
if (!this.options.lifecycle?.register) {
  console.warn("[Harness] resume/chain created new delegation but lifecycle.register is not available")
}
```

---

## Info

### IN-01: Dead ternary expression — identical branches

**File:** `src/coordination/delegation/manager.ts:274`
**Issue:** Line 274 has a ternary with two identical branches:

```typescript
const agent = request.action === "restart" ? delegation.agent : delegation.agent
```

Both the truthy and falsy arms produce `delegation.agent`. The condition `request.action === "restart"` has no effect on the outcome. This is likely a copy-paste artifact from an earlier version where different actions could specify different agents; today, `request.agent` is only present for `change-agent` (handled earlier on line 207), so this branch should always use `delegation.agent` unconditionally.

**Fix:** Simplify:

```typescript
const agent = delegation.agent
```

---

_Reviewed: 2026-05-23T10:30:00Z_
_Reviewer: gsd-code-reviewer (agent)_
_Depth: standard_
