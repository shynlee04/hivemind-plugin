---
phase: CP-ST-01-session-tracker-revamp
reviewed: 2026-05-13T00:00:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - src/features/session-tracker/capture/tool-capture.ts
  - src/features/session-tracker/persistence/hierarchy-index.ts
  - src/features/session-tracker/persistence/project-index-writer.ts
  - src/plugin.ts
  - tests/features/session-tracker/capture/tool-capture-child.test.ts
  - tests/features/session-tracker/capture/tool-capture.test.ts
  - tests/features/session-tracker/integration/e2e-verification.test.ts
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
status: issues_found
---

# Phase CP-ST-01: Code Review Report — Deep Fix Re-review (Commit `760c93b0`)

**Reviewed:** 2026-05-13T00:00:00Z
**Depth:** deep (cross-file import/call-chain analysis)
**Files Reviewed:** 7
**Status:** issues_found — 2 critical, 4 warning, 4 info (10 total)

## Summary

Re-review of the deep fix commit `760c93b0` ("fix(session-tracker): deep fix — correct SDK event wiring, dynamic depth computation, actual delegator attribution") across 7 changed files. The commit addresses several known bugs from the debug document `.planning/debug/session-parent-misclassify-AWAITING-AUTH-2026-05-12.md` — notably Bug 4 (L1/L2 depth flattening) — with a new `getDepth()` chain-walker and dynamic depth computation. The `getEventSessionID()` integration in plugin.ts is a clear improvement over direct property access. However, the "actual delegator attribution" change has a semantic bug: `delegatedBy.agentName` is set to the **subagent_type** (the delegation TARGET) rather than the parent-agent name (the delegation SOURCE). Additionally, the fix introduces a new race-condition surface where child sessions added to the project index via `handleTask()` can conflict with child-exclusion logic in `ensureSessionReady()`.

---

## Critical Issues

### CR-01: `delegatedBy.agentName` Uses `subagentType` (TARGET) Instead of Parent-Agent Name (SOURCE)

**File:** `src/features/session-tracker/capture/tool-capture.ts:255`
**Issue:** The `delegatedBy` interface (defined in `types.ts:71-82`) documents `agentName` as "Name of the delegating agent (e.g. 'Hm-L0-Orchestrator')" — the agent that PERFORMED the delegation. The commit changes this from the hardcoded `"main_l0_agent"` to `subagentType || "unknown"`, which is the subagent **being dispatched** (the target), not the delegator. For example, when `hm-l0-orchestrator` dispatches a task to `hm-l2-investigator`:

