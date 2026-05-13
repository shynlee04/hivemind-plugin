---
phase: CP-ST-02-session-tracker-deep-fix-remaining
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/session-tracker/persistence/pending-dispatch-registry.ts
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/capture/event-capture.ts
autonomous: true
requirements:
  - AC-02
  - AC-05
must_haves:
  truths:
    - "PendingDispatchRegistry exists as an in-memory Map with add/remove/has/cleanupStale methods"
    - "ensureSessionReady checks Gate 3 (pending registry) before creating a directory"
    - "handleSessionCreated checks Gate 3 (pending registry) before creating a directory"
    - "Stale entries (>30s) are auto-purged on classification check"
  artifacts:
    - path: "src/features/session-tracker/persistence/pending-dispatch-registry.ts"
      provides: "In-memory registry for sessions pending child discovery"
      exports: ["PendingDispatchRegistry", "PendingDispatchEntry"]
    - path: "src/features/session-tracker/index.ts"
      provides: "Gate 3 integration in ensureSessionReady"
      contains: "pendingRegistry.has"
    - path: "src/features/session-tracker/capture/event-capture.ts"
      provides: "Gate 3 integration in handleSessionCreated"
      contains: "pendingRegistry?.has"
  key_links:
    - from: "src/features/session-tracker/index.ts ensureSessionReady"
      to: "PendingDispatchRegistry.has()"
      via: "this.pendingRegistry?.has(sessionID)"
      pattern: "pendingRegistry\\.has"
    - from: "src/features/session-tracker/capture/event-capture.ts handleSessionCreated"
      to: "PendingDispatchRegistry.has()"
      via: "this.pendingRegistry?.has(sessionID)"
      pattern: "pendingRegistry\\.has"
---

<objective>
Create the PendingDispatchRegistry class and upgrade session classification from dual-gate to three-gate, adding Gate 3 fallback for sessions that were recently dispatched as tasks but whose child session ID is not yet known to the SDK or HierarchyIndex.

Purpose: Close the race condition window where `session.created` fires during `TaskTool.execute()` and neither Gate 1 (SDK parentID) nor Gate 2 (HierarchyIndex) knows the session is a child. Gate 3 uses the fact that a dispatch was recently observed to classify the session as a child before directories get created.

Output:
- New file: `src/features/session-tracker/persistence/pending-dispatch-registry.ts`
- Modified: `src/features/session-tracker/index.ts` — `ensureSessionReady()` upgraded to three-gate
- Modified: `src/features/session-tracker/capture/event-capture.ts` — `handleSessionCreated()` upgraded to three-gate
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-SPEC.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-CONTEXT.md
@.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-RESEARCH.md
@.planning/codebase/ARCHITECTURE.md

<interfaces>
<!-- Key types the executor needs. Extracted from codebase. -->

From src/features/session-tracker/persistence/hierarchy-index.ts:
```typescript
export class HierarchyIndex {
  constructor(deps: { projectRoot: string })
  isChild(sessionID: string): boolean
  registerChild(parentID: string, childID: string): void
  getParent(childID: string): string | null
  getDepth(sessionID: string): number
  get size(): number
}
```

From src/features/session-tracker/index.ts (SessionTracker internal fields):
```typescript
private hierarchyIndex!: HierarchyIndex
private bootstrappedSessions: Set<string> = new Set()
private sessionWriter!: SessionWriter
private projectIndexWriter!: ProjectIndexWriter
```

From src/features/session-tracker/capture/event-capture.ts:
```typescript
export class EventCapture {
  private hierarchyIndex: HierarchyIndex | undefined
  // constructor receives hierarchyIndex via deps injection
  // handleSessionCreated(sessionID) uses dual-gate (SDK + hierarchyIndex)
}
```

