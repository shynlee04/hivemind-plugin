# Real SDK Session Flow — Investigation Report

**Researched:** 2026-05-31
**Domain:** OpenCode SDK session lifecycle, delegation tracking, and persistence
**Confidence:** HIGH

## Summary

This investigation traces how real OpenCode SDK session IDs (`ses_xxx`) flow through the Hivemind harness — from SDK session creation, through hooks, into session-tracker, delegations.json, and state/session-continuity.json.

**Primary finding: The harness has TWO parallel session-tracking systems, but only ONE of them (session-tracker) actually contains real `ses_` session IDs.** The delegation system (`delegations.json` + `state/session-continuity.json`) stores only test artifacts and placeholder values — zero real production session IDs.

**This means a connector/consumer that queries delegations.json or state/session-continuity.json to answer "what sessions exist?" will get an empty or garbage answer.** The real data lives in `.hivemind/session-tracker/`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session creation | OpenCode SDK | Hivemind hooks | SDK `session.create()` returns `ses_xxx` IDs |
| Event capture | Hivemind hooks → SessionTracker | — | `event` hook receives real session IDs from SDK |
| Delegation tracking | DelegationManager (in-memory) + delegations.json | — | UUID delegation IDs, fake session references |
| Session continuity | state/session-continuity.json | — | Mostly test data, not production hooks |
| Session hierarchy | SessionTracker hierarchy-manifest.json | — | Real parent-child with ses_ IDs |
| Message/tool capture | SessionTracker | — | Real ses_ IDs from tool.execute.after hook |

---

## Standard Stack

### SDK Session API (`src/shared/session-api.ts`)

The `assertValidSessionID` function (line 30-42) enforces production session IDs must start with `ses`:

```typescript
if (!trimmed.startsWith("ses")) {
    throw new Error(`[Harness] Invalid ${label} '${sessionID}'. Expected an OpenCode session ID starting with 'ses'.`)
}
```

**Test bypass:** When `NODE_ENV === "test"`, IDs matching `/^(child|parent)-/` are also allowed (line 32-34). This is how fake IDs like `parent-1`, `child-e2e` pass validation in tests.

### Session ID Sources

| Source | Where Created | ID Format | Real? |
|--------|--------------|-----------|-------|
| SDK `session.create()` | OpenCode server | `ses_18afc31afffeHS6izacr2YYm3a` | ✅ Real |
| Delegation UUID | `crypto.randomUUID()` | `94f98097-ee4a-4f55-ad0b-23c1bcd7538d` | ⚠️ UUID, not session ID |
| Delegation timestamp ID | `dt-${Date.now()}-${random}` | `dt-1780219189361-ct4u6b` | ⚠️ synthetic, not SDK |
| Test placeholders | Test code | `parent-1`, `child-e2e`, `ses-parent-monitor-fail` | ❌ Fake |

---

## How REAL Session IDs Are Created

### 1. `task` tool delegation

When a user runs the `task` tool:

1. The OpenCode SDK's native `task` tool calls `session.create()` internally
2. The SDK returns a real `ses_xxx` ID for the child session
3. The harness does NOT intercept `task` tool directly — it's a native SDK tool
4. The harness hooks (`event`, `tool.execute.after`) fire with the real session ID
5. **SessionTracker captures it via event hooks** (see below)

### 2. `delegate-task` tool delegation

When `delegate-task` runs (via `src/tools/delegation/delegate-task.ts`):

1. Tool receives `context.sessionID` from SDK — this IS a real `ses_xxx` ID
2. `parentSessionId` is set to this real ID (or overridden by `stackOnSessionId`) — line 51-72
3. Calls `coordinator.dispatch()` → eventually `spawnDelegatedSession()` → `createSession()` — uses `client.session.create()` which returns a real `ses_xxx` child ID
4. The delegation record stores `parentSessionId` (real ses_) and `childSessionId` (real ses_)
5. **But: the delegation record's `id` is `crypto.randomUUID()` — NOT a session ID**

**However:** The `delegations.json` file on disk at `.hivemind/state/delegations.json` currently contains **ZERO real session IDs**. This is because the file has never been populated by a real production run — all 35 records are test artifacts with fake IDs.

### 3. Slash command execution

