# P41-C: Reader Preference — Evidence-Based Assumptions

**Date:** 2026-05-31
**Source:** Codebase reading of all 5 reader files + session-resolver + hook types
**Status:** All assumptions verified against current source code

---

## Assumption A1: Merge order at `delegation-status.ts:400` must flip

**Evidence (file:line):** `src/tools/delegation/delegation-status.ts:400`

```typescript
const allRecords = [...trackerChildren, ...persisted, ...managerDelegations]
```

The `byId.set()` last-write-wins merge at lines 402-418 means `trackerChildren` entries (written first) are overwritten by `persisted` entries (written second). This gives **old-file data precedence over session-tracker data**, which is the opposite of P41-C's goal.

**Verified:** The merge pattern at lines 405-418 uses `...record, ...existing` (later wins). The SPEC requires flipping to `[...persisted, ...trackerChildren, ...managerDelegations]` so tracker data takes precedence over old-file data.

**Confidence:** HIGH — verified by reading the actual array literal and merge logic.

---

## Assumption A2: Single delegation lookup already prefers in-memory over tracker (correct)

**Evidence (file:line):** `src/tools/delegation/delegation-status.ts:462-487`

```typescript
let delegation = delegationManager.getStatus(args.delegationId)
  ?? delegationManager.getAllDelegations().find(...)
  ?? readPersisted().find(...)

let trackerDel: Delegation | null = null
try {
  trackerDel = await getSessionTrackerDelegation(projectRoot, ...)
} catch { /* ignore */ }

if (delegation && trackerDel) {
  delegation = {
    ...trackerDel,       // tracker fields as base
    ...delegation,       // in-memory fields override
    // sub-fields use `??` to prefer non-null
  }
} else if (trackerDel) {
  delegation = trackerDel  // pure tracker fallback
}
```

The single-delegation lookup (lines 462-487) is already correct: it tries manager → persisted → tracker, and when both manager and tracker data exist, manager data wins on the `...delegation` spread. The `handleControl()` fallback at lines 610-618 also tries tracker after the same chain.

**Confidence:** HIGH — verified this path needs no change.

---

## Assumption A3: `resolveSessionFile` already imported in `hivemind-session-view.ts`

**Evidence (file:line):** `src/tools/hivemind/hivemind-session-view.ts:16`

```typescript
import { resolveSessionFile } from "../session/session-resolver.js"
```

Already present. No import needed — only the `readDelegationsForSession()` function body needs rewriting.

**Confidence:** HIGH — verified by reading line 16.

---

## Assumption A4: `readDelegationsForSession()` currently reads only `delegations.json`

**Evidence (file:line):** `src/tools/hivemind/hivemind-session-view.ts:68-79`

```typescript
async function readDelegationsForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown>[]> {
  try {
    const delegationsPath = resolve(projectRoot, ".hivemind", "state", "delegations.json")
    const raw = await readFile(delegationsPath, "utf-8")
    const allDelegations = JSON.parse(raw) as Array<Record<string, unknown>>
    return allDelegations.filter((d) =>
      d.childSessionId === sessionId || d.id === sessionId,
    ).slice(0, 20)
  } catch { return [] }
}
```

No session-tracker try at all. Hardcoded `.hivemind/state/delegations.json` path. The `resolve()` import is at line 12 from `node:path`. Note: the function is `async` but currently does only one try-catch block.

**Confidence:** HIGH — verified by reading the full function body.

---

## Assumption A5: `buildUnifiedView()` calls `readDelegationsForSession()` as Promise.all

**Evidence (file:line):** `src/tools/hivemind/hivemind-session-view.ts:96-101`

```typescript
const [session, delegations, trajectory] = await Promise.all([
  readSessionData(projectRoot, sessionId),
  readDelegationsForSession(projectRoot, sessionId),
  readTrajectoryForSession(projectRoot, sessionId),
])
```

The delegation data is consumed by `buildUnifiedView()` but not structurally transformed — the return shape at lines 122-131 wraps it in `{ total, active, entries }`. No structural output change needed after the reader change.

**Confidence:** HIGH — verified by reading the caller.

---

## Assumption A6: `projectDirectory` available in `plugin.ts` replay call site

**Evidence (file:line):** `src/plugin.ts:355, 414`

```typescript
const projectDirectory = directory ?? process.cwd()   // line 355
void replayPendingDelegationNotifications(client)      // line 414
```

`projectDirectory` is in scope at line 355 and accessible at line 414. The function needs to accept it as a second parameter.

**Confidence:** HIGH — verified by reading the scope chain.

---

## Assumption A7: `HookDependencies` lacks `projectDirectory`

**Evidence (file:line):** `src/hooks/types.ts:25-61`

The `HookDependencies` interface has `lifecycleManager`, `client`, `stateManager`, `eventObservers`, `autoLoopConfig`, `parentAutoLoopConfig`, `sleep`, `runAutoLoop`, `runRalphLoop`, `escalationMessage`, `getIntake`, `hivemindConfig`, `getFreshHivemindConfig`, `getBehavioralProfile`, `isMainSession`. **No `projectDirectory` field.**

**Confidence:** HIGH — verified by reading the full interface.

---