From src/shared/session-api.ts:
```typescript
export type OpenCodeClient = ReturnType<typeof createOpencodeClient>
export async function getSession(client: OpenCodeClient, sessionID: string): Promise<SessionRecord>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PendingDispatchRegistry class</name>
  <files>src/features/session-tracker/persistence/pending-dispatch-registry.ts</files>

  <read_first>
Read before implementing:
- SPEC §2.2 (PendingDispatchRegistry lifecycle: add at PreToolUse, remove at PostToolUse, 30s auto-purge)
- SPEC §2.3 (Gate activation timing table)
- CONTEXT §D-01 (three-gate classification decision)
- `src/features/session-tracker/persistence/hierarchy-index.ts` (pattern: same constructor shape, same export style)
- `src/features/session-tracker/types.ts` (existing type conventions)
  </read_first>

  <action>
Create `src/features/session-tracker/persistence/pending-dispatch-registry.ts` with:

```typescript
/**
 * Pending dispatch entry stored when PreToolUse detects a task tool dispatch.
 * Lives in-memory only — never persisted to disk.
 */
export interface PendingDispatchEntry {
  parentSessionID: string
  callID: string
  subagentType: string
  timestamp: number  // Date.now() at registration time
}

/**
 * In-memory registry for sessions that have been dispatched as tasks
 * but whose child session ID is not yet known.
 *
 * Provides Gate 3 classification: if a session.created event fires for
 * a session whose parent recently dispatched a task, we can infer it's
 * a child even before the SDK or HierarchyIndex confirms it.
 *
 * Lifecycle:
 * 1. PreToolUse (tool.execute.before with tool="task") → add()
 * 2. PostToolUse (tool.execute.after with metadata.sessionId) → remove()
 * 3. Auto-purge: stale entries (>30s) removed on classification check
 *
 * All methods are synchronous (Map operations, no I/O).
 * Thread safety: single-threaded Node.js event loop (sync Map ops).
 *
 * @module session-tracker/persistence/pending-dispatch-registry
 */
export class PendingDispatchRegistry {
  /** childID → PendingDispatchEntry map for O(1) has() lookup */
  private dispatches: Map<string, PendingDispatchEntry> = new Map()

  /** callID → childID reverse index for cleanup at PostToolUse */
  private callIDToChild: Map<string, string> = new Map()

  /** Maximum age (ms) before an entry is considered stale and auto-purged */
  static readonly STALE_THRESHOLD_MS = 30_000

  /**
   * Registers a pending dispatch for a parent session.
   * Called by handleToolExecuteBefore when tool === "task" and task_id is absent (new dispatch, not resume).
   *
   * Note: at PreToolUse time, the child session ID is NOT yet known.
   * The child will be discovered later via polling or PostToolUse metadata.
   * For the initial registration, we use callID as a temporary key
   * (replaced later with the real child session ID when discovered).
   */
  add(entry: PendingDispatchEntry): void {
    // Use callID as temporary key until child session ID is discovered.
    // When the child session ID becomes known (via polling or PostToolUse),
    // updateEntry removes the callID key and re-adds with child session ID.
    this.dispatches.set(`call:${entry.callID}`, entry)
  }

  /**
   * Updates a pending dispatch entry with the actual child session ID.
   * Called when the child session is discovered (via polling or PostToolUse).
   *
   * Removes the callID-based temporary entry and re-adds with the real
   * child session ID, enabling Gate 3 has() lookups.
   */
  updateWithChildID(callID: string, childSessionID: string): void {
    const callKey = `call:${callID}`
    const entry = this.dispatches.get(callKey)
    if (!entry) return
    this.dispatches.delete(callKey)
    this.dispatches.set(childSessionID, entry)
    this.callIDToChild.set(callID, childSessionID)
  }

  /**
   * Checks whether a session ID has a pending dispatch entry.
   * Used by Gate 3 classification in ensureSessionReady and handleSessionCreated.
   *
   * Checks both direct childID keys AND callID-based temporary keys.
   * Auto-purges stale entries before checking.
   */
  has(sessionID: string): boolean {
    this.cleanupStale()
    return this.dispatches.has(sessionID) || this.dispatches.has(`call:${sessionID}`)
  }

  /**
   * Retrieves the pending dispatch entry for a session ID, if any.
   * Returns undefined if not found or entry is stale.
   */
  get(sessionID: string): PendingDispatchEntry | undefined {
    this.cleanupStale()
    const entry = this.dispatches.get(sessionID) ?? this.dispatches.get(`call:${sessionID}`)
    if (entry && Date.now() - entry.timestamp > PendingDispatchRegistry.STALE_THRESHOLD_MS) {
      this.dispatches.delete(sessionID)
      this.dispatches.delete(`call:${sessionID}`)
      return undefined
    }
    return entry
  }