When a slash command runs (via `execute-slash-command` tool):

1. The SDK creates a sub-session with a real `ses_xxx` ID
2. The `event` hook fires with `session.created` and the real ID
3. SessionTracker captures it

---

## How SessionTracker Captures Real Sessions

### Hook Wiring (from `src/hooks/observers/session-tracker-consumer.ts`)

The `createSessionTrackerConsumer` function wires the `event` hook to `sessionTracker.handleSessionEvent()`:

```typescript
const sessionID = getEventSessionID(ev) || ""
if (sessionID) {
    await deps.sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
}
```

The `getEventSessionID()` function (from `session-api.ts` lines 280-290) extracts the session ID from the SDK event payload by probing multiple known key paths:

```typescript
export function getEventSessionID(event: unknown): string | undefined {
    // Checks: properties.sessionID, properties.sessionId, 
    //         properties.part.sessionID, properties.part.sessionId,
    //         properties.info.sessionID, properties.info.sessionId,
    //         sessionID, sessionId
}
```

**This is how REAL `ses_xxx` IDs enter the system** — via the SDK event payload structure.

### What SessionTracker Captures with Real IDs

| Data Type | Where | Format |
|-----------|-------|--------|
| Session lifecycle | `session.created`, `.idle`, `.deleted`, `.error` | Real `ses_xxx` |
| Chat messages | `chat.message` hook | Real `ses_xxx` |
| Tool executions | `tool.execute.after` hook | Real `ses_xxx` |
| Child delegations | `handleToolExecuteBefore()` | Real `ses_xxx` parent + child |
| Hierarchy | hierarchy-manifest.json | Real `ses_xxx` |

### SessionTracker Disk State (Verified)

| File | Sessions | Real IDs? |
|------|----------|-----------|
| `project-continuity.json` | **117 sessions** | ✅ ALL real `ses_xxx` |
| Per-session `ses_xxx/session-continuity.json` | Per-session | ✅ Real |
| Per-session `ses_xxx/*.json` | Child records | ✅ Real |
| Per-session `ses_xxx/*.md` | Full session transcripts | ✅ Real |

Example from hierarchy-manifest.json:
```json
"ses_18aea7437ffeq9t8BNqNPsf6gV": {
    "depth": 1,
    "status": "completed",
    "delegatedBy": "gsd-planner",
    "children": {
        "ses_18ae4049affexNsaBBOgnotZfO": {
            "depth": 2, "status": "completed",
            "delegatedBy": "gsd-planner"
        }
    }
}
```

---

## delegations.json — Full Analysis

### Where Data Comes From

Delegation records are created in `src/coordination/delegation/manager-runtime.ts` (line 209-223):

```typescript
const delegation: Delegation = {
    id: crypto.randomUUID(),            // UUID — NOT a session ID
    parentSessionId: params.parentSessionId,  // Real ses_xxx (from SDK context)
    childSessionId: child.childSessionId,     // Real ses_xxx (from SDK createSession)
    agent: agent.name,
    status: "dispatched",
    // ...
}
```

**In production, this SHOULD store real `ses_xxx` IDs for both parent and child.**

### Current Disk State

| Metric | Value |
|--------|-------|
| Total records | 35 |
| Real `ses_xxx` parent IDs | **0** |
| Real `ses_xxx` child IDs | **0** |
| Fake parent IDs | `parent-1`, `ses-parent-monitor-fail`, `ses-parent-monitor-notify`, `ses-parent-sdk`, `ses-parent-session` |
| Fake child IDs | `child-e2e`, `child-integration`, `child-prompt-fail-monitor`, `child-real-queue`, `child-real-sdk`, `child-ses-123` |

**Conclusion:** The delegations.json file on disk has **never been populated by a real production run**. All records are from test suites (`tests/`).

### Can delegations.json Be Replaced by SessionTracker?

**YES — for session tracking purposes.** SessionTracker already captures:
- Parent-child relationships with real `ses_xxx` IDs (hierarchy-manifest.json)
- Delegation agent names (delegatedBy field)
- Child session status (completed/active)
- Timestamps

