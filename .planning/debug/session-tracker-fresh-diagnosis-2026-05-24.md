# Session Tracker Fresh Diagnosis — 2026-05-24

> Round 6 diagnosis after 5 failed fix attempts. Read ALL code first, propose fixes ONLY after understanding the full flow.

## Executive Summary

4 interconnected bugs in the session-tracker module, all traceable to the event-capture layer (`capture/event-capture.ts`) and its interaction with persistence writers. Root causes are distinct but overlapping in symptoms.

---

## Bug Inventory

### Bug 2: Status Stuck at "idle"

**Symptom:** Main session `.md` frontmatter shows `status: idle` after delegation completes, even though `TaskStatus` has no "idle" value.

**Root Cause Analysis:**

`handleSessionIdle` in `event-capture.ts:281-294` explicitly sets `status: "idle"` as a **string literal** — it does NOT go through `task-status.ts` validation:

```typescript
// event-capture.ts:281-294
private handleSessionIdle(sessionID: string): void {
  // ...
  this.updateStatus(sessionID, "idle")   // ← BYPASSES TaskStatus validation!
}
```

Meanwhile, `task-status.ts` defines `VALID_TASK_STATUSES` as:
```
pending | queued | running | completed | failed | error | cancelled | interrupt
```

**"idle" is not a valid TaskStatus.** This means:
1. The string "idle" is written to frontmatter but cannot be transitioned FROM by `canTransition()` (since it's not in `VALID_TRANSITIONS`)
2. Once stuck at "idle", no subsequent status transition can succeed
3. The session remains "idle" permanently unless manually fixed

**Fix Direction:** Replace `"idle"` with a valid status. The correct terminal status after session goes quiet is likely `"completed"` (if it finished naturally) or `"interrupt"` (if it was abandoned). Need to determine intent of `handleSessionIdle` before choosing.

**Files:**
- `src/features/session-tracker/capture/event-capture.ts:281-294` — `handleSessionIdle`
- `src/shared/task-status.ts` — `VALID_TASK_STATUSES`, `VALID_TRANSITIONS`

---

### Bug 3: lastMessage Missing Assistant Responses

**Symptom:** Child session records never show `lastMessage` for assistant turns — only the initial user prompt.

**Root Cause Analysis:**

`appendChildTurn` in `child-writer.ts:335-337` only updates `lastMessage` for non-user turns:

```typescript
// child-writer.ts:335-337
if (turn.role !== "user") {
  record.lastMessage = turn.content.slice(0, 200)
}
```

However, the **callers** of `appendChildTurn` determine WHAT turns get appended. Looking at the flow:

1. **Initial write** (`writeImmediateChildFile` in event-capture.ts:461): Creates child file with initial prompt — this is a USER turn
2. **Subsequent updates**: `handleToolExecuteAfter` calls `recordChildTaskDelegation` which calls `extractTaskResult` — but this extracts TOOL OUTPUT, not assistant responses
3. **No code path ever appends an assistant turn to child sessions**

The assistant responses from child agents are never captured because:
- `handleToolExecuteAfter` (event-capture.ts) captures tool outputs but not the assistant's summary message
- `handleSessionMessage` (if it exists) only processes messages for the MAIN session, not children
- The child writer's `appendChildTurn` is never called with `role: "assistant"`

**Fix Direction:** Need to capture assistant responses in child sessions. Options:
1. Hook into `assistant.message` or equivalent SDK event for child sessions
2. After task completion, extract the assistant's final response and append it as a child turn

**Files:**
- `src/features/session-tracker/capture/event-capture.ts` — missing assistant message capture for children
- `src/features/session-tracker/persistence/child-writer.ts:335-337` — `appendChildTurn` logic is correct but never called with assistant turns
- `src/features/session-tracker/tool-delegation.ts` — `extractTaskResult` only extracts tool output

---

### Bug 4: Compaction Loses Content

**Symptom:** After context compaction (`/clear`), the session `.md` file has a compaction journey entry but assistant messages are gone.

**Root Cause Analysis:**

`handleSessionCompacted` in `event-capture.ts:555-589`:

```typescript
// event-capture.ts:555-589
private handleSessionCompacted(sessionID: string, compactedContent: string): void {
  // 1. Records a journey entry — CORRECT
  // 2. Writes compaction block to .md — CORRECT
  // 3. Does NOT recover/rewrite assistant messages — BUG
}
```

The compaction handler records that compaction happened but doesn't preserve the actual content that was compacted. The `compactedContent` parameter IS passed but is only written as a journey entry metadata — it's not reconstructed into proper turns in the `.md` file.

Additionally, `session-writer.ts:appendCompactionBlock` (line 198-201) simply appends the block as-is without any content reconstruction.

**Fix Direction:** The compaction block should contain a summary of what was compacted, or the handler should re-append key turns from the compacted content before writing the compaction marker. This is a design question — do we want full replay or just a summary?

**Files:**
- `src/features/session-tracker/capture/event-capture.ts:555-589` — `handleSessionCompacted`
- `src/features/session-tracker/persistence/session-writer.ts:198-201` — `appendCompactionBlock`

---

### Bug 5: Empty children array in hierarchy-manifest

**Symptom:** `hierarchy-manifest.json` shows `children: []` even after successful delegation.

**Root Cause Analysis:**

The race condition analysis:

1. `writeImmediateChildFile` (event-capture.ts:461) runs DURING `handleToolExecuteBefore` — BEFORE the child session ID is known
2. `recordChildTaskDelegation` (tool-delegation.ts) runs during `handleToolExecuteAfter` — AFTER the child completes
3. `SessionIndexWriter.addChild` (session-index-writer.ts:196) runs as part of `recordChildTaskDelegation`

**But there's a timing issue:**

- `writeImmediateChildFile` creates the child `.json` file immediately (pre-dispatch)
- `addChild` is called LATER (post-dispatch) via `recordChildTaskDelegation`
- If the `addChild` call fails silently (caught by `enqueueWrite` error handler at session-index-writer.ts:118-124), the child file exists but is never registered in the hierarchy index

Looking at `enqueueWrite`:
```typescript
// session-index-writer.ts:118-124
.catch((err) => {
  // Best-effort: keep queue alive but log the error
  console.error(...)
})
.then(() => {})
```

**Errors are swallowed.** If `addChild` encounters a "parent not found" error (line 223-226), it throws, the error is caught and logged, but the child is never registered. The hierarchy-manifest remains empty.

Additionally, looking at `addChild` line 216-226:
```typescript
if (parentSessionID) {
  const parent = this.findChildEntry(index.hierarchy.children, parentSessionID)
  if (parent) {
    parent.children[childSessionID] = entry
  } else {
    throw new Error(`[Harness] ... parent "${parentSessionID}" not found ...`)
  }
}
```

If the parent session hasn't been registered in the hierarchy yet (race condition between session creation and child dispatch), `findChildEntry` returns `undefined` and the function THROWS, which is silently caught by `enqueueWrite`.

**Fix Direction:** Two issues to fix:
1. Don't throw when parent is not found — fall back to top-level insertion
2. Ensure the child is registered even if the initial hierarchy lookup fails

**Files:**
- `src/features/session-tracker/persistence/session-index-writer.ts:216-234` — `addChild` throws on missing parent
- `src/features/session-tracker/persistence/session-index-writer.ts:118-124` — `enqueueWrite` swallows errors

---

## Dependency Map

```
event-capture.ts (hooks → capture layer)
  ├── session-writer.ts (main .md file writes)
  ├── child-writer.ts (child .json file writes)
  ├── session-index-writer.ts (session-continuity.json writes)
  ├── pending-dispatch-registry.ts (in-memory Gate 3 tracking)
  └── tool-delegation.ts (delegation recording + result extraction)

task-status.ts (shared status validation — NOT used by event-capture for "idle")
```

## Shared Interface Issue

Both `task` tool and `delegate-task` tool flow through:
1. `handleToolExecuteBefore` → `pendingDispatchRegistry.add()` + `writeImmediateChildFile()`
2. `handleToolExecuteAfter` → `recordChildTaskDelegation()` → `extractTaskResult()`

The code path IS unified (both go through `event-capture.ts`). The bugs are in the shared path, not in divergence between the two tools.

## Proposed Fix Order

1. **Bug 2 (status "idle")** — Simplest fix, one line change
2. **Bug 5 (empty children)** — Medium complexity, fallback insertion
3. **Bug 4 (compaction content)** — Design decision needed before implementing
4. **Bug 3 (missing assistant messages)** — Requires finding the right SDK hook

## Risk Assessment

| Bug | Fix Risk | Test Coverage | Regression Risk |
|-----|----------|---------------|-----------------|
| Bug 2 | LOW — string literal change | No existing tests for "idle" | LOW — only changes transition target |
| Bug 5 | MEDIUM — fallback logic change | Existing tests for addChild | MEDIUM — affects hierarchy nesting |
| Bug 4 | MEDIUM — needs design decision | No existing compaction tests | MEDIUM — affects .md file format |
| Bug 3 | HIGH — needs new event capture | No existing child message tests | HIGH — touches hook integration |

## Questions for User

1. **Bug 2:** When a session goes "idle" (no activity), should the status be `completed` (natural end) or `interrupt` (abandoned)? Or should we add `"idle"` as a valid `TaskStatus`?
2. **Bug 4:** After compaction, should the `.md` file contain a SUMMARY of what was compacted, or a full REPLAY of the original turns?
3. **Bug 5:** Should children whose parent isn't found in hierarchy be inserted at top level (graceful degradation) or should we fix the race condition that causes the parent to be missing?