- `delegatedBy.agentName` currently becomes `"hm-l2-investigator"` (the TARGET — wrong)
- `delegatedBy.subagentType` correctly is `"hm-l2-investigator"` (the TARGET — correct)
- `mainAgent.name` correctly is `"hm-l2-investigator"` (the child session's own agent — correct)

This means `delegatedBy.agentName` and `mainAgent.name` are always identical, which makes `delegatedBy.agentName` nearly useless — it can't answer "who delegated this?" because it stores the same value as "who is running the child?". The previous hardcoded `"main_l0_agent"` was wrong but self-consistent; the new value is meaningful but placed in the wrong semantic slot. This produces incorrect data in `.hivemind/session-tracker/` child `.json` files.

**Root cause:** The `ToolInput` interface (line 31-36) has no `agent` or `agentName` field — the `tool.execute.after` hook input only carries `tool`, `sessionID`, `callID`, and `args`. The parent agent's name is not available in this handler context without either (a) extending the hook input type in `plugin.ts:237`, (b) querying the SDK for the parent session's metadata, or (c) maintaining agent-name state in the session tracker.

**Fix:** Two options:

**Option A (immediate, honest):** Set `agentName` to `"unknown"` until the parent-agent name can be surfaced — this is more honest than placing the subagent type in the wrong field:
```typescript
delegatedBy: {
  agentName: "unknown", // Parent-agent name not available in tool.execute.after hook
  model: "unknown",
  tool: "task",
  description,
  subagentType,
},
```

**Option B (preferred, structural):** Extend the `tool.execute.after` hook input in `plugin.ts` to include agent context (`agent` string from the chat.message hook), then thread it through to `ToolInput`:
```typescript
// plugin.ts:237 — add `agent` to the input shape
input: { tool: string; sessionID?: string; callID?: string; agent?: string; args?: Record<string, unknown> },

// tool-capture.ts:31-36 — add `agent` to ToolInput
interface ToolInput {
  tool: string
  sessionID: string
  callID: string
  agent?: string
  args: unknown
}

// tool-capture.ts:255 — use agent from input or fall back
agentName: input.agent || "unknown",
```

Tests in `tool-capture-child.test.ts` (P-03 at line 174) only check that `agentName` is truthy, so this would need a test update to verify the semantic correctness of the value.

---

### CR-02: Race Condition — Child Session May Get Project-Index Entry from Both `handleTask()` and `ensureSessionReady()`

**File:** `src/features/session-tracker/capture/tool-capture.ts:312-316` + `src/features/session-tracker/index.ts:130-205`

**Issue:** `handleTask()` calls `projectIndexWriter.addSession(childSessionID, ...)` (line 312) to register a child session in the project-level index with a parent-relative directory path (`${input.sessionID}/`). Separately, `ensureSessionReady()` (index.ts:130-205) is designed to create session directories and add entries to the project index only for MAIN sessions — it explicitly skips child sessions when the hierarchy index is populated (index.ts:163-166). However, there is a race window:

1. Child session `session.created` event fires
2. Plugin routes event to `consumeSessionTrackerFact` → `handleSessionEvent` → (in the child's own `handleChatMessage` or `handleToolExecuteAfter`) → `ensureSessionReady(childSessionID)`
3. The parent's `handleTask()` call may not have executed yet, so `hierarchyIndex.isChild(childSessionID)` returns `false`
4. `ensureSessionReady()` treats the child as a MAIN session: creates a top-level directory and calls `projectIndexWriter.addSession(childID, "${childID}/", "${childID}.md")` with a top-level path
5. Later, `handleTask()` runs and calls `projectIndexWriter.addSession(childID, "${parentID}/", "${childID}.json")` with a parent-relative path

Result: **Dual project index entries** for the same child session — one with a top-level directory path (from Step 4) and one with a parent-relative path (from Step 5). The second call in `addSession()` (project-index-writer.ts:161-172) OVERWRITES the `sessions[childID]` entry because `addSession` does not check if the session already exists — it always writes `index.sessions[sessionID] = { ... }`, meaning whichever call runs LAST wins and the earlier entry's directory state is lost.

This race was partially addressed by calling `hierarchyIndex.registerChild()` early in `handleTask()` (line 239, before depth computation), which gives `ensureSessionReady` a chance to see the child in the hierarchy index on subsequent events. But the initial `session.created` event for the child session can still arrive asynchronously before the parent's `task` tool callback runs, creating the race window.

**Fix:** Make `addSession()` in project-index-writer.ts idempotent — check if the session already exists before overwriting the session directory entry:
```typescript
async addSession(sessionID: string, sessionDir: string, mainFile: string): Promise<void> {
  await this.enqueueWrite(async () => {
    const index = await this.readIndex()
    const now = new Date().toISOString()

    index.lastUpdated = now

    const existing = index.sessions[sessionID]
    if (existing) {
      // Session already registered — only update non-path metadata
      existing.updated = now
      if (existing.status !== "error" && existing.status !== "deleted") {
        existing.status = "active"
      }
    } else {
      index.sessions[sessionID] = {
        dir: sessionDir,
        mainFile,
        continuityIndex: `${sessionDir}session-continuity.json`,
        created: now,
        updated: now,
        status: "active",
        childCount: 0,
        totalDelegationDepth: 0,
      }
    }

    if (!index.chronologicalOrder.includes(sessionID)) {
      index.chronologicalOrder.push(sessionID)
    }

    const filePath = this.getIndexPath()
    await atomicWriteJson(filePath, index)
  })
}
```

Alternatively, do NOT call `addSession()` for children in `handleTask()` at all — let `ensureSessionReady()` be the sole authority for project-index registration (after the race is resolved by synchronous hierarchy-index population).

---

## Warnings

### WR-01: Dead Comment Block in `handleTask` — Misleading "Kept for Clarity"

**File:** `src/features/session-tracker/capture/tool-capture.ts:300-307`

**Issue:** Lines 300-307 contain a 8-line comment block that describes a second `registerChild()` call that does NOT exist in the code. The comment says:
- "registerChild() was already called above for depth computation"
- "This is a no-op (Map.set is idempotent for same key/value)"
- "Kept for clarity — ensures ensureSessionReady() and handleChatMessage() can classify this child session correctly"

But there is no code after this comment — no second `registerChild()` call, nothing "kept". The comment was preserved from a previous version of the code where a second `registerChild()` existed. Now it's misleading: a reader would look for the code the comment references and find nothing. This is a stale comment artifact from refactoring.

**Fix:** Remove the dead comment block entirely:
```typescript
// Remove lines 300-307 (the comment-only block)
```

---

### WR-02: `projectIndexWriter.addSession()` Overwrites Without Merge — Data Loss on Concurrent Writes

**File:** `src/features/session-tracker/persistence/project-index-writer.ts:151-179`

**Issue:** The `addSession()` method always writes `index.sessions[sessionID] = { ...newEntry }` (line 161), replacing any previously registered entry for that session. While the serial write queue prevents concurrent in-process corruption, if the session already exists from a prior write (e.g., by `handleTask()` registering a child before `ensureSessionReady()`), ALL fields are overwritten — including `childCount` and `totalDelegationDepth` which may have been incremented by prior `incrementChildCount()` calls.

This is the persistence-side counterpart of CR-02. Even if the race in CR-02 is resolved, the overwrite behavior in `addSession()` can still cause data loss if the method is ever called for an already-registered session.

**Fix:** Add an existence check in `addSession()` as described in CR-02's fix, or rename the method to clarify it's an "upsert" and document the overwrite behavior.

---

### WR-03: `delegatedBy.model: "unknown"` — Data Quality Gap

**File:** `src/features/session-tracker/capture/tool-capture.ts:256`

**Issue:** The `delegatedBy.model` field is hardcoded to `"unknown"`. The parent agent's model information IS available via the SDK but isn't threaded through to the `tool.execute.after` hook. The test at `tool-capture-child.test.ts:196` (`expect(metadata.delegatedBy.model).toBeDefined()`) passes vacuously because `"unknown"` is defined, but the data is meaningless. This prevents any downstream analysis that depends on knowing which model performed a delegation.

**Fix:** Add `agent` and `model` fields to the `ToolInput` interface (as in CR-01 Option B) and propagate from `plugin.ts:237`:
```typescript
// plugin.ts:237
input: { tool: string; sessionID?: string; callID?: string; agent?: string; model?: { providerID: string; modelID: string }; args?: Record<string, unknown> },
```

---

### WR-04: `isValidSessionID` vs `assertValidSessionID` — Inconsistent Validation Rules

**File:** `src/features/session-tracker/types.ts:274-284` vs `src/shared/session-api.ts:27-39`

**Issue:** Two session-ID validation functions have different strictness:
- `isValidSessionID` (types.ts): rejects only `..` path traversal, `/` and `\` prefixes, and empty strings. Does NOT require `ses_` prefix.
- `assertValidSessionID` (session-api.ts): strictly requires `.startsWith("ses")` and `length > 3`. Also allows `/^(child|parent)-/` prefixes in test mode.

This asymmetry means a session ID like `abc123` passes `isValidSessionID` (and thus enters the capture handlers and `hierarchyIndex.registerChild()`) but would throw an `Error` in `getSession()` (which uses `assertValidSessionID`). The error is caught by `ensureSessionReady()`'s try/catch (index.ts:148-152), so it doesn't crash, but it creates a silent discrepancy where some sessions are treated as valid by the tracker but rejected by the SDK.

**Fix:** Align the two validators. Either:
- Add `startsWith("ses_")` to `isValidSessionID`, or
- Relax `assertValidSessionID` to match the permissive `isValidSessionID` rules
Given the `ses_` prefix is the documented OpenCode convention, adding it to `isValidSessionID` is the safer choice.

---

## Info

### IN-01: `getDepth()` Fallback Uses `isChild()` — Depth May Be Incorrect for Deeply Nested Children

**File:** `src/features/session-tracker/capture/tool-capture.ts:243-245`

**Issue:** When `getDepth()` returns 0 (child not in hierarchy index, e.g., cold start or late registration), the fallback logic sets depth to `2` if the parent is itself a child, or `1` otherwise:
```typescript
if (depth === 0) {
  depth = this.hierarchyIndex.isChild(input.sessionID) ? 2 : 1
}
```
This assumes exactly two levels. While the depth cap at 2 per SPEC §1.2 makes this correct for the current system, the code conflates "parent is a child" with "parent has depth exactly 1". If the parent has depth 0 (main session), depth 1 is correct. If the parent has depth 2 (grandchild of root), the child should still be depth 2 (capped), which this logic accidentally gets right by always returning 2 for child-of-child. The code works but the logic is brittle — if the depth cap ever increases, this fallback would be wrong.

**Fix:** Rename the fallback comment to document the assumption:
```typescript
// Fallback: if hierarchy index doesn't know this child yet,
// infer depth from parent's status. Depth is capped at 2 per SPEC §1.2.
// parent-is-child → depth=2 (cap), parent-is-main → depth=1
```

---

### IN-02: Commented-Out Legacy Code in `plugin.ts` — Safety Net Erosion

**File:** `src/plugin.ts:244-255`

**Issue:** Lines 245-255 preserve commented-out legacy event-tracker wiring as a "safety net per REQ-ST-13." This code has been dead since Phase 13 (F-09) and has now survived multiple commits. Dead comments rot over time — they become misaligned with the codebase and confuse future readers. The `.planning/debug/session-parent-misclassify-AWAITING-AUTH-2026-05-12.md` document confirms this migration is complete and the legacy event-tracker source code is preserved at `src/task-management/journal/event-tracker/`.

**Fix:** Remove the commented-out block. The safety net claim is satisfied by the preserved source code at `src/task-management/journal/event-tracker/` (verified by REQ-ST-13 test at e2e-verification.test.ts:613). Git history retains the removed code if ever needed.

---

### IN-03: `handleChatMessage` Child Session Capture Uses `message.role` as Content — Data Quality Regression

**File:** `src/features/session-tracker/index.ts:391-393`

**Issue:** When a child session's chat message is captured (lines 384-397), the turn `content` is set to `typeof messageRole === "string" ? messageRole : "unknown"` — this is the message ROLE string (e.g., `"user"`, `"assistant"`), NOT the actual message text content. This was flagged as "Bug 2: Missing Assistant Messages" in the debug document and user feedback said "wrong logic — needs further investigation." The current commit does not fix this.

While this is outside the strict scope of the 7 reviewed files (it's in `index.ts` which wasn't changed in this commit), it's a cross-file call-chain concern because `handleTask()` (tool-capture.ts) correctly captures `description` as content for the delegation_spawn turn (line 286), creating an inconsistency: task-delegation turns have meaningful content, but chat-message turns for child sessions have meaningless role strings.

**Fix:** Extract actual text content from `output.parts`, similar to how `MessageCapture.handleChatMessage` does it:
```typescript
const parts = output.parts as Array<{ type: string; text?: string }>
const content = parts
  .filter(p => p.type === "text" && typeof p.text === "string")
  .map(p => p.text!)
  .join("\n") || (typeof messageRole === "string" ? `[${messageRole} message]` : "unknown")

await this.childWriter.appendChildTurn(
  parentID,
  input.sessionID,
  {
    turn: 0,
    actor: input.agent || "unknown",
    content,
    tools: [],
  },
)
```

---

### IN-04: `asString` Catcher Returns `"[object Object]"` — Opaque Fallback for Non-JSON Objects

**File:** `src/features/session-tracker/capture/tool-capture.ts:412-413`

**Issue:** The `asString()` helper has a fallback `catch { return String(value) }` which produces `"[object Object]"` for non-serializable objects (e.g., objects with circular references). This opaque string can end up in session `.md` files when the tool output is an unserializable object, potentially leaking into the `extractFirstHeader()` regex (which would return `undefined` for `"[object Object]"` — safe but misleading) or `extractTaskId()` (which would also return `null` — safe). The behavior is correct for security but the `"[object Object]"` value is a data quality smell that could confuse consumers of the session `.md` files.

**Fix:** Return a clearer sentinel value:
```typescript
try {
  return JSON.stringify(value)
} catch {
  return `[unserializable: ${typeof value}]`
}
```

---

## Cross-File Call-Chain Analysis (Deep Review)

### SDK Event Wiring Trace

```
OpenCode event hook (plugin.ts:159, core-hooks.ts:159-172)
  → eventObservers[] includes consumeSessionTrackerFact
    → consumeSessionTrackerFact (plugin.ts:162-180)
      → getEventSessionID(ev) — resolves sessionID from multiple event shapes
      → sessionTracker.handleSessionEvent({ eventType, sessionID, event })
        → index.ts:220 → eventCapture.handleSessionEvent(event)
          → event-capture.ts → sessionWriter, projectIndexWriter for session.created
```

**Verdict:** The `getEventSessionID()` integration (replacing direct property access on `ev?.sessionID || ev?.properties?.sessionID`) is backward-compatible AND more robust — it checks `properties.sessionID`, `properties.sessionId`, `sessionID`, `sessionId`, AND falls back to `getSessionID(getEventSessionInfo(event))`. No regression risk.

### `tool.execute.after` Hook Signature Trace

```
plugin.ts:236-284 → tool.execute.after hook
  → input: { tool, sessionID?, callID?, args? } — NEW: sessionID, callID at top level
  → createToolExecuteAfterHook(input, _output) — only reads tool + args (backward compat)
  → sessionTracker.handleToolExecuteAfter(input, output)
    → toolCapture.handleToolExecuteAfter(input, output)
      → ToolInput: { tool, sessionID, callID, args } — matches NEW input shape
```

**Verdict:** The new `sessionID` and `callID` fields at the top-level input are correctly consumed by `ToolCapture.handleToolExecuteAfter()`. The `createToolExecuteAfterHook` composer ignores them (it reads `sessionID` from `input.args` via `resolveToolHookSessionId`), so downstream consumers are unaffected. No regression risk.

### Depth Computation Chain

```
handleTask (tool-capture.ts:223)
  → hierarchyIndex.registerChild(parentID, childID) — populates map FIRST
  → hierarchyIndex.getDepth(childID) — walks parent→parent chain
    → while (childToParent.has(current)) — walks Map
    → visited.add(current) — cycle guard
    → depth++, Math.min(depth, 2) — cap per SPEC
  → fallback if depth===0: isChild(parentID) ? 2 : 1
  → sessionIndexWriter.addChild(..., depth)
  → projectIndexWriter.incrementChildCount(parentID, depth)
```

**Verdict:** The `getDepth()` chain-walker is correct. The cycle guard works (visited set prevents infinite loop), the depth cap (2) matches SPEC §1.2, and the pre-register+crawl ordering is correct. The fallback heuristic is a reasonable approximation when the hierarchy index hasn't yet been populated from disk.

### Project Index Registration Trace

```
Path A (main session): ensureSessionReady (index.ts:130)
  → SDK getSession check for parentID → if no parentID:
    → sessionWriter.createSessionDir + initializeSessionFile
    → projectIndexWriter.addSession(sid, "${sid}/", "${sid}.md")

Path B (child session in handleTask): handleTask (tool-capture.ts:223)
  → projectIndexWriter.addSession(childID, "${parentID}/", "${childID}.json")

Path C (child session events): ensureSessionReady (index.ts:130)
  → SDK getSession check for parentID
  → hierarchyIndex.isChild check → SKIP if child (bypasses addSession)
  → BUT: if hierarchyIndex not yet populated → fall through → PATH A for child
```

**Verdict:** Paths B and C conflict. The fix partially mitigates by calling `registerChild()` early in path B (before path C can run for the next event), but the initial `session.created` for the child session is asynchronous and cannot be ordered relative to the parent's `task` tool execution. This is the root of CR-02.

---

## Test Coverage Assessment

| Test file | What's tested | Gaps |
|-----------|--------------|------|
| `tool-capture.test.ts` | Skill/read/task/other tool capture, error handling | `agentName` semantics not verified (only checks `expect.objectContaining` for description/subagentType) |
| `tool-capture-child.test.ts` | Child file creation, delegation_spawn turn, P-03 | `agentName` test only checks truthiness — doesn't verify it's the PARENT agent |
| `e2e-verification.test.ts` | All 13 REQs, path safety, camelCase, legacy cleanup | No test for race condition (CR-02) — concurrent session.created + task tool execution |
| `hierarchy-index.ts` | NOT tested in isolation in these test files | Cycle guard, depth cap, fallback logic — only tested implicitly via tool-capture mocks |

**Recommendation:** Add explicit unit tests for:
- `HierarchyIndex.getDepth()` with known child-to-parent chains (depth 1, 2, 3+capped, cycles)
- `HierarchyIndex.getDepth()` returning 0 for unregistered sessions
- `delegatedBy.agentName` value in e2e test (REQ-ST-07 currently checks `agentName` is `"hm-l2-architect"` — the subagent_type — but should check it's the parent's agent name)

---

## Architecture Compliance

| Rule | Status | Notes |
|------|--------|-------|
| CQRS: hooks must not write files | ✅ PASS | All writes route through persistence writers |
| State root: `.hivemind/` only | ✅ PASS | No writes to `.opencode/` |
| Module LOC cap: 500 | ✅ PASS | `tool-capture.ts`: 416, `hierarchy-index.ts`: 174, `project-index-writer.ts`: 341, `plugin.ts`: 288 |
| `import type` for type-only imports | ✅ PASS | All type-only imports use `import type` |
| `verbatimModuleSyntax` | ✅ PASS | All `.js` extensions present |
| No circular imports | ✅ PASS | Dependency chain is acyclic |
| `[Harness]` error prefix | ✅ PASS | All thrown errors/logs prefixed |

---

_Reviewed: 2026-05-13T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