**Data in delegations.json that SessionTracker DOES NOT have:**
- Delegation UUID (the `id` field — used as a reference key)
- `queueKey` — concurrency queue identifier
- `nestingDepth` — numeric delegation depth
- `executionMode` — sdk/pty/headless
- `surface` — agent-delegation/command-process
- `recoveryGuarantee` — resumability classification
- `stablePollCount` / `lastMessageCount` — polling metadata
- Safety ceiling and grace period timers

**These are runtime operation concerns** (concurrency, polling, recovery), not session state concerns. They belong in the delegation system, not in session tracking. But they don't overlap with what SessionTracker stores.

---

## state/session-continuity.json — Full Analysis

### Where Data Comes From

The `recordSessionContinuity()` function (in `src/task-management/continuity/index.ts`) is called from:

1. **Production:** Only 2 places
   - `src/plugin.ts:237` — deferred pending notification recovery (during startup)
   - `src/coordination/completion/notification-handler.ts:229` — queueing delegation notifications

2. **Test code:** >30 places across test files

### Producing hooks vs. this store

**Critical gap: NO production hook writes to `recordSessionContinuity()` on every session event.** The hooks (`event`, `chat.message`, `tool.execute.after`) route directly to SessionTracker, NOT to the continuity store. The continuity store is only populated by:
- Notification delivery recovery (deferred queueing)
- Test fixtures

### Current Disk State

| Metric | Value |
|--------|-------|
| Total sessions | 18 |
| Real `ses_xxx` format | 6 — but ALL are test names: `ses_cleanup`, `ses_concurrent`, `ses_parent`, `ses_parent2`, `ses_parent_002`, `ses_recovery` |
| Plain fake | 12 — `parent-1`, `parent-c`, `parent-with-model`, `replay-test-parent`, `ses-parent-*` |

**Conclusion:** `state/session-continuity.json` has **never been populated by a production hook path with real session data**. It contains only:
- Test fixture data
- Deferred notification recovery records (with `parentSessionId` values from the notification system, which may be real `ses_xxx` if the system ever receives real data)

### Can state/session-continuity.json Be Replaced by SessionTracker?

**YES — completely.** SessionTracker already captures:
- Session lifecycle status (active/idle/deleted)
- Per-session message and tool data
- Hierarchy and delegation relationships

**Data in session-continuity.json that SessionTracker does NOT have:**
- `pendingNotifications` queue (delegation results queued for parent delivery)
- `delegationPacket` structure (phase-specific delegation intent metadata)
- `compactionCheckpoint` state (pre/post compaction data)
- `toolProfile` / `promptParams` (initial session configuration)

**These are specialized metadata** for delegation notification delivery and session compaction — they don't overlap with SessionTracker's scope.

---

## Key Questions Answered

### Q1: Where do `parentSessionId` and `childSessionId` come from in `delegate-task`?

**The flow in production:**

```
delegate-task tool executes
  → context.sessionID from OpenCode SDK = REAL ses_xxx (parent)
  → spawnDelegatedSession() → client.session.create() = REAL ses_xxx (child)
  → DelegationManager registers record with both real IDs
  → persistDelegations() writes to delegations.json
```

**The flow in tests:**
Tests bypass the SDK entirely, passing fake IDs like `parent-1`, `child-e2e`. These are the ONLY records currently on disk because the system has not been exercised through real hooks.

**Verdict:** `parentSessionId` and `childSessionId` in delegations.json **should** be real `ses_xxx` IDs in production. The current file has zero real IDs because it contains only test artifacts.

### Q2: Does SessionTracker already capture ALL data that delegations.json captures?

**No — but the overlap is minimal:**

| Data | SessionTracker | delegations.json |
|------|---------------|-----------------|
| Parent session ID (`ses_xxx`) | ✅ hierarchy + project-continuity | ✅ should be, currently isn't |
| Child session ID (`ses_xxx`) | ✅ child files | ✅ should be, currently isn't |
| Delegation UUID | ❌ | ✅ |
| Queue key | ❌ | ✅ |
| Nesting depth | ✅ (inferred from hierarchy) | ✅ (explicit field) |
| Status | ✅ (active/completed/error) | ✅ (dispatched/running/error/timeout) |
| Agent name | ✅ (delegatedBy) | ✅ |
| Execution mode | ❌ | ✅ |
| Polling metadata | ❌ | ✅ |
| Timers | ❌ | ✅ |

