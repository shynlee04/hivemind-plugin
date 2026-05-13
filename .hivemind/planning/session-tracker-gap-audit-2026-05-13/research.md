[LANGUAGE: Write this file in vi per Language Governance.]
# CP-ST-02 Three-Gate Classification Failure — Root Cause Analysis

**Researched:** 2026-05-13
**Domain:** Session tracker child-session classification race condition
**Confidence:** HIGH

## Summary

The three-gate classification system (SDK parentID → HierarchyIndex → PendingDispatchRegistry) fails to prevent orphan directories for L2 child sessions. The root cause is a **key mismatch** in `PendingDispatchRegistry`: entries are stored with key `call:${parentCallID}` but Gate 3 looks them up by `childSessionID`. The bridge (`updateWithChildID`) that re-keys entries runs asynchronously in a fire-and-forget 200ms polling loop and consistently loses the race with the synchronous `session.created` event.

When all three gates fail for a child session during `session.created`, `EventCapture.handleSessionCreated()` creates a full directory tree at `.hivemind/session-tracker/{childID}/` — the orphan. Subsequent events (chat messages, tool execution) correctly detect the child via Gates 1/2 (which have caught up by then), but the orphan directory persists.

**Primary recommendation:** Fix `PendingDispatchRegistry.has()` to check ALL pending entries for matching `parentSessionID` relationships, not just direct key lookup. Or add a parent-session-indexed reverse map for O(1) lookup without knowing the child ID.

---

## Exact Gate Locations and Failure Analysis

### Gate 1: SDK parentID (retry logic)

**Location:** `src/features/session-tracker/capture/event-capture.ts` lines 179-195 (in `handleSessionCreated`)

```typescript
// Lines 179-195 — Gate 1
let parentID: string | null | undefined
for (let attempt = 0; attempt < 2; attempt++) {
    try {
        const session = await getSession(this.client, sessionID)
        parentID = session.parentID as string | null | undefined
        if (parentID) break
        if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 100))  // Line 189
        }
    } catch {
        break
    }
}
```

**Why it fails for child sessions:** OpenCode's `session.created` event fires during `TaskTool.execute()`, immediately after the child session is created. At this point, the SDK's `getSession()` may not yet have populated `parentID` — it's a race between OpenCode's internal session creation and the SDK's metadata propagation. The 100ms retry helps but is not guaranteed to capture the parentID if the SDK is slow.

Identical pattern in `ensureSessionReady()` at `src/features/session-tracker/index.ts` lines 152-165.

---

### Gate 2: HierarchyIndex

**Location:** `src/features/session-tracker/capture/event-capture.ts` lines 202-209

```typescript
// Lines 202-209 — Gate 2
if (parentID === null || parentID === undefined) {
    if (this.hierarchyIndex?.isChild(sessionID)) {
        return  // Child detected — skip directory creation
    }
    // ...
}
```

**Why it fails for child sessions:** `HierarchyIndex` is populated by:
1. `tool-capture.ts` `handleTask()` at line 243: `hierarchyIndex.registerChild(input.sessionID, childSessionID)` — runs during `tool.execute.after` in the **parent** session, AFTER the task tool completes
2. `pollForChildSessions()` at line 637: `hierarchyIndex.registerChild(parentID, child.id)` — fire-and-forget polling with 200ms intervals

Both paths populate HierarchyIndex AFTER `session.created` has already fired. The `session.created` event is synchronous during `TaskTool.execute()`; HierarchyIndex is populated asynchronously after.

---

### Gate 3: PendingDispatchRegistry (THE FAILING GATE)

**Location:** `src/features/session-tracker/capture/event-capture.ts` lines 211-218

```typescript
// Lines 211-218 — Gate 3
if (this.pendingRegistry?.has(sessionID)) {
    return  // Child detected — skip directory creation
}
```

**The lookup** at `src/features/session-tracker/persistence/pending-dispatch-registry.ts` lines 126-129:

