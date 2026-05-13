---
phase: CP-ST-04
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/session-tracker/persistence/pending-dispatch-registry.ts
  - src/features/session-tracker/index.ts
  - tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts
autonomous: true
requirements: [D-01, D-04, D-05]

must_haves:
  truths:
    - "PendingDispatchRegistry.has(childSessionID) returns true when child's parent has a pending dispatch entry"
    - "handleChatMessage classifies session as child BEFORE calling ensureSessionReady"
    - "Child sessions detected via pendingRegistry never trigger directory creation"
  artifacts:
    - path: "src/features/session-tracker/persistence/pending-dispatch-registry.ts"
      provides: "Fixed parent-indexed reverse lookup in has() method"
      min_lines: 230
    - path: "src/features/session-tracker/index.ts"
      provides: "Fixed handleChatMessage classification order"
      contains: "pendingRegistry"
    - path: "tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts"
      provides: "Tests for parent-indexed reverse lookup"
  key_links:
    - from: "tool-before-guard.ts PreToolUse"
      to: "pending-dispatch-registry.ts add()"
      via: "handleToolExecuteBefore"
      pattern: "pendingRegistry\\.add"
    - from: "pending-dispatch-registry.ts has()"
      to: "event-capture.ts handleSessionCreated Gate 3"
      via: "pendingRegistry call"
      pattern: "pendingRegistry\\?\\.has"
    - from: "index.ts handleChatMessage"
      to: "pending-dispatch-registry.ts has()"
      via: "classification before ensureSessionReady"
      pattern: "pendingRegistry\\?\\.has"
---

<objective>
Fix the PendingDispatchRegistry key mismatch (root cause of CP-ST-02 gate failure) and fix the handleChatMessage classification ordering bug.

Purpose: D-04 calls for a parent-indexed reverse lookup so `has(childID)` works even when the child session ID is unknown at `add()` time. D-05 requires classification BEFORE directory creation — the current `handleChatMessage()` calls `ensureSessionReady()` (which may mkdir) before checking if the session is a child.

Output: PendingDispatchRegistry with `byParent` reverse index; handleChatMessage with classification-first ordering; passing tests.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-CONTEXT.md
@.hivemind/planning/session-tracker-gap-audit-2026-05-13/research.md

<interfaces>
<!-- Key types and contracts from existing codebase -->

From src/features/session-tracker/persistence/pending-dispatch-registry.ts:
```typescript
export interface PendingDispatchEntry {
  parentSessionID: string
  callID: string
  subagentType: string
  timestamp: number
}

export class PendingDispatchRegistry {
  private dispatches: Map<string, PendingDispatchEntry>
  private callIDToChild: Map<string, string>
  static readonly STALE_THRESHOLD_MS = 30_000

  add(entry: PendingDispatchEntry): void         // Stores by call:${callID}
  has(sessionID: string): boolean                // Checks childID and call:${childID}
  get(sessionID: string): PendingDispatchEntry | undefined
  getSubagentType(sessionID: string): string | undefined
  updateWithChildID(callID: string, childSessionID: string): void
  remove(sessionID: string): void
  removeByCallID(callID: string): void
  cleanupStale(): void
}
```

From src/features/session-tracker/index.ts (lines 383-451, handleChatMessage):
```typescript
async handleChatMessage(input, output): Promise<void> {
    // CURRENT (BUG): ensureSessionReady runs BEFORE classification
    await this.ensureSessionReady(input.sessionID)  // line 395
    // THEN checks parentID (lines 398-413)
    // THEN routes to childWriter if parent detected (lines 415-433)
}
```