  /**
   * Gets the subagentType for a pending dispatch, if any.
   * Used for delegator attribution in tool-capture.handleTask.
   */
  getSubagentType(sessionID: string): string | undefined {
    return this.get(sessionID)?.subagentType
  }

  /**
   * Removes a pending dispatch entry by callID (PostToolUse cleanup).
   */
  removeByCallID(callID: string): void {
    const callKey = `call:${callID}`
    const childID = this.callIDToChild.get(callID)
    this.dispatches.delete(callKey)
    if (childID) {
      this.dispatches.delete(childID)
      this.callIDToChild.delete(callID)
    }
  }

  /**
   * Removes a pending dispatch entry by child session ID.
   */
  remove(sessionID: string): void {
    this.dispatches.delete(sessionID)
  }

  /**
   * Removes ALL pending dispatch entries whose timestamp exceeds
   * STALE_THRESHOLD_MS. Called automatically by has() and get().
   *
   * Per SPEC §2.2: stale entries (>30s) auto-purged on next classification check.
   */
  cleanupStale(): void {
    const now = Date.now()
    const threshold = PendingDispatchRegistry.STALE_THRESHOLD_MS
    for (const [key, entry] of this.dispatches) {
      if (now - entry.timestamp > threshold) {
        this.dispatches.delete(key)
        // Clean up callIDToChild if this was a childID entry
        for (const [callId, childId] of this.callIDToChild) {
          if (childId === key) {
            this.callIDToChild.delete(callId)
            break
          }
        }
      }
    }
  }

  /**
   * Returns the number of active (non-stale) pending dispatch entries.
   */
  get size(): number {
    this.cleanupStale()
    return this.dispatches.size
  }

  /**
   * Clears all entries. Used in tests.
   */
  clear(): void {
    this.dispatches.clear()
    this.callIDToChild.clear()
  }
}
```

Key design decisions:
- **callID as temporary key**: Because the child session ID is unknown at PreToolUse time, entries are stored with `call:` prefix. When the child ID is discovered, `updateWithChildID()` re-keys the entry with the real session ID.
- **Synchronous Map operations**: No async I/O — the registry is purely in-memory. All methods return synchronously.
- **30s auto-purge**: Stale entries are removed on every `has()`/`get()` call via `cleanupStale()`. If a dispatch never completes (tool abort, crash), the entry auto-expires and won't cause false CHILD classification.
- **subagentType storage**: The agent name is captured in the entry at registration time and retrieved later by tool-capture for delegator attribution.
  </action>

  <verify>
    <automated>npx vitest run tests/features/session-tracker/pending-dispatch-registry.test.ts --reporter=verbose</automated>
  </verify>

  <acceptance_criteria>
- [ ] `PendingDispatchRegistry` class exists in `src/features/session-tracker/persistence/pending-dispatch-registry.ts`
- [ ] `add()` stores entry with `call:` prefix key
- [ ] `updateWithChildID()` re-keys entry from callID to real child session ID
- [ ] `has()` returns true for both callID-prefixed keys and childID keys
- [ ] `cleanupStale()` removes entries older than 30s
- [ ] `getSubagentType()` returns the subagentType string or undefined
- [ ] `removeByCallID()` removes both callID and childID entries
- [ ] TypeScript compiles: `npx tsc --noEmit` passing for this file
- [ ] Module exports: `PendingDispatchRegistry`, `PendingDispatchEntry`
  </acceptance_criteria>

  <done>PendingDispatchRegistry class created with add/has/get/remove/cleanupStale methods, 30s stale threshold, and callID-based temporary keying for the pre-discovery window.</done>
</task>

<task type="auto">
  <name>Task 2: Wire PendingDispatchRegistry into SessionTracker and add Gate 3</name>
  <files>src/features/session-tracker/index.ts, src/features/session-tracker/capture/event-capture.ts</files>

  <read_first>
Read before implementing:
- `src/features/session-tracker/index.ts` (full file — especially `ensureSessionReady()` lines 130-217, `initialize()` lines 516-607, constructor lines 112-115, field declarations lines 74-103)
- `src/features/session-tracker/capture/event-capture.ts` (full file — especially `handleSessionCreated()` lines 173-236, constructor lines 53-67)
- SPEC §2.1 (three-gate order), §2.2 (PendingDispatchRegistry lifecycle)
- CONTEXT §D-01 (Gate order: SDK → HierarchyIndex → PendingDispatchRegistry)
  </read_first>

  <action>

**Step A: Add PendingDispatchRegistry to SessionTracker (src/features/session-tracker/index.ts)**

1. Add import at top (after existing imports, line ~55):
```typescript
import { PendingDispatchRegistry, type PendingDispatchEntry } from "./persistence/pending-dispatch-registry.js"
```

2. Add field declaration after `hierarchyIndex` (after line ~91):
```typescript
  /**
   * In-memory registry for sessions that had task tool dispatch detected
   * at PreToolUse time but whose child session ID is not yet known.
   * Provides Gate 3 (fallback) classification. Never persisted to disk.
   */
  private pendingRegistry!: PendingDispatchRegistry