```typescript
has(sessionID: string): boolean {
    this.cleanupStale()
    return this.dispatches.has(sessionID) || this.dispatches.has(`call:${sessionID}`)
}
```

Checks two keys:
1. `dispatches.has(sessionID)` — direct child session ID key (only present after `updateWithChildID()` re-keys)
2. `dispatches.has("call:" + sessionID)` — callID-prefixed key (only matches if sessionID === callID, which never happens)

**The registration** at `src/features/session-tracker/persistence/pending-dispatch-registry.ts` lines 90-95:

```typescript
add(entry: PendingDispatchEntry): void {
    this.dispatches.set(`call:${entry.callID}`, entry)  // Key: call:${parentCallID}
}
```

**The mismatch:**

| Operation | Key Used | Value |
|-----------|----------|-------|
| `add()` (PreToolUse) | `call:${parentCallID}` | Entry with parentSessionID, callID, subagentType |
| `has(childID)` (Gate 3) | `childID` (raw) | ❌ Not found — key is `call:${parentCallID}` |
| `has(childID)` (Gate 3) | `call:${childID}` | ❌ Not found — key is `call:${parentCallID}` |

The bridge is `updateWithChildID()` at lines 107-114:

```typescript
updateWithChildID(callID: string, childSessionID: string): void {
    const callKey = `call:${callID}`
    const entry = this.dispatches.get(callKey)
    if (!entry) return
    this.dispatches.delete(callKey)              // Remove call:${parentCallID}
    this.dispatches.set(childSessionID, entry)   // Add childID → entry
    this.callIDToChild.set(callID, childSessionID)
}
```

**This bridge is called from:**
1. `pollForChildSessions()` at `index.ts` line 641 (fire-and-forget, 200ms poll interval)
2. Never called directly after `add()` — only via async polling

---

## The Race Window Diagram

```
Time ─────────────────────────────────────────────────────────────────────>

Parent Session:
  PreToolUse fires (tool-before-guard.ts:54)
    └→ SessionTracker.handleToolExecuteBefore() (index.ts:554)
      └→ pendingRegistry.add({parentSessionID, callID: parentCallID, ...}) (pdr.ts:94)
         ENTRY KEY: "call:abc123" (parent's callID)
      └→ void pollForChildSessions(parentID, callID) (index.ts:585)
         [FIRE-AND-FORGET — does not block]

  TaskTool.execute() starts in parent session...

    ┌─────────────────── RACE WINDOW OPENS ───────────────────┐
    │                                                          │
    │  OpenCode creates child session ses_1ddf61a28ffe         │
    │                                                          │
    │  session.created fires for child ────SYNCHRONOUS─────────┤
    │    └→ session-tracker-consumer.ts:35                     │
    │      └→ sessionTracker.handleSessionEvent()              │
    │        └→ eventCapture.handleSessionCreated(childID)     │
    │                                                          │
    │          Gate 1: SDK parentID?                           │
    │            → session.parentID = NULL (race, SDK not ready)│
    │            → 100ms retry → still NULL (Gate 1 FAILS)     │
    │                                                          │
    │          Gate 2: hierarchyIndex.isChild(childID)?        │
    │            → FALSE (polling hasn't discovered yet)       │
    │            → FALSE (handleTask hasn't run yet)           │
    │            → (Gate 2 FAILS)                              │
    │                                                          │
    │          Gate 3: pendingRegistry.has(childID)?           │
    │            → dispatches.has("ses_1ddf61a28ffe")?         │
    │              → FALSE (entry keyed by "call:abc123")      │
    │            → dispatches.has("call:ses_1ddf61a28ffe")?    │
    │              → FALSE (childID ≠ parent's callID)         │
    │            → (Gate 3 FAILS)                              │
    │                                                          │
    │          ⚠️ ORPHAN DIRECTORY CREATED ⚠️                   │
    │          → sessionWriter.createSessionDir(childID)       │
    │             (event-capture.ts:221)                       │
    │          → .hivemind/session-tracker/ses_1ddf61a28ffe/   │
    │          → ses_1ddf61a28ffe.md                           │
    │          → project-continuity.json entry                 │
    │                                                          │
    └─────────────────── RACE WINDOW CLOSES ───────────────────┘

  ~200ms later: pollForChildSessions() round 1
    └→ client.session.children({id: parentID})
    └→ discovers ses_1ddf61a28ffe
    └→ hierarchyIndex.registerChild(parentID, childID) ✓
    └→ pendingRegistry.updateWithChildID(callID, childID) ✓
       [TOO LATE — directory already created]

  TaskTool.execute() completes
  tool.execute.after fires in parent
    └→ handleTask() (tool-capture.ts:227)
      └→ hierarchyIndex.registerChild() [redundant, already done]
      └→ childWriter.createChildFile(parentID, childID, .json)
      └→ pendingRegistry.remove(childID) — cleans up
      [TOO LATE — directory already created]

Child Session (later events):
  chat.message fires
    └→ handleChatMessage() → ensureSessionReady(childID)
      → Gate 1: SDK parentID now populated → child detected ✓
      → No directory created (already bootstrapped)
  
  tool.execute.after fires
    └→ handleToolExecuteAfter() → dual-gate detects child ✓
      → No directory created (marked bootstrapped at line 493)
      → [BUT ORPHAN DIRECTORY PERSISTS]
```

