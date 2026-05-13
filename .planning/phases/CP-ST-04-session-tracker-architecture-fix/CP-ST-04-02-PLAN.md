---
phase: CP-ST-04
plan: 02
type: execute
wave: 2
depends_on: [CP-ST-04-01]
files_modified:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/persistence/hierarchy-index.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - src/features/session-tracker/types.ts
autonomous: true
requirements: [D-02, D-03, D-05, D-08]

must_haves:
  truths:
    - "Only root sessions (user turn-1, no parent) get their own directory"
    - "All delegated sessions (child, grandchild) are stored as .json under the ROOT main session directory"
    - "HierarchyIndex tracks the root main session ID for every registered child"
    - "ChildWriter resolves and uses the ROOT main session for .json placement"
  artifacts:
    - path: "src/features/session-tracker/index.ts"
      provides: "ensureSessionReady with strict root-only directory creation"
      min_lines: 980
    - path: "src/features/session-tracker/capture/event-capture.ts"
      provides: "handleSessionCreated with root-only directory creation"
      min_lines: 400
    - path: "src/features/session-tracker/persistence/hierarchy-index.ts"
      provides: "Root main session tracking for children"
      contains: "getRootMain"
    - path: "src/features/session-tracker/types.ts"
      provides: "rootMainSessionID in ChildHierarchyEntry and ChildSessionRecord"
  key_links:
    - from: "session.created for child"
      to: "childWriter.createChildFile under ROOT main"
      via: "hierarchyIndex.getRootMain"
      pattern: "getRootMain"
    - from: "handleChatMessage for child"
      to: "childWriter.appendChildTurn under ROOT main"
      via: "hierarchyIndex.getRootMain"
      pattern: "getRootMain"
    - from: "handleToolExecuteAfter for child"
      to: "toolCapture recording under ROOT main"
      via: "hierarchyIndex.getRootMain"
      pattern: "getRootMain"
---

<objective>
Enforce the directory architecture: only sessions with a real user turn and no parent get directories (D-02, D-03). All delegated sessions (children, grandchildren) are stored exclusively as .json files under the ROOT main session's directory. HierarchyIndex is extended to track the root main session for every child.

Purpose: D-02 and D-03 together define a strict rule: directory = user turn 1 + root session. Everything else is a .json file. The current code has a "conservative fallback" (index.ts line 199-207) that creates directories when classification is uncertain — this must be removed.

Output: ensureSessionReady and handleSessionCreated are hardened; HierarchyIndex tracks root-main relationships; childWriter uses root main for .json placement.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-CONTEXT.md
@.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-01-PLAN.md

<interfaces>
From src/features/session-tracker/persistence/hierarchy-index.ts (lines 48-174):
```typescript
export class HierarchyIndex {
  private childToParent: Map<string, string> = new Map()

  buildFromDisk(): Promise<void>
  isChild(sessionID: string): boolean
  getParent(sessionID: string): string | undefined
  registerChild(parentID: string, childID: string): void
  getChildren(parentID: string): string[]
  getDepth(sessionID: string): number
}
```

From src/features/session-tracker/persistence/child-writer.ts (interface needed):
```typescript
export class ChildWriter {
  createChildFile(parentID: string, childID: string, record: ChildSessionRecord): Promise<void>
  appendChildTurn(parentID: string, childID: string, turn: Turn): Promise<void>
  updateChildStatus(parentID: string, childID: string, status: string): Promise<void>
  // Internal: writes to safeSessionPath(root, parentID, `${childID}.json`)
}
```

