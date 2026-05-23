# Investigation: delegate-task SDK Dispatch Child Sessions Invisible to Session-Tracker

## Summary

**Two gaps prevent delegate-task SDK-dispatched child sessions from being tracked in session-tracker.** The primary gap is a **classification filter** in `tool-before-guard.ts` that only dispatches to session-tracker's proactive child discovery when the tool name is `"task"`. Since delegate-task bypasses the native `task` tool, the session-tracker receives **no `PendingDispatchRegistry` entry**, **no proactive polling**, and relies solely on the `session.created` event hook — which may not fire reliably for SDK-created sessions or may arrive before the SDK has fully initialized the session's metadata.

## Phase 1: Dispatch Path Trace (delegate-task → child session)

### [1] delegate-task tool → coordinator dispatch
- `src/tools/delegation/delegate-task.ts:63` — calls `coordinator.dispatch()` with `{ agent, parentSessionId, prompt }`
- **Two dispatch paths exist:**
  - **Path A (v2 coordinator):** `DelegationManager.dispatch()` → `DelegationCoordinator.dispatch()` via `this.options.coordinator` (line 74)
  - **Path B (legacy runtime):** `DelegationManager.dispatch()` → `RuntimeDelegationManager.dispatch()` (line 75 when no coordinator)

### [2] DelegationCoordinator.dispatch() (v2 path)
- `src/coordination/delegation/coordinator.ts:75-156` — runs preflight, creates delegation record, calls `childSessionStarter.start()` (line 113-115)
- Creates delegation record at line 78: `this.createRecord(delegationId, params, preflight.queueKey)` — uses `childSessionId: delegationId` as **placeholder** (line 457)
- `childSessionStarter.start()` at `sdk-child-session-starter.ts:23-27` calls `createSession(client, { parentID: params.parentSessionId, title, directory })` — creates real SDK child session
- Line 124: `this.attachChildSession(delegationId, child.childSessionId)` — updates delegation record with real child session ID

### [3] RuntimeDelegationManager.dispatch() (legacy path)
- `src/coordination/delegation/manager-runtime.ts:201-203` — calls `spawnDelegatedSession()` which is `session-creator.ts:19-23` → calls `createSession(client, { parentID: parentSessionId, title, directory })`
- Creates delegation record at line 206-221 with real `childSessionId`
- Line 241: `await sendPromptAsync(this.client, delegation.childSessionId, promptBody)` — sends prompt to child session

### [4] SDK session creation
- Both paths call `createSession()` in `src/shared/session-api.ts:44-55`:
  ```typescript
  export async function createSession(client, opts) {
    const request = { body: { ...body, parentID }, ...(directory ? { query: { directory } } : {}) }
    return unwrapData(await client.session.create(request))
  }
  ```
- This calls `client.session.create()` on the OpenCode SDK which should trigger `session.created` event

## Phase 2: Session-Tracker Observation Path

### [1] Event hook wiring (plugin.ts)
- `src/plugin.ts:365-377` — creates `consumeSessionTrackerFact` via `createSessionTrackerConsumer()`
- `src/plugin.ts:385` — injects `consumeSessionTrackerFact` into `eventObservers` array passed to `createCoreHooks()`
- Routes `event` hook events → `sessionTracker.handleSessionEvent()`

### [2] SessionTracker.handleSessionEvent()
- `src/features/session-tracker/index.ts:134-182` — delegates to `eventCapture.handleSessionEvent()`
- Event capture: `src/features/session-tracker/capture/event-capture.ts:91-149`

### [3] EventCapture.handleSessionCreated() — child classification
- `src/features/session-tracker/capture/event-capture.ts:160-275`
- **Gate 0 (line 170-181):** Checks `pendingRegistry.getAnyActiveEntry()` — relies on `handleToolExecuteBefore()` having registered a pending dispatch
- **Gate 1 (line 186-199):** Calls `getSession(this.client, sessionID)` to get `parentID` from SDK — retries once with 100ms delay
- **Gate 2 (line 213-221):** Checks `hierarchyIndex.isChild(sessionID)` — in-memory index from prior registrations
- **Gate 3 (line 227-235):** Checks `pendingRegistry.has(sessionID)` — direct childID lookup
- If any gate identifies as child → `writeImmediateChildFile()` → creates `.json` → updates `hierarchyIndex` → increments `projectIndexWriter.childCount`

### [4] Tool execute.before hook — proactive child discovery
- `src/hooks/transforms/tool-before-guard.ts:30-67` — **CRITICAL**: line 40: `if (toolName === "task")`
- Only dispatches to `sessionTracker.handleToolExecuteBefore()` for native `task` tool
- `handleToolExecuteBefore()` → registers in `PendingDispatchRegistry` (Gate 3) → starts `pollForChildSessions()` (5 attempts, 200ms interval, `client.session.children()`)

### [5] Session-tracker tool queries
- `src/tools/hivemind/session-tracker.ts:186-225` — `list-sessions` reads `project-continuity.json` or falls back to directory scan
- `src/tools/hivemind/hivemind-session-view.ts:91-127` — `buildUnifiedView()` reads per-session `session-continuity.json`
- `childCount` comes from `project-continuity.json` (via `ProjectIndexWriter.incrementChildCount()`) or per-session `session-continuity.json` (via `SessionIndexWriter.addChild()`)