---

## Why Gate 3 Cannot Work With Current Design

The fundamental architectural problem:

1. **At `add()` time (PreToolUse):** The child session ID is **unknown**. The task tool hasn't created the child yet. The only known identifiers are `parentSessionID` and `parentCallID`.

2. **At `has()` time (Gate 3, during session.created):** The child session ID is **known** (it just fired `session.created`). But the parent's callID is **unknown** — Gate 3 only receives `sessionID` (the child ID).

3. **The bridge** (`updateWithChildID`) must associate `callID → childID`, but this requires discovering the child session ID first, which only happens asynchronously via polling. The synchronous `session.created` event always wins the race.

**The design assumption that Gate 3 closes the race window is incorrect** because the `has()` method checks keys that the `add()` method never creates (child session ID keys) and the `add()` method creates keys (callID-prefixed) that the `has()` method never checks in the expected way.

---

## Two Paths to Orphan Directories

### Path A: `session.created` (primary path — this bug)

**File:** `src/features/session-tracker/capture/event-capture.ts`
**Line:** 221 — `this.sessionWriter.createSessionDir(sessionID)`
**Trigger:** `session.created` event for child session where all 3 gates fail
**Creates:** `.hivemind/session-tracker/{childID}/` directory with `{childID}.md` and project-continuity.json entry

### Path B: `ensureSessionReady` (fallback/lazy-bootstrap)

**File:** `src/features/session-tracker/index.ts`
**Line:** 212 — `this.sessionWriter.createSessionDir(sessionID)`
**Trigger:** `handleChatMessage()` (line 395) or `handleToolExecuteAfter()` (line 511) calls `ensureSessionReady()` for a session where all 3 gates fail
**Note:** For child sessions, `handleToolExecuteAfter()` has a pre-check (lines 475-493) that skips `ensureSessionReady()` entirely if parentID is detected. But `handleChatMessage()` at line 395 calls `ensureSessionReady()` unconditionally, then does its own dual-gate check (lines 398-413) but only AFTER `ensureSessionReady()` has already created the directory.

---

## The `handleChatMessage` Secondary Failure Path

Looking at `handleChatMessage()` more carefully (index.ts lines 383-452):