```

3. Add initialization in `initialize()` (after `this.hierarchyIndex` init, after line ~529):
```typescript
      // Create pending dispatch registry (Gate 3 classification fallback).
      // Populated at tool.execute.before time by handleToolExecuteBefore(),
      // consumed by ensureSessionReady() and handleSessionCreated().
      this.pendingRegistry = new PendingDispatchRegistry()
```

4. Add Gate 3 check in `ensureSessionReady()` — insert AFTER the HierarchyIndex check (after line 178, before line 180's "Neither SDK parentID nor hierarchy index indicates..." comment):
```typescript
    // Gate 3: Check pending dispatch registry.
    // If a parent session recently dispatched a task tool (detected at
    // PreToolUse time), the resulting child session is tracked here even
    // before the SDK reports parentID or the hierarchy index is populated.
    // This closes the race condition where session.created fires during
    // TaskTool.execute(), before tool.execute.after populates HierarchyIndex.
    if (this.pendingRegistry?.has(sessionID)) {
      this.bootstrappedSessions.add(sessionID)
      return
    }
```

5. Update the `EventCapture` constructor call in `initialize()` to pass `pendingRegistry` (around line ~534):
```typescript
      this.eventCapture = new EventCapture({
        client: this.client,
        sessionWriter: this.sessionWriter,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
        hierarchyIndex: this.hierarchyIndex,
        pendingRegistry: this.pendingRegistry,
      })
```

6. Update the `ToolCapture` constructor call in `initialize()` to pass `pendingRegistry` (around line ~549):
```typescript
      this.toolCapture = new ToolCapture({
        client: this.client,
        sessionWriter: this.sessionWriter,
        childWriter: this.childWriter,
        sessionIndexWriter: this.sessionIndexWriter,
        projectIndexWriter: this.projectIndexWriter,
        hierarchyIndex: this.hierarchyIndex,
        pendingRegistry: this.pendingRegistry,
      })
```

**Step B: Add Gate 3 to EventCapture (src/features/session-tracker/capture/event-capture.ts)**

7. Add import at top (after existing imports, around line ~24):
```typescript
import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"
```

8. Add field in EventCapture class (after `hierarchyIndex`, around line ~43):
```typescript
  private pendingRegistry: PendingDispatchRegistry | undefined
```

9. Update constructor destructuring to accept `pendingRegistry` (after `hierarchyIndex` param, around line ~59):
```typescript
    pendingRegistry?: PendingDispatchRegistry
```
And add assignment in constructor body (after `this.hierarchyIndex = deps.hierarchyIndex`, around line ~66):
```typescript
    this.pendingRegistry = deps.pendingRegistry
```

10. Add Gate 3 check in `handleSessionCreated()` — insert AFTER the HierarchyIndex Gate 2 check (after line 205, before line 207's "// Root session — create subdirectory"):
```typescript
        // Gate 3: Check pending dispatch registry.
        // If a parent session recently dispatched a task, the resulting
        // child session is tracked here even before the SDK or hierarchy
        // index knows about it.
        if (this.pendingRegistry?.has(sessionID)) {
          // Child session — skip directory creation (handled by tool-capture)
          return
        }