**Verdict:** SessionTracker captures session *knowledge* (who, what, when). delegations.json captures delegation *operations* (how, queue, recovery). They serve different purposes but share some overlapping data.

### Q3: Is there ANY data in delegations.json that SessionTracker doesn't have?

**Yes:** Delegation UUID, queueKey, executionMode, surface, recoveryGuarantee, polling metadata, timer state, prompt text.

### Q4: Is there ANY data in state/session-continuity.json that SessionTracker doesn't have?

**Yes:** pendingNotifications, delegationPacket, compactionCheckpoint, toolProfile, promptParams.

### Q5: Can delegations.json be REPLACED by SessionTracker queries?

**For session state discovery: YES.** If you want to answer "what sessions exist and what delegated them?", SessionTracker is the correct source.

**For delegation operation state: NO.** The runtime needs delegations.json for concurrency, polling, safety ceilings, and recovery. These are orthogonal to session knowledge.

### Q6: Can state/session-continuity.json be REPLACED by SessionTracker queries?

**For session lifecycle knowledge: YES.** SessionTracker tracks every session.created, .idle, .deleted, .error event.

**For delegation notification delivery: NO.** The continuity store's pendingNotifications queue survives compaction/restart. SessionTracker doesn't track notification delivery state.

---

## Data Flow Diagram

```
OpenCode SDK
  │
  ├── session.create() → real ses_xxx
  │     └── spawnDelegatedSession() → child session created
  │           ├── DelegationManager stores in delegations.json (real ses_!)
  │           └── event hook fires session.created
  │
  ├── event hook (session.created/idle/deleted/error)
  │     └── SessionTrackerConsumer → SessionTracker.handleSessionEvent()
  │           ├── EventCapture → handlers (session-created, idle, deleted, error)
  │           │     └── sessionWriter / childWriter → .hivemind/session-tracker/
  │           └── ProjectIndexWriter → project-continuity.json (real ses_xxx)
  │
  ├── chat.message hook
  │     └── SessionTracker.handleChatMessage()
  │           ├── SessionRouter (classify parent/child)
  │           └── MessageCapture → sessionWriter (real ses_xxx)
  │
  ├── tool.execute.after hook
  │     └── SessionTracker.handleToolExecuteAfter()
  │           ├── ToolCapture → sessionWriter (real ses_xxx)
  │           └── ToolDelegation → childWriter / hierarchy (real ses_xxx)
  │
  └── tool.execute.before hook
        └── SessionTracker.handleToolExecuteBefore()
              └── ToolDelegation (pending dispatch registry)
```

---

## Common Pitfalls

### Pitfall 1: Confusing delegation UUID with session ID

**What goes wrong:** Code reads `delegations.json`, finds `id: "94f98097-ee4a..."` and assumes this is a session ID.

**Why it happens:** The field is called `id` on the `Delegation` type, but it's a `crypto.randomUUID()`, not an SDK session ID.

**How to avoid:** Always check `.startsWith("ses")` before treating an ID as a session ID. The `assertValidSessionID()` function already does this.

### Pitfall 2: Using state/session-continuity.json for session discovery

**What goes wrong:** A tool queries `state/session-continuity.json` to find active sessions and gets 0-18 mostly fake records.

**Why it happens:** This store is NOT populated by hooks. It's only updated by the notification delivery system and test code.

**How to avoid:** Use `.hivemind/session-tracker/project-continuity.json` for session discovery. It has 117 real sessions.

### Pitfall 3: Assuming delegations.json has real data

**What goes wrong:** A connector reads delegations.json expecting to find the last 50 delegations with real session IDs, and gets only test artifacts.

**Why it happens:** The file has never been populated by real production delegation flow.

**How to avoid:** Verify the contents of delegations.json before relying on it. The delegation system works correctly in production (the code paths use real IDs), but the persisted file may need a real run to populate.

---

## Common Pitfalls

### Pitfall 1: Confusing delegation UUID with session ID

**What goes wrong:** Code reads `delegations.json`, finds `id: "94f98097-ee4a..."` and assumes this is a session ID.

**Why it happens:** The field is called `id` on the `Delegation` type, but it's a `crypto.randomUUID()`, not an SDK session ID.