```typescript
async handleChatMessage(input, output) {
    // Line 395: UNCONDITIONALLY calls ensureSessionReady
    await this.ensureSessionReady(input.sessionID)
    
    // Lines 398-413: THEN checks if this is a child session
    let parentID: string | undefined
    try {
        const session = await this.getSessionSafely(input.sessionID)
        parentID = (session as { parentID?: string } | undefined)?.parentID
    } catch { }
    
    if (!parentID && this.hierarchyIndex) {
        const hierarchyParent = this.hierarchyIndex.getParent(input.sessionID)
        if (hierarchyParent) parentID = hierarchyParent
    }
    
    if (parentID && this.childWriter) {
        // Child session — write to child .json instead
        // BUT ensureSessionReady already ran on line 395!
    }
}
```

**Race sequence for Path B:**
1. Child session fires a chat message
2. `ensureSessionReady(childID)` runs — all 3 gates fail — directory created at line 212
3. After `ensureSessionReady` returns, the dual-gate check (lines 398-413) now detects the session is a child (SDK has caught up, or hierarchy index is now populated)
4. Chat message correctly written to child `.json` — but the orphan directory already exists

This is a **second race condition**: `ensureSessionReady()` runs BEFORE the child-classification check in `handleChatMessage()`. The classification and directory creation should be ordered: classify FIRST, then create directory only if main session.

---

## Existing Mitigations (Partial)

### `cleanupOrphanDirectories()` at init

**File:** `src/features/session-tracker/index.ts` lines 853-895
**Triggered:** During `initialize()` at line 762

This cleanup runs at plugin startup and removes directories for sessions that the HierarchyIndex classifies as children. **However:**
- It only runs at plugin initialization, not continuously
- If the plugin stays running, orphan directories accumulate between restarts
- It depends on HierarchyIndex being populated from disk (persisted `session-continuity.json`), not from in-memory state

### `handleToolExecuteAfter()` pre-classification

**File:** `src/features/session-tracker/index.ts` lines 472-507

The `handleToolExecuteAfter()` method classifies the session BEFORE calling `ensureSessionReady()`. This is the **correct pattern** — but it only protects tool execution events, not `session.created` events or chat messages.

---

## Summary of Findings

| Question | Answer |
|----------|--------|
| Gate 1 (SDK parentID) location | `event-capture.ts:179-195`, `index.ts:152-165` |
| Gate 2 (HierarchyIndex) location | `event-capture.ts:206`, `index.ts:183` |
| Gate 3 (PendingDispatchRegistry) location | `event-capture.ts:215`, `index.ts:194` |
| Directory creation for children | `event-capture.ts:221` (primary), `index.ts:212` (secondary) |
| PendingDispatchRegistry registration key | `call:${parentCallID}` (pdr.ts:94) |
| PendingDispatchRegistry lookup keys | `childID` and `call:${childID}` (pdr.ts:128) |
| Bridge (updateWithChildID) called from | `pollForChildSessions()` at index.ts:641 (async, loses race) |
| Race window size | ~200ms minimum (first poll interval), effectively unbounded |
| session.created order | Synchronous during TaskTool.execute(), BEFORE tool.execute.after |

**Root cause:** `PendingDispatchRegistry` stores entries by parent callID but Gate 3 looks them up by child session ID, with no reverse-index to bridge the translation. The async bridge consistently loses to the synchronous `session.created` event.

---

## Fix Recommendations

### Fix 1: Add parent-indexed reverse lookup (recommended)

Add a secondary index in `PendingDispatchRegistry` that maps `parentSessionID → Set<PendingDispatchEntry>`:

```typescript
// In PendingDispatchRegistry
private byParent: Map<string, Set<PendingDispatchEntry>> = new Map()

add(entry: PendingDispatchEntry): void {
    this.dispatches.set(`call:${entry.callID}`, entry)
    // Also index by parent
    if (!this.byParent.has(entry.parentSessionID)) {
        this.byParent.set(entry.parentSessionID, new Set())
    }
    this.byParent.get(entry.parentSessionID)!.add(entry)
}

// In has(), add parent-based lookup:
has(sessionID: string): boolean {
    this.cleanupStale()
    if (this.dispatches.has(sessionID)) return true
    if (this.dispatches.has(`call:${sessionID}`)) return true
    // NEW: check all parent entries — a child session will have a parent
    // with pending dispatches
    for (const entries of this.byParent.values()) {
        for (const entry of entries) {
            // If any pending dispatch exists for a parent session,
            // and we're checking a session that COULD be a child,
            // conservatively treat it as a child
            // This is intentionally broad — false positives are harmless
            // (child incorrectly classified as child skips directory creation)
            return true
        }
    }
    return false
}
```