```

11. Update `isChild()` usages in the other handler methods (`handleSessionIdle`, `handleSessionDeleted`, `handleSessionError`) — these also need Gate 3. Change the `parentID` check pattern to include Gate 3. In each of these three methods (lines ~246, ~277, ~309), add after the `if (parentID !== null ...)` check:
```typescript
      const parentID = session.parentID as string | null | undefined
      // Gate 3 fallback: check pending dispatch registry
      const isChild = (parentID !== null && parentID !== undefined) || this.pendingRegistry?.has(sessionID)
      if (isChild) {
```
And remove the original `if (parentID !== null ...)` block, replacing with `if (isChild)`. Keep the main session fallback as-is.

**Step C: Update ToolCapture constructor**

12. Update `src/features/session-tracker/capture/tool-capture.ts` to accept `pendingRegistry` in its constructor:
- Add import: `import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"`
- Add field: `private pendingRegistry: PendingDispatchRegistry | undefined`
- Add param in constructor deps and assign

Note: The actual use of `pendingRegistry` in handleTask for delegator attribution happens in Plan 02-03. In this plan, we only wire the dependency injection plumbing.
  </action>

  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/ --reporter=verbose 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
- [ ] `SessionTracker` has `private pendingRegistry: PendingDispatchRegistry` field
- [ ] `initialize()` creates `new PendingDispatchRegistry()` and passes to EventCapture and ToolCapture
- [ ] `ensureSessionReady()` checks `this.pendingRegistry?.has(sessionID)` as Gate 3
- [ ] `EventCapture.handleSessionCreated()` checks `this.pendingRegistry?.has(sessionID)` as Gate 3
- [ ] `EventCapture` constructor accepts `pendingRegistry?: PendingDispatchRegistry`
- [ ] `ToolCapture` constructor accepts `pendingRegistry?: PendingDispatchRegistry` (plumbing only)
- [ ] Gate order is strictly: SDK → HierarchyIndex → PendingDispatchRegistry → fallback MAIN
- [ ] `npx vitest run tests/features/session-tracker/` — all existing tests continue to pass (≥256)
- [ ] grep confirms: `grep -n "pendingRegistry" src/features/session-tracker/index.ts` shows gate 3 usage
- [ ] grep confirms: `grep -n "pendingRegistry" src/features/session-tracker/capture/event-capture.ts` shows gate 3 usage
  </acceptance_criteria>

  <done>Three-gate classification is wired: SessionTracker.ensureSessionReady and EventCapture.handleSessionCreated both check PendingDispatchRegistry as Gate 3 before creating directories. EventCapture idle/deleted/error handlers also use Gate 3. ToolCapture plumbing is ready for Plan 02-03.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Memory → Memory | PendingDispatchRegistry is in-memory only; no persistence means no file-based tampering |
| Plugin init → Registry | Registry created at plugin init; only SessionTracker methods access it |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Spoofing | PendingDispatchRegistry.add() | mitigate | Only SessionTracker internal methods call add(); no external accessor exposed. callID is validated as string before registry entry. |
| T-02-02 | Tampering | PendingDispatchRegistry entries | mitigate | In-memory Map with single-threaded access (Node.js event loop). No disk persistence means no file-based tampering. |
| T-02-03 | Denial of Service | Stale entry accumulation | mitigate | `cleanupStale()` auto-purges entries >30s on every `has()`/`get()` call. Max stale window is 30s with O(n) cleanup. |
| T-02-04 | Information Disclosure | subagentType storage | accept | subagentType is an agent name string (not secret). In-memory only, cleared on PostToolUse. |
</threat_model>

<verification>
```bash
# Full type check
npm run typecheck

# Scoped tests for session-tracker
npx vitest run tests/features/session-tracker/

# Verify Gate 3 presence in source
grep -n "pendingRegistry" src/features/session-tracker/index.ts
grep -n "pendingRegistry" src/features/session-tracker/capture/event-capture.ts
```
</verification>

<success_criteria>
1. `PendingDispatchRegistry` class exists with add/has/get/remove/cleanupStale methods
2. `SessionTracker.ensureSessionReady()` checks Gate 3 before directory creation
3. `EventCapture.handleSessionCreated()` checks Gate 3 before directory creation
4. All 256+ existing tests continue to pass
5. TypeScript compiles cleanly (`npm run typecheck`)
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-01-SUMMARY.md`
</output>