**How to avoid:** Always check `.startsWith("ses")` before treating an ID as a session ID.

### Pitfall 2: Using state/session-continuity.json for session discovery

**What goes wrong:** A tool queries `state/session-continuity.json` to find active sessions and gets 0-18 mostly fake records.

**Why it happens:** This store is NOT populated by hooks. It's only updated by the notification delivery system and test code.

**How to avoid:** Use `.hivemind/session-tracker/project-continuity.json` for session discovery. It has 117 real sessions.

### Pitfall 3: Assuming delegations.json has real data

**What goes wrong:** A connector reads delegations.json expecting to find the last 50 delegations with real session IDs, and gets only test artifacts.

**Why it happens:** The file has never been populated by real production delegation flows (e.g., opening the harness in an IDE and running delegate-task). All current records are from test suites.

**How to avoid:** The code paths are correct — they will store real `ses_xxx` IDs once exercised in production. The file just needs a real run.

---

## Code Examples

### Session ID extraction from SDK events

```typescript
// Source: src/shared/session-api.ts
export function getEventSessionID(event: unknown): string | undefined {
  const explicitSessionID = getExplicitEventSessionID(event)
  if (isMessageScopedEvent(event)) {
    return explicitSessionID
  }
  return (
    getSessionID(getEventSessionInfo(event)) ??
    explicitSessionID
  )
}
// Probe keys: properties.sessionID, properties.sessionId,
//             properties.part.sessionID, properties.info.sessionID,
//             sessionID, sessionId, info.id, info.sessionID
```

### Session creation returns real ses_xxx

```typescript
// Source: src/shared/session-api.ts
export async function createSession(client: OpenCodeClient, opts: CreateSessionOptions): Promise<SessionRecord> {
  return unwrapData(await client.session.create({
    body: { ...body, ...(body.parentID ? { parentID: assertValidSessionID(body.parentID) } : {}) },
    ...(directory ? { query: { directory } } : {}),
  }))
}
// The SDK's session.create() always returns a real ses_xxx ID
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `delegations.json` on disk contains only test data | delegations.json Analysis | LOW — verified by reading the file directly; zero real `ses_` IDs |
| A2 | `state/session-continuity.json` on disk contains only test data + notification recovery | state/session-continuity.json Analysis | LOW — verified by reading the file directly |
| A3 | Hook-to-session-tracker wiring produces real `ses_` IDs | How SessionTracker Captures Real Sessions | LOW — verified by reading `project-continuity.json` with 117 real sessions |
| A4 | The delegation code path produces real `ses_` IDs for parentSessionId and childSessionId | Where Data Comes From in manager-runtime.ts | MEDIUM — verified code trace, but no production disk evidence since file is all test data |

---

## Sources

### Primary (HIGH confidence)
- Actual on-disk data: `.hivemind/session-tracker/project-continuity.json` (117 real sessions)
- Actual on-disk data: `.hivemind/state/delegations.json` (35 records, 0 real ses_)
- Actual on-disk data: `.hivemind/state/session-continuity.json` (18 sessions, 0 real ses_)
- Session hierarchy: `.hivemind/session-tracker/ses_18afc31afffeHS6izacr2YYm3a/hierarchy-manifest.json`
- Source code: `src/shared/session-api.ts` — `assertValidSessionID()` enforcement
- Source code: `src/coordination/delegation/manager-runtime.ts` — delegation record creation
- Source code: `src/features/session-tracker/` — full module, 40+ files

### Secondary (MEDIUM confidence)
- Source code: `src/task-management/continuity/index.ts` — `recordSessionContinuity()` callers
- Source code: `src/hooks/observers/session-tracker-consumer.ts` — hook wiring
- Source code: `src/tools/delegation/delegate-task.ts` — parentSessionId from SDK context

---

## Metadata

**Confidence breakdown:**
- SessionTracker data: **HIGH** — verified by reading actual disk files
- delegations.json data: **HIGH** — verified by reading actual disk files
- session-continuity.json data: **HIGH** — verified by reading actual disk files
- Code path trace: **MEDIUM** — code reads show correct implementation, but no production disk evidence

**Research date:** 2026-05-31
**Valid until:** Stable — session ID format is determined by OpenCode SDK, not Hivemind