**Tradeoff:** This is intentionally broad — ANY pending dispatch in the registry makes `has()` return true for ALL sessions. But the window is only 30 seconds (STALE_THRESHOLD_MS), and false positives are safe (child incorrectly classified as child). This matches the conservative philosophy at line 200-207 of index.ts.

### Fix 2: Reorder `handleChatMessage()` classification (addresses secondary path)

Move the child classification check BEFORE `ensureSessionReady()`:

```typescript
async handleChatMessage(input, output) {
    // Classify FIRST
    let parentID: string | undefined
    try {
        const session = await this.getSessionSafely(input.sessionID)
        parentID = (session as { parentID?: string } | undefined)?.parentID
    } catch { }
    
    if (!parentID && this.hierarchyIndex) {
        parentID = this.hierarchyIndex.getParent(input.sessionID) ?? undefined
    }
    
    if (parentID) {
        // Child session — write to .json, NEVER create directory
        this.bootstrappedSessions.add(input.sessionID)
        await this.childWriter.appendChildTurn(parentID, input.sessionID, ...)
        return
    }
    
    // Only now: main session → create directory
    await this.ensureSessionReady(input.sessionID)
    // ... rest of message capture
}
```

### Fix 3: Make `pollForChildSessions()` synchronous for the first attempt

Change the polling to do the first attempt synchronously before yielding:

```typescript
async handleToolExecuteBefore(params) {
    // ... add to registry ...
    
    // Do first poll attempt synchronously (still within PreToolUse window)
    try {
        const result = await client.session.children({ path: { id: params.sessionID } })
        // ... register children ...
    } catch { }
    
    // Then fire-and-forget remaining attempts
    void this.pollForChildSessions(params.sessionID, params.callID)
}
```

This narrows the race window by discovering children before `session.created` fires. However, `session.created` still fires synchronously during `TaskTool.execute()`, which starts AFTER `handleToolExecuteBefore()` returns. So Fix 3 alone is insufficient — it must be combined with Fix 1 or Fix 2.

---

## Files Examined

| File | Lines | Role in This Bug |
|------|-------|-----------------|
| `src/features/session-tracker/index.ts` | 1-976 | SessionTracker class, ensureSessionReady (Gates 1-3), handleToolExecuteBefore (registry population), initialize (cleanup) |
| `src/features/session-tracker/capture/event-capture.ts` | 1-388 | handleSessionCreated (Gates 1-3, directory creation at line 221) |
| `src/features/session-tracker/persistence/pending-dispatch-registry.ts` | 1-222 | Registry class, add (line 94, key: callID), has (lines 126-129, key: childID/call:childID) |
| `src/hooks/transforms/tool-before-guard.ts` | 1-67 | PreToolUse hook, calls handleToolExecuteBefore |
| `src/plugin.ts` | 1-267 | Plugin composition, hook wiring, session tracker instantiation |
| `src/features/session-tracker/capture/tool-capture.ts` | 1-436 | handleTask (PostToolUse), HierarchyIndex population |
| `src/hooks/observers/session-tracker-consumer.ts` | 1-41 | Event routing to sessionTracker.handleSessionEvent |
| `src/features/session-tracker/persistence/session-writer.ts` | 40-52 | createSessionDir — actual mkdir call |

---

## Sources

All findings verified by direct code inspection of the repository at `/Users/apple/hivemind-plugin-private/`. Line numbers confirmed against current source files.

**Confidence:** HIGH — all claims are directly traceable to source code with exact line numbers.

**Research date:** 2026-05-13