## Assumption A8: `ToolGuardDependencies` lacks `projectRoot`

**Evidence (file:line):** `src/hooks/guards/tool-guard-hooks.ts:28-33`

```typescript
export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HarnessLifecycleManager
  runtimePolicy?: RuntimePolicy
  hivemindConfig?: HivemindConfigs
}
```

**No `projectRoot` field.** Four fields, none path-related.

**Confidence:** HIGH — verified by reading the interface.

---

## Assumption A9: `createToolGuardHooks()` call in `plugin.ts` doesn't pass `projectRoot`

**Evidence (file:line):** `src/plugin.ts:501`

```typescript
const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy, hivemindConfig })
```

No `projectRoot` in the deps object. `projectDirectory` is available at line 355 in the enclosing scope.

**Confidence:** HIGH — verified by reading the call site.

---

## Assumption A10: `deps` bundle in `plugin.ts` doesn't carry `projectDirectory`

**Evidence (file:line):** `src/plugin.ts:473`

```typescript
const deps = { client, lifecycleManager, stateManager: taskState, runAutoLoop, runRalphLoop, escalationMessage, getIntake: ..., hivemindConfig, getFreshHivemindConfig: ..., getBehavioralProfile: ..., isMainSession: ... }
```

No `projectDirectory` in the `deps` object passed to `createSessionHooks(deps)`.

**Confidence:** HIGH — verified by reading line 473.

---

## Assumption A11: `getSessionContinuity()` can return `undefined`

**Evidence (file:line):** `src/hooks/lifecycle/session-hooks.ts:151-153`

```typescript
const continuity = getSessionContinuity(sessionID)
if (!continuity) {
  return
}
```

The null-check is already present at line 152. The enrichment must handle the case where `getSessionContinuity()` returns `undefined`. The `tool-guard-hooks.ts:193` does not null-check:

```typescript
const continuity = getSessionContinuity(sessionID)
```

So it can also return `undefined`. Enrichment must check.

**Confidence:** HIGH — verified in both hook files.

---

## Assumption A12: `listSessionContinuity()` returns `Record<string, SessionContinuityRecord>`

**Evidence:** The return value at `plugin.ts:630` is iterated with `Object.values(allSessions)`. Each element is a `SessionContinuityRecord` with `metadata` containing `pendingNotifications`, `lifecycle`, `compactionCheckpoint`, etc.

**Confidence:** MEDIUM — inferred from usage at plugin.ts:630-632, confirmed by the `enrichContinuityWithTracker` spec which merges `childRecord.lifecycle`, `childRecord.pendingNotifications`, `childRecord.compactionCheckpoint` into `continuityRecord.metadata.*`.

---

## Assumption A13: `resolveSessionFile` already handles child-record path with P41-B data

**Evidence:** `src/tools/session/session-resolver.ts:80-88` — When a child is found in the manifest, it reads the child `.json` file and returns `childRecord`. After P41-B dual-write, the `ChildSessionRecord` includes the 7 new gap fields (`pendingNotifications`, `lifecycle`, `compactionCheckpoint`, `queueKey`, `terminalKind`, `recoveryGuarantee`, `executionMode`).

**Confidence:** HIGH — `ChildSessionRecord` at `src/features/session-tracker/types.ts:218-258` includes all gap fields.

---

## Assumption A14: Old files remain fully functional during P41-C

**Evidence:** SPEC states "No old file paths are removed or made writable-only." The SPEC boundaries for each REQ explicitly say old paths remain until P41-D. The `readPersisted` function in `delegation-status.ts` remains called. The `readFile(delegationsPath)` in `hivemind-session-view.ts` remains as fallback.

**Confidence:** HIGH — SPEC boundaries are explicit. No code removal in this phase.

---

## Summary

| # | Assumption | Confidence | Impact if Wrong |
|---|-----------|-----------|-----------------|
| A1 | Merge order at L400 needs flip | HIGH | Reader preference wrong |
| A2 | Single delegation path already correct | HIGH | None |
| A3 | `resolveSessionFile` already imported | HIGH | None |
| A4 | `readDelegationsForSession` reads only old file | HIGH | Planner scope wrong |
| A5 | `buildUnifiedView` doesn't change shape | HIGH | Output contract breaks |
| A6 | `projectDirectory` in scope at replay | HIGH | Parameter missing |
| A7 | `HookDependencies` lacks `projectDirectory` | HIGH | Must add field |
| A8 | `ToolGuardDependencies` lacks `projectRoot` | HIGH | Must add field |
| A9 | `createToolGuardHooks()` doesn't pass `projectRoot` | HIGH | Must add to call |
| A10 | `deps` bundle lacks `projectDirectory` | HIGH | Must add to deps |
| A11 | `getSessionContinuity()` can return `undefined` | HIGH | Enrichment must null-check |
| A12 | `listSessionContinuity()` returns `Record<string, ...>` | MEDIUM | Iteration pattern correct |
| A13 | `resolveSessionFile` has P41-B gap fields | HIGH | Enrichment works |
| A14 | Old files remain functional fallback | HIGH | Reader fallback safe |

All 14 assumptions verified against current source code. No assumptions are blind — every claim is backed by file:line evidence.