From src/features/session-tracker/index.ts (lines 554-596, handleToolExecuteBefore):
```typescript
async handleToolExecuteBefore(params): Promise<void> {
    // Adds to pendingRegistry with parentSessionID + callID
    this.pendingRegistry.add({ parentSessionID, callID, subagentType, timestamp })
    void this.pollForChildSessions(parentID, callID) // fire-and-forget
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add parent-indexed reverse lookup to PendingDispatchRegistry</name>
  <files>
    src/features/session-tracker/persistence/pending-dispatch-registry.ts
    tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts
  </files>
  <behavior>
    - Test 1: has() returns true for a childSessionID when ANY pending dispatch entry exists whose parentSessionID matches a parent with pending entries. This is intentionally broad — any pending dispatch means a child session may arrive.
    - Test 2: has() returns false when no pending dispatches exist (registry empty)
    - Test 3: has() returns false for stale entries (age > STALE_THRESHOLD_MS)
    - Test 4: add() indexes entries by both callID key AND parentSessionID in a reverse map
    - Test 5: removeByCallID() cleans up the byParent index entry
    - Test 6: updateWithChildID() preserves parentSessionID in the byParent index after re-keying
    - Test 7: cleanupStale() removes stale entries from byParent index
  </behavior>
  <action>
Implement D-04: Add a parent-indexed reverse lookup to PendingDispatchRegistry.

**In `pending-dispatch-registry.ts`:**

1. Add a new private field `byParent`: `Map<string, Set<string>>` mapping `parentSessionID → Set<callID>`. This tracks which callIDs are pending for each parent, enabling O(1) lookup: given a child session ID that appears during `session.created`, we check whether ANY parent has pending dispatches.

2. Fix `add()` (current line 90-95): After storing `this.dispatches.set("call:${entry.callID}", entry)`, also index:
   ```typescript
   if (!this.byParent.has(entry.parentSessionID)) {
     this.byParent.set(entry.parentSessionID, new Set())
   }
   this.byParent.get(entry.parentSessionID)!.add(entry.callID)
   ```

3. Fix `has()` (current lines 126-129): Add a third check after the existing two:
   ```typescript
   has(sessionID: string): boolean {
     this.cleanupStale()
     if (this.dispatches.has(sessionID)) return true
     if (this.dispatches.has(`call:${sessionID}`)) return true
     // D-04: Reverse lookup — if ANY parent has pending dispatches,
     // conservatively return true. False positives are safe (child
     // incorrectly classified as child skips directory creation).
     // False negatives create orphan directories (the bug we're fixing).
     if (this.byParent.size > 0) return true
     return false
   }
   ```
   Rationale per research.md Fix 1: Any pending dispatch in the registry means a child session could be arriving at any moment. The STALE_THRESHOLD_MS of 30s bounds the window. False positives are harmless (child gets .json instead of directory — correct behavior). False negatives create orphan directories (the bug).

4. Fix `removeByCallID()` (current lines 165-173): After removing from dispatches, also remove from byParent:
   ```typescript
   const callKey = `call:${callID}`
   const entry = this.dispatches.get(callKey)
   if (entry) {
     // Clean byParent index
     const parentSet = this.byParent.get(entry.parentSessionID)
     if (parentSet) {
       parentSet.delete(callID)
       if (parentSet.size === 0) this.byParent.delete(entry.parentSessionID)
     }
   }
   // ... existing cleanup ...
   ```

5. Fix `updateWithChildID()` (current lines 107-114): After re-keying, ensure the byParent entry persists (it should — parentSessionID doesn't change). No structural change needed beyond keeping the byParent entry alive.

6. Fix `cleanupStale()` (current lines 190-205): After deleting a stale entry from dispatches, also remove its callID from the byParent set for the entry's parentSessionID. Delete the parent key if the set becomes empty.

7. Fix `clear()` (current lines 218-221): Also clear `this.byParent.clear()`.

**In the test file (create if it doesn't exist at `tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts`):**

Write tests using vitest globals. Create a fresh registry per test with `beforeEach`. Test the behaviors listed above. Use dates within the window (e.g., `Date.now()`) and beyond the window (e.g., `Date.now() - 31_000`) to test staleness.
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts</automated>
  </verify>
  <done>All 7 behavior tests pass. has() returns true when any pending dispatch exists (broad classification). Stale entries are excluded. byParent index is correctly cleaned up on remove/add/clear.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Fix handleChatMessage classification order (classify BEFORE ensureSessionReady)</name>
  <files>src/features/session-tracker/index.ts</files>
  <behavior>
    - Test 1: When handleChatMessage is called for a child session (parentID present from SDK), ensureSessionReady is NEVER called
    - Test 2: When handleChatMessage is called for a child session (detected via hierarchyIndex), ensureSessionReady is NEVER called
    - Test 3: When handleChatMessage is called for a child session (detected via pendingRegistry), ensureSessionReady is NEVER called
    - Test 4: When handleChatMessage is called for a MAIN session (no parent, not in hierarchyIndex, not in pendingRegistry), ensureSessionReady IS called
    - Test 5: Child session messages are routed to childWriter.appendChildTurn with correct parentID
  </behavior>
  <action>
Implement D-05: Fix `handleChatMessage()` in `src/features/session-tracker/index.ts` (current lines 383-451) to classify BEFORE calling `ensureSessionReady()`.

**Current bug (lines 394-395):**
```typescript
// Lazy bootstrap: ensure session directory + index exist (cold-start)
await this.ensureSessionReady(input.sessionID)  // ← mkdir BEFORE classification!
```

**Fixed order:**

1. Move the child classification block (currently lines 397-433) ABOVE the call to `ensureSessionReady()` (line 395).

2. The reordered method should work as follows:

```
async handleChatMessage(input, output) {
    // STEP 1: Classify FIRST — is this a child session?
    let parentID: string | undefined
    try {
        const session = await this.getSessionSafely(input.sessionID)
        parentID = (session as { parentID?: string } | undefined)?.parentID
    } catch { /* fall through */ }

    if (!parentID && this.hierarchyIndex) {
        const hierarchyParent = this.hierarchyIndex.getParent(input.sessionID)
        if (hierarchyParent) parentID = hierarchyParent
    }

    // D-04 fix: Gate 3 — check pending dispatch registry
    if (!parentID && this.pendingRegistry?.has(input.sessionID)) {
        // The parent dispatched a task — this is a child session even though
        // the exact parentID isn't resolved yet. The childWriter will need the
        // parentID, so try to get it from the registry.
        const pendingEntry = this.pendingRegistry.get(input.sessionID)
        if (pendingEntry) parentID = pendingEntry.parentSessionID
    }

    if (parentID && this.childWriter) {
        // STEP 2: CHILD session — skip ensureSessionReady entirely (no directory)
        this.bootstrappedSessions.add(input.sessionID)

        // Capture chat message to child .json under ROOT main (D-03)
        const messageRole = (output.message as Record<string, unknown> | null)?.role
        const parts = output.parts as Array<{ type: string; text?: string }>
        const content = parts
            .filter((p) => p.type === "text" && typeof p.text === "string")
            .map((p) => p.text!)
            .join("\n") || (typeof messageRole === "string" ? `[${messageRole} message]` : "unknown")
        await this.childWriter.appendChildTurn(parentID, input.sessionID, {
            turn: 0,  // computed by appendChildTurn
            actor: input.agent || "unknown",
            content,
            tools: [],
        })
        return
    }

    // STEP 3: MAIN session — now it's safe to create directory
    await this.ensureSessionReady(input.sessionID)

    // STEP 4: Capture to main .md (existing messageCapture path)
    if (this.messageCapture) {
        await this.messageCapture.handleChatMessage(
            input as Parameters<MessageCapture["handleChatMessage"]>[0],
            output as Parameters<MessageCapture["handleChatMessage"]>[1],
        )
    }
}
```

3. Critical: The inner try/catch at line 442 must be preserved as the outer wrapper.

4. Do NOT change `handleToolExecuteAfter()` — it already has correct classification-first order (lines 473-507).

5. Do NOT change `ensureSessionReady()` internally — it still needs its own gates as a defense-in-depth for the main session path. The fix here is about NOT calling it at all for child sessions.
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/index.test.ts</automated>
  </verify>
  <done>handleChatMessage calls ensureSessionReady only for main sessions (no parent). Child sessions skip ensureSessionReady and write directly to childWriter. All 5 behavior tests pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| PreToolUse hook → PendingDispatchRegistry | Untrusted callID/sessionID from OpenCode event payload crosses into in-memory Map |
| session.created event → Gate 3 classification | Child session ID from OpenCode SDK event crosses into has() check |
| chat.message event → handleChatMessage | Untrusted sessionID from hook payload; classification gate before I/O |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-01 | Spoofing | PendingDispatchRegistry.has() | mitigate | `byParent.size > 0` is intentionally broad — false positives (child classified as child) are harmless. 30s STALE_THRESHOLD_MS bounds the window. `isValidSessionID()` guard at all entry points. |
| T-04-02 | Denial of Service | PendingDispatchRegistry.byParent | mitigate | Map size bounded by 30s auto-purge on every has() call. Maximum entries = number of concurrent dispatches (typically <10). cleanupStale() removes expired entries. |
| T-04-03 | Tampering | handleChatMessage parentID | mitigate | parentID resolution uses SDK `getSession()` (authoritative) with hierarchyIndex and pendingRegistry as fallbacks. Invalid sessionIDs rejected by `isValidSessionID()` guard at method entry. |
| T-04-04 | Information Disclosure | Child session content in .json | accept | Child .json files are stored under ROOT main session directory with same file permissions as main .md files. No PII or secrets. |
</threat_model>

<verification>
1. `npm run typecheck` passes with zero errors
2. `npx vitest run tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts` — all 7 new tests pass
3. `npx vitest run tests/features/session-tracker/index.test.ts` — all existing tests pass, no regressions
4. Manual grep: `grep -c "ensureSessionReady" src/features/session-tracker/index.ts` shows it's only called for main session path in handleChatMessage
</verification>

<success_criteria>
- [ ] PendingDispatchRegistry.has() returns true when any parent has pending dispatches (D-04)
- [ ] handleChatMessage classifies session as child BEFORE calling ensureSessionReady (D-05)
- [ ] No directory created for child sessions detected via any of the three gates
- [ ] All existing tests pass (no regressions)
- [ ] `npm run typecheck` passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-01-SUMMARY.md`
</output>