From src/features/session-tracker/types.ts — ChildHierarchyEntry (lines 173-184):
```typescript
export interface ChildHierarchyEntry {
  file: string
  depth: number
  status: string
  delegatedBy: string
  children: Record<string, ChildHierarchyEntry>
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add root main session tracking to HierarchyIndex</name>
  <files>
    src/features/session-tracker/persistence/hierarchy-index.ts
    src/features/session-tracker/types.ts
  </files>
  <behavior>
    - Test 1: getRootMain(childID) returns the root main session ID when child→parent→root chain exists
    - Test 2: getRootMain(childID) returns undefined when chain is incomplete (no root registered)
    - Test 3: getRootMain(directChildID) returns the main session ID when child was registered with a main session as parent
    - Test 4: registerChild(parentID, childID) automatically resolves and stores the root main for the child
    - Test 5: buildFromDisk populates rootMain tracking from session-continuity.json files
  </behavior>
  <action>
Implement D-03 and D-08: Extend HierarchyIndex to track the root main session for every registered child.

**In `src/features/session-tracker/persistence/hierarchy-index.ts`:**

1. Add a new private field:
   ```typescript
   /** childID → rootMainSessionID map */
   private childToRootMain: Map<string, string> = new Map()
   ```

2. Add a new public method:
   ```typescript
   /**
    * Returns the root main session ID for a child session.
    * Traverses the child→parent chain to find the session with delegationDepth 0
    * or the outermost parent (which owns the directory).
    *
    * Returns undefined if the root main session is not known (e.g., registered
    * before the parent chain was fully established).
    */
   getRootMain(childID: string): string | undefined {
     return this.childToRootMain.get(childID)
   }
   ```

3. Modify `registerChild(parentID: string, childID: string): void`:
   - After storing `this.childToParent.set(childID, parentID)`, resolve the root main:
   ```typescript
   // Resolve root main: if parent is a root (not in childToParent),
   // parentID is the root main. If parent is also a child, chain up.
   const parentRootMain = this.childToRootMain.get(parentID)
   const rootMain = parentRootMain ?? (this.childToParent.has(parentID) ? undefined : parentID)
   if (rootMain) {
     this.childToRootMain.set(childID, rootMain)
   }
   ```

4. Modify `buildFromDisk()`: After scanning all `session-continuity.json` files and registering children, perform a second pass to resolve rootMain for all registered children:
   ```typescript
   // Second pass: resolve root main for each child
   for (const [childID] of this.childToParent) {
     if (!this.childToRootMain.has(childID)) {
       const root = this.resolveRootMain(childID)
       if (root) this.childToRootMain.set(childID, root)
     }
   }
   ```

5. Add a private helper:
   ```typescript
   private resolveRootMain(childID: string): string | undefined {
     let current = childID
     const visited = new Set<string>()
     while (this.childToParent.has(current) && !visited.has(current)) {
       visited.add(current)
       current = this.childToParent.get(current)!
     }
     // current is now the outermost node — if it's NOT in childToParent, it's a root
     return this.childToParent.has(current) ? undefined : current
   }
   ```

**In `src/features/session-tracker/types.ts`:**

No structural changes needed. The `ChildHierarchyEntry` type already has `file`, `depth`, `status`, `delegatedBy`, and `children` fields. The root main tracking is internal to HierarchyIndex — not serialized into continuity JSON files. However, if the current `session-continuity.json` schema tracks a `root` field (as seen in `SessionContinuityIndex.hierarchy.root` at types.ts line 201), ensure that field is correctly populated when writing session-continuity.json.

**Test file:** Create or update `tests/features/session-tracker/persistence/hierarchy-index.test.ts` with the 5 test behaviors listed above.
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts</automated>
  </verify>
  <done>HierarchyIndex.getRootMain() resolves the root main session for any registered child. All 5 behavior tests pass. No changes to serialized continuity JSON format.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Enforce root-only directory creation in ensureSessionReady and handleSessionCreated</name>
  <files>
    src/features/session-tracker/index.ts
    src/features/session-tracker/capture/event-capture.ts
  </files>
  <behavior>
    - Test 1: ensureSessionReady creates a directory for a main session (no parent, not in hierarchyIndex, not in pendingRegistry)
    - Test 2: ensureSessionReady does NOT create a directory for a child session (parentID present)
    - Test 3: ensureSessionReady does NOT create a directory when hierarchyIndex.isChild() returns true
    - Test 4: ensureSessionReady does NOT create a directory when pendingRegistry.has() returns true (CP-ST-04-01 fix)
    - Test 5: handleSessionCreated skips directory creation for sessions where any gate classifies it as a child
    - Test 6: The "conservative fallback" warning log at index.ts line 199-207 is REMOVED — when a session is uncertain, it is NOT treated as a main session
    - Test 7: When all three gates fail and no parentID is found, the session is treated as MAIN (directory created) — this is the ONLY path that creates directories
  </behavior>
  <action>
Implement D-02 and D-05: Harden both `ensureSessionReady()` and `handleSessionCreated()` to enforce root-only directory creation.

**In `src/features/session-tracker/index.ts` — `ensureSessionReady()` (lines 138-236):**

1. Remove the "conservative fallback" block at lines 199-207:
   ```typescript
   // DELETE this entire block:
   void this.client.app?.log?.({
     body: { ... message: `... cannot determine parentID ... treating as main session (conservative fallback)` ... }
   })
   ```
   Replace with:
   ```typescript
   // All three gates failed (SDK parentID, hierarchyIndex, pendingRegistry).
   // Treat as root main session — create directory.
   // This is the ONLY path that creates directories (D-02).
   ```

2. The existing gate checks at lines 151-197 are in the correct order and already function correctly after CP-ST-04-01. Verify that:
   - Gate 1 (lines 151-165): SDK parentID → skip directory
   - Gate 2 (lines 183-186): hierarchyIndex.isChild() → skip directory
   - Gate 3 (lines 194-197): pendingRegistry.has() → skip directory (NOW WORKING after CP-ST-04-01)
   - Fallthrough (lines 199-235): creates directory ONLY when all gates pass (root main session)

3. In the bootstrappedSessions tracking (lines 170-171, 184-185, 195-196): keep marking child sessions as bootstrapped — this prevents re-checking on subsequent events.

**In `src/features/session-tracker/capture/event-capture.ts` — `handleSessionCreated()` (lines 177-248):**

4. The three-gate check at lines 179-237 is structurally correct — it already classifies before creating directories. However, add the D-05 hardening:
   - After Gate 3 passes (line 215-218), explicitly log that this is a root main session:
   ```typescript
   // Root main session — create subdirectory + .md file (D-02)
   void this.client.app?.log?.({
     body: {
       service: "session-tracker",
       level: "info",
       message: `[Harness] Session tracker: creating root main session directory for "${sessionID}"`,
     },
   })
   ```

5. Ensure that the `parentID` check at lines 197-200 correctly returns (no directory) when parentID is non-null.

**Critical invariant to maintain:**
- `ensureSessionReady()` is called from `handleChatMessage()` (main sessions only, after CP-ST-04-01 fix) and `handleToolExecuteAfter()` (main sessions only, already correct)
- `handleSessionCreated()` is called from the `session.created` event — applies to ALL sessions
- Both MUST agree: child = no directory. CP-ST-04-01 fixed `handleChatMessage` to classify first. This task removes the "conservative fallback" that was a safety valve for the broken Gate 3.

**No changes to:**
- `handleToolExecuteAfter()` — already has correct classification-first order
- `handleChatMessage()` — fixed in CP-ST-04-01
- `handleSessionEvent()` — delegates correctly to eventCapture
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/index.test.ts tests/features/session-tracker/capture/event-capture.test.ts tests/features/session-tracker/capture/event-capture-child.test.ts</automated>
  </verify>
  <done>Only root main sessions get directories. Child sessions NEVER trigger mkdir through ensureSessionReady or handleSessionCreated. All 7 behavior tests pass. No "conservative fallback" warning remains.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Route child .json writes to root main session directory</name>
  <files>
    src/features/session-tracker/persistence/child-writer.ts
    src/features/session-tracker/capture/tool-capture.ts
    src/features/session-tracker/capture/event-capture.ts
  </files>
  <behavior>
    - Test 1: childWriter.createChildFile writes {childID}.json under the ROOT main session directory (not immediate parent)
    - Test 2: childWriter.appendChildTurn writes turn data to the .json under the ROOT main session directory
    - Test 3: When childWriter receives an L2 grandchild's parentID (which is an L1 child), it resolves the root main and writes under that root
    - Test 4: tool-capture.handleTask passes rootMainID to childWriter when writing child .json
    - Test 5: event-capture child status updates use rootMainID for childWriter calls
  </behavior>
  <action>
Implement D-03: Route all child .json writes to the root main session directory, not the immediate parent. All child sessions (L1, L2, ...) are stored as flat `.json` files under their root main session directory.

**In `src/features/session-tracker/persistence/child-writer.ts`:**

1. Add a new dependency `hierarchyIndex` to the ChildWriter constructor:
   ```typescript
   import type { HierarchyIndex } from "./hierarchy-index.js"

   constructor(deps: { projectRoot: string; hierarchyIndex?: HierarchyIndex }) {
     this.hierarchyIndex = deps.hierarchyIndex
   }
   ```

2. Add a `resolveWriteParent()` helper:
   ```typescript
   /**
    * Resolves the correct parent directory for a child .json file.
    * Per D-03: all children are stored under the ROOT main session directory,
    * not the immediate parent.
    */
   private resolveWriteParent(childID: string, immediateParentID: string): string {
     if (this.hierarchyIndex) {
       const rootMain = this.hierarchyIndex.getRootMain(childID)
       if (rootMain) return rootMain
     }
     // Fallback: if root main not resolved, use immediate parent
     return immediateParentID
   }
   ```

3. Update `createChildFile()`, `appendChildTurn()`, and `updateChildStatus()` to call `resolveWriteParent()` before computing the file path. The parentID parameter passed by callers is the immediate parent — resolve it to root main before writing.

**In `src/features/session-tracker/capture/tool-capture.ts`:**

4. Pass `hierarchyIndex` to `childWriter` calls. The `handleTask()` method already passes `parentID` (the immediate parent session). The `childWriter` now resolves this to root main internally.

**In `src/features/session-tracker/capture/event-capture.ts`:**

5. The child status update calls (handleSessionIdle at line 267, handleSessionDeleted at line 304, handleSessionError at line 340) pass `parentID` to `childWriter.updateChildStatus()`. With the new `resolveWriteParent()` in childWriter, these will automatically target the root main directory.

**In `src/features/session-tracker/index.ts` — `initialize()` (lines 678-784):**

6. Pass `hierarchyIndex` to `ChildWriter` constructor at line 682:
   ```typescript
   this.childWriter = new ChildWriter({
     projectRoot: this.projectRoot,
     hierarchyIndex: this.hierarchyIndex,
   })
   ```

7. Verify that `handleChatMessage()` (already fixed in CP-ST-04-01) passes the immediate parentID to `childWriter.appendChildTurn()` — the new `resolveWriteParent()` handles routing to root main.

**File structure example after this fix:**
```
.hivemind/session-tracker/
├── project-continuity.json
├── ses_ROOT123/                          ← L0 main (user turn 1, has dir)
│   ├── ses_ROOT123.md
│   ├── session-continuity.json
│   ├── ses_CHILD456.json                 ← L1 child under ROOT
│   └── ses_GRANDCHILD789.json            ← L2 grandchild under ROOT
```

Note: `ses_CHILD456/` and `ses_GRANDCHILD789/` directories no longer exist. The `.json` files live flat under the ROOT main directory.
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/child-writer.test.ts tests/features/session-tracker/capture/tool-capture.test.ts tests/features/session-tracker/capture/tool-capture-child.test.ts</automated>
  </verify>
  <done>All child .json files are written under the ROOT main session directory. ChildWriter.resolveWriteParent correctly chains up to root main. All 5 behavior tests pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| HierarchyIndex.getRootMain → file path construction | Returned rootMainID used in safeSessionPath for child .json placement |
| ChildWriter.resolveWriteParent → filesystem write | Resolved parent ID used as directory component in atomic-write path |
| session.created → handleSessionCreated | Event payload crosses from SDK into classification gate before directory creation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-05 | Tampering | HierarchyIndex.resolveRootMain() | mitigate | Cycle detection via `visited` Set prevents infinite loops. Returns undefined for incomplete chains — child .json falls back to immediate parent directory. |
| T-04-06 | Elevation of Privilege | ChildWriter file path construction | mitigate | `safeSessionPath()` and `sanitizeSessionID()` guards at atomic-write boundary prevent path traversal. `isValidSessionID()` rejects ".." and absolute paths. |
| T-04-07 | Denial of Service | ensureSessionReady directory creation | mitigate | `bootstrappedSessions` Set ensures mkdir called at most once per session. `isValidSessionID` guard rejects invalid input at entry. No unbounded directory creation. |
| T-04-08 | Information Disclosure | Child .json under root main directory | accept | Same filesystem permissions as main .md files. No elevated access. Child session content is isomorphic to what would have been in an orphan directory. |
</threat_model>

<verification>
1. `npm run typecheck` passes with zero errors
2. `npx vitest run tests/features/session-tracker/` — all 27+ test files pass, no regressions
3. Grep for `mkdir\|createSessionDir` in ensureSessionReady and handleSessionCreated paths — only on main session fallthrough
4. Grep for `resolveWriteParent` in child-writer.ts — confirms root main resolution
</verification>

<success_criteria>
- [ ] No directory created for any child session (D-02)
- [ ] All child .json files stored under ROOT main session directory (D-03)
- [ ] HierarchyIndex.getRootMain() resolves correctly for all registered children
- [ ] ChildWriter routes writes through resolveWriteParent
- [ ] All existing tests pass (no regressions)
- [ ] `npm run typecheck` passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-02-SUMMARY.md`
</output>