## Phase 3: Root Cause Analysis

### Root Cause 1 (PRIMARY): `createToolBeforeGuard` only detects native `task` tool
- **File:** `src/hooks/transforms/tool-before-guard.ts:40`
- **Code:** `if (toolName === "task")`
- **Problem:** When an agent calls `delegate-task`, the tool name is `"delegate-task"`, not `"task"`. The guard skips entirely, so:
  1. `sessionTracker.handleToolExecuteBefore()` is **never called**
  2. `PendingDispatchRegistry.add()` is **never called** — Gate 0 and Gate 3 in EventCapture get no entry
  3. `pollForChildSessions()` is **never started** — proactive discovery via `session.children()` never runs
- **Impact:** The session-tracker must rely solely on the `session.created` event hook + SDK parentID (Gate 1) for delegate-task child sessions

### Root Cause 2 (CONFIRMATION-DEPENDENT): `session.created` may not fire for SDK-created sessions
- **File:** `src/coordination/spawner/session-creator.ts:19-23` (creates via SDK)
- **Problem:** It is unconfirmed whether OpenCode emits `session.created` lifecycle events for sessions created via `client.session.create()` (SDK path) vs. the native `task` tool (OpenCode internal path). If SDK-created sessions do not emit `session.created`, the session-tracker's event hook never fires, and the child session is **completely invisible**.
- **Even if `session.created` does fire**, there is a race: the event may fire synchronously during `client.session.create()`, before the session is fully initialized. `EventCapture.handleSessionCreated()` then calls `getSession()` to get `parentID` (line 188) — if the SDK hasn't finished creating the session, this returns incomplete data.

### Root Cause 3 (ARCHITECTURAL): EventCapture uses SDK getSession() instead of event payload
- **File:** `src/features/session-tracker/capture/event-capture.ts:186-199`
- **Problem:** The `session.created` event payload already contains session metadata (including `parentID`), but `EventCapture.handleSessionCreated()` ignores the event payload and makes a separate `getSession()` SDK call. This creates an unnecessary race condition. The `createSessionIsMainObserver` in `event-observers.ts:100-134` correctly extracts `parentID` from the event payload using `getEventParentID(event)`, but `EventCapture` does not use this information.
- **Impact:** Even when `session.created` fires correctly, the additional SDK `getSession()` call may fail or return stale data due to timing, especially under load or rapid delegation.

### Root Cause 4 (ARCHITECTURAL): Two separate child session ID spaces
- **File:** `src/coordination/delegation/coordinator.ts:457` vs `src/coordination/spawner/session-creator.ts:25`
- **Problem:** The `DelegationCoordinator` initially creates a delegation record with `childSessionId: delegationId` (a synthetic ID like `dt-1716512345678-abc123`), then later replaces it with the real SDK child session ID (like `ses_xxx`) via `attachChildSession()`. If the `session.created` event fires between these two steps, the event captures `childSessionId` as the synthetic ID, not the real one.
- **Impact:** The `PendingDispatchRegistry` (if it were wired) would contain the wrong session ID, and `EventCapture` would never match the `session.created` event to a pending dispatch.

## Phase 4: Classification

### Classification Table

| Root Cause | Type | Severity | Impact |
|------------|------|----------|--------|
| RC1: `createToolBeforeGuard` only detects `"task"` | **MISSING_HOOK** | CRITICAL | No proactive discovery, no pending registry entry, no polling for delegate-task |
| RC2: `session.created` may not fire for SDK sessions | **TIMING** | CRITICAL | Child sessions completely invisible if no `session.created` fires |
| RC3: EventCapture uses SDK `getSession()` instead of event payload | **MISSING_REGISTRATION** | MODERATE | Race condition on `parentID` retrieval adds failure point |
| RC4: Dual session ID space (synthetic → real SDK ID) | **ARCHITECTURAL** | LOW | Non-issue for current code (no pending registry), but would cause mismatches if wired |

### Overall Assessment

The **root cause chain** is:

1. `createToolBeforeGuard` (tool-before-guard.ts:40) skips `delegate-task` → no pending dispatch entry
2. No pending entry → `EventCapture` has no Gate 0/3 match for `session.created` of delegate-task child
3. `EventCapture` must fall back to Gate 1 (SDK `getSession()` for `parentID`) — fragile and racy
4. If `session.created` doesn't fire, or `getSession()` returns before session is initialized → child is **permanently invisible**

**Fix scope:**
- `src/hooks/transforms/tool-before-guard.ts` — add `delegate-task` detection alongside `"task"`
- `src/features/session-tracker/capture/event-capture.ts` — extract `parentID` from event payload (like `event-observers.ts` does) instead of relying solely on SDK `getSession()`
- `src/coordination/delegation/sdk-child-session-starter.ts` — optionally call back into session-tracker after successful session creation

**Specialist hint:** `typescript` — TypeScript source investigation with async/await concurrency patterns
