---
phase: CP-ST-04
plan: 03
type: execute
wave: 3
depends_on: [CP-ST-04-02]
files_modified:
  - src/features/session-tracker/persistence/hierarchy-manifest.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/types.ts
  - tests/features/session-tracker/persistence/hierarchy-manifest.test.ts
autonomous: true
requirements: [D-06, D-07, D-08]

must_haves:
  truths:
    - "Each root main session directory contains hierarchy-manifest.json tracking all children"
    - "Child .json files are written IMMEDIATELY at session.created (not deferred to PostToolUse)"
    - "hierarchy-manifest.json is the authoritative source for the session tree"
    - "Existing orphan child directories are cleaned up on plugin startup"
    - "Only root main sessions can be resumed (children exist within main context only)"
  artifacts:
    - path: "src/features/session-tracker/persistence/hierarchy-manifest.ts"
      provides: "Hierarchy manifest writer (D-07)"
      min_lines: 100
    - path: "src/features/session-tracker/capture/event-capture.ts"
      provides: "Immediate child .json write at session.created (D-06)"
      min_lines: 430
    - path: "src/features/session-tracker/index.ts"
      provides: "Integrated cleanup on initialize()"
    - path: "src/features/session-tracker/types.ts"
      provides: "HierarchyManifest interface (D-07)"
  key_links:
    - from: "session.created"
      to: "childWriter.createChildFile"
      via: "handleSessionCreated immediate write"
      pattern: "childWriter\\.createChildFile"
    - from: "childWriter.createChildFile"
      to: "hierarchy-manifest.json"
      via: "manifestWriter.addChild"
      pattern: "addChild|updateChildStatus"
    - from: "initialize cleanup"
      to: "orphan directory removal"
      via: "cleanupOrphanDirectories"
      pattern: "cleanupOrphanDirectories"
---

<objective>
Create the hierarchy manifest system (D-07), implement immediate child .json writing at session.created (D-06), and harden orphan directory cleanup (D-08).

Purpose: The hierarchy-manifest.json is the authoritative source for the session delegation tree — replacing ad-hoc gate decisions. Immediate child .json writing at session.created closes the race window where child data was lost between session.created and PostToolUse.

Output: HierarchyManifest class, immediate child .json creation in handleSessionCreated, enhanced orphan cleanup, hierarchy-manifest.json in each root main directory.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-CONTEXT.md
@.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-01-PLAN.md
@.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-02-PLAN.md

<interfaces>
From src/features/session-tracker/persistence/child-writer.ts (updated in CP-ST-04-02):
```typescript
export class ChildWriter {
  constructor(deps: { projectRoot: string; hierarchyIndex?: HierarchyIndex })
  createChildFile(parentID: string, childID: string, record: ChildSessionRecord): Promise<void>
  appendChildTurn(parentID: string, childID: string, turn: Turn): Promise<void>
  updateChildStatus(parentID: string, childID: string, status: string): Promise<void>
  // Internal: resolveWriteParent resolves to root main (CP-ST-04-02)
}
```

From src/features/session-tracker/persistence/hierarchy-index.ts (updated in CP-ST-04-02):
```typescript
export class HierarchyIndex {
  getRootMain(childID: string): string | undefined
  isChild(sessionID: string): boolean
  registerChild(parentID: string, childID: string): void
  // CP-ST-04-02 additions: childToRootMain map, resolveRootMain helper
}
```

From src/features/session-tracker/types.ts — existing SessionContinuityIndex (lines 191-209):
```typescript
export interface SessionContinuityIndex {
  version: string
  sessionID: string
  lastUpdated: string
  hierarchy: {
    root: string
    children: Record<string, ChildHierarchyEntry>
  }
  turnCount: number
  toolSummary: Record<string, number>
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create hierarchy-manifest.json writer + types</name>
  <files>
    src/features/session-tracker/persistence/hierarchy-manifest.ts
    src/features/session-tracker/types.ts
    tests/features/session-tracker/persistence/hierarchy-manifest.test.ts
  </files>
  <behavior>
    - Test 1: addChild adds a child entry to the manifest with correct fields (sessionID, parentSessionID, depth, status, delegatedBy, createdAt)
    - Test 2: manifest writes to correct path: {rootMainDir}/hierarchy-manifest.json (NEXT TO session-continuity.json, not replacing it)
    - Test 3: updateChildStatus updates status of an existing child entry
    - Test 4: getChildren returns all child entries with their current statuses
    - Test 5: manifest is written atomically (write-to-tmp → rename pattern matching atomic-write)
    - Test 6: getChild returns a single child entry by sessionID
    - Test 7: Multiple children at different depths (L1, L2) are tracked with correct delegationDepth
  </behavior>
  <action>
Implement D-07: Create a new `HierarchyManifest` class that writes `hierarchy-manifest.json` in each root main session directory.

**Relationship to session-continuity.json:** `session-continuity.json` (already exists, written by `SessionIndexWriter`) is the session-local index with hierarchy tree, turn counts, and tool summaries. `hierarchy-manifest.json` is a flattened, authoritative list of all children for that root main session — optimized for quick lookup and resume. They coexist; `hierarchy-manifest.json` replaces ad-hoc gate decisions.

**In `src/features/session-tracker/types.ts`:**

Add new types:
```typescript
/** A single child entry in the hierarchy manifest (D-07). */
export interface HierarchyManifestChild {
  /** Child session ID. */
  sessionID: string
  /** Immediate parent session ID. */
  parentSessionID: string
  /** Root main session ID (the directory owner). */
  rootMainSessionID: string
  /** Delegation depth (1 = L1, 2 = L2, etc.). */
  delegationDepth: number
  /** Who delegated this child (agent name). */
  delegatedBy: string
  /** Subagent type dispatched (e.g., "hm-l2-researcher"). */
  subagentType: string
  /** ISO 8601 timestamp of child session creation. */
  createdAt: string
  /** ISO 8601 timestamp of last update. */
  updatedAt: string
  /** Session status: active | idle | completed | error | aborted | cancelled. */
  status: string
  /** Turn count for this child session. */
  turnCount: number
  /** Filename of the child .json file. */
  childFile: string
}

/** Hierarchy manifest — authoritative source for the session tree (D-07). */
export interface HierarchyManifest {
  /** Schema version. */
  version: string
  /** Root main session ID that owns this manifest. */
  rootMainSessionID: string
  /** ISO 8601 timestamp of last manifest update. */
  lastUpdated: string
  /** Flattened map of all children (L1, L2, ...) keyed by sessionID. */
  children: Record<string, HierarchyManifestChild>
  /** Total number of child sessions. */
  totalChildren: number
  /** Maximum delegation depth observed. */
  maxDepth: number
}
```

**Create `src/features/session-tracker/persistence/hierarchy-manifest.ts`:**

```typescript
/**
 * Hierarchy manifest writer for D-07.
 *
 * Writes hierarchy-manifest.json in each root main session directory.
 * This is the AUTHORITATIVE source for the session delegation tree,
 * replacing ad-hoc gate decisions.
 *
 * Uses atomic-write pattern (write-to-tmp → rename) matching
 * the atomicWriteJson utility.
 */
import { writeFile, rename, mkdir } from "node:fs/promises"
import { readFile } from "node:fs/promises"
import { dirname } from "node:path"
import { safeSessionPath } from "./atomic-write.js"
import type { HierarchyManifest, HierarchyManifestChild } from "../types.js"

export class HierarchyManifestWriter {
  private projectRoot: string

  constructor(deps: { projectRoot: string }) {
    this.projectRoot = deps.projectRoot
  }

  /**
   * Adds or updates a child entry in the root main's hierarchy-manifest.json.
   */
  async addChild(params: {
    rootMainSessionID: string
    childSessionID: string
    parentSessionID: string
    delegationDepth: number
    delegatedBy: string
    subagentType: string
    childFile: string
  }): Promise<void> {
    const manifest = await this.loadManifest(params.rootMainSessionID)
    const now = new Date().toISOString()

    const entry: HierarchyManifestChild = {
      sessionID: params.childSessionID,
      parentSessionID: params.parentSessionID,
      rootMainSessionID: params.rootMainSessionID,
      delegationDepth: params.delegationDepth,
      delegatedBy: params.delegatedBy,
      subagentType: params.subagentType,
      createdAt: now,
      updatedAt: now,
      status: "active",
      turnCount: 0,
      childFile: params.childFile,
    }

    manifest.children[params.childSessionID] = entry
    manifest.totalChildren = Object.keys(manifest.children).length
    manifest.maxDepth = Math.max(
      manifest.maxDepth,
      params.delegationDepth,
    )
    manifest.lastUpdated = now

    await this.writeManifest(params.rootMainSessionID, manifest)
  }

  /**
   * Updates the status of a child in the manifest.
   */
  async updateChildStatus(
    rootMainSessionID: string,
    childSessionID: string,
    status: string,
  ): Promise<void> {
    const manifest = await this.loadManifest(rootMainSessionID)
    const entry = manifest.children[childSessionID]
    if (!entry) return
    entry.status = status
    entry.updatedAt = new Date().toISOString()
    manifest.lastUpdated = entry.updatedAt
    await this.writeManifest(rootMainSessionID, manifest)
  }

  /**
   * Returns all child entries from the manifest.
   */
  async getChildren(
    rootMainSessionID: string,
  ): Promise<Record<string, HierarchyManifestChild>> {
    const manifest = await this.loadManifest(rootMainSessionID)
    return manifest.children
  }

  /**
   * Returns a single child entry, or undefined.
   */
  async getChild(
    rootMainSessionID: string,
    childSessionID: string,
  ): Promise<HierarchyManifestChild | undefined> {
    const manifest = await this.loadManifest(rootMainSessionID)
    return manifest.children[childSessionID]
  }

  // Private helpers — atomic read/write

  private async loadManifest(rootMainSessionID: string): Promise<HierarchyManifest> {
    const filePath = safeSessionPath(
      this.projectRoot,
      rootMainSessionID,
      "hierarchy-manifest.json",
    )
    try {
      const raw = await readFile(filePath, "utf-8")
      return JSON.parse(raw) as HierarchyManifest
    } catch {
      return {
        version: "1.0",
        rootMainSessionID,
        lastUpdated: new Date().toISOString(),
        children: {},
        totalChildren: 0,
        maxDepth: 0,
      }
    }
  }

  private async writeManifest(
    rootMainSessionID: string,
    manifest: HierarchyManifest,
  ): Promise<void> {
    const filePath = safeSessionPath(
      this.projectRoot,
      rootMainSessionID,
      "hierarchy-manifest.json",
    )
    const tmpPath = filePath + ".tmp." + Date.now().toString(36)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(tmpPath, JSON.stringify(manifest, null, 2), "utf-8")
    await rename(tmpPath, filePath)
  }
}
```

**Create test file `tests/features/session-tracker/persistence/hierarchy-manifest.test.ts`:**

Write tests using vitest globals, using a temp directory for each test. Test all 7 behaviors listed above. Use `safeSessionPath` to construct temp paths. Clean up after each test.
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/hierarchy-manifest.test.ts</automated>
  </verify>
  <done>HierarchyManifestWriter creates hierarchy-manifest.json in root main directories. All 7 behavior tests pass. Atomic write pattern used. Types exported from types.ts.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Immediate child .json write at session.created + manifest integration</name>
  <files>
    src/features/session-tracker/capture/event-capture.ts
    src/features/session-tracker/index.ts
    src/features/session-tracker/persistence/hierarchy-manifest.ts
  </files>
  <behavior>
    - Test 1: When session.created fires for a child session, the child .json file is written IMMEDIATELY (before the handler returns)
    - Test 2: The child .json is written under the ROOT main session directory (not the immediate parent)
    - Test 3: hierarchy-manifest.json is updated with the child entry at the same time
    - Test 4: When session.created fires for a main session (root), no child .json is written (normal directory creation path)
    - Test 5: The child .json contains delegatedBy metadata from the PendingDispatchRegistry
    - Test 6: Subsequent events (chat, tool) append turns to the already-existing child .json
    - Test 7: handleSessionCreated does NOT create a directory when immediate .json write succeeds
  </behavior>
  <action>
Implement D-06: Write child .json files IMMEDIATELY when `session.created` fires, not deferred to PostToolUse. Integrate with the new HierarchyManifest.

**Current behavior (broken):**
- `session.created` fires → Gate 3 fails → orphan directory created (CP-ST-02 bug)
- PostToolUse `handleTask()` writes child .json — but directory already exists
- Child data between `session.created` and PostToolUse is lost (no file exists yet)

**Target behavior (D-06):**
- `session.created` fires → Gates 1-3 now correctly detect child (CP-ST-04-01) → write child .json IMMEDIATELY → update hierarchy-manifest.json
- PostToolUse `handleTask()` appends to already-existing child .json (idempotent update)
- No directory created at any point

**In `src/features/session-tracker/capture/event-capture.ts` — `handleSessionCreated()`:**

1. After Gate 1 passes (parentID detected at line 197-200), add immediate child .json creation:

```typescript
if (parentID) {
    // Child session — D-06: write child .json IMMEDIATELY
    // (not deferred to PostToolUse handleTask)
    if (this.childWriter && this.sessionIndexWriter) {
        try {
            const now = new Date().toISOString()
            const pendingEntry = this.pendingRegistry?.get(sessionID)

            // Resolve root main for .json placement (CP-ST-04-02)
            // Use parentID as immediate parent; childWriter.resolveWriteParent
            // resolves to root main internally
            await this.childWriter.createChildFile(parentID, sessionID, {
                sessionID,
                parentSessionID: parentID,
                delegationDepth: 1, // Will be refined by PostToolUse if deeper
                delegatedBy: {
                    agentName: pendingEntry?.subagentType || "unknown",
                    model: "",
                    tool: "task",
                    description: "",
                    subagentType: pendingEntry?.subagentType || "unknown",
                },
                created: now,
                updated: now,
                status: "active",
                mainAgent: { name: "pending", model: "" },
                turns: [],
                children: [],
            })

            // D-07: update hierarchy-manifest.json
            if (this.hierarchyIndex) {
                const rootMain = this.hierarchyIndex.getRootMain(sessionID)
                if (rootMain && this.manifestWriter) {
                    await this.manifestWriter.addChild({
                        rootMainSessionID: rootMain,
                        childSessionID: sessionID,
                        parentSessionID: parentID,
                        delegationDepth: 1,
                        delegatedBy: pendingEntry?.subagentType || "unknown",
                        subagentType: pendingEntry?.subagentType || "unknown",
                        childFile: `${sessionID}.json`,
                    })
                }
            }
        } catch {
            // Best-effort: child .json creation failure is non-fatal
            void this.client.app?.log?.({
                body: {
                    service: "session-tracker",
                    level: "warn",
                    message: `[Harness] Session tracker: immediate child .json write failed for "${sessionID}"`,
                },
            })
        }
    }
    return // Skip directory creation (already correctly returns here)
}
```

2. Add `manifestWriter` as a dependency to `EventCapture`:
   - Add `manifestWriter?: HierarchyManifestWriter` to the constructor deps interface
   - Store as private field

**In `src/features/session-tracker/index.ts` — `initialize()` (line 678):**

3. Create `HierarchyManifestWriter` instance:
   ```typescript
   const manifestWriter = new HierarchyManifestWriter({
     projectRoot: this.projectRoot,
   })
   ```

4. Pass `manifestWriter` to `EventCapture` constructor (line 701-709):
   ```typescript
   this.eventCapture = new EventCapture({
     client: this.client,
     sessionWriter: this.sessionWriter,
     childWriter: this.childWriter,
     sessionIndexWriter: this.sessionIndexWriter,
     projectIndexWriter: this.projectIndexWriter,
     hierarchyIndex: this.hierarchyIndex,
     pendingRegistry: this.pendingRegistry,
     manifestWriter,  // D-07
   })
   ```

**In `src/features/session-tracker/capture/tool-capture.ts`:**

5. In `handleTask()`: the existing child .json is already created by `handleSessionCreated`. The method should check if the .json exists and update the `delegatedBy` and `mainAgent` metadata that wasn't available at session.created time. Add an `appendDelegatedBy` or update call rather than creating a new file.

**In `src/features/session-tracker/capture/event-capture.ts` — `handleSessionIdle/Deleted/Error`:**

6. After existing child status updates, also update the hierarchy-manifest.json:
   ```typescript
   // After childWriter.updateChildStatus call:
   if (this.manifestWriter && this.hierarchyIndex) {
       const rootMain = this.hierarchyIndex.getRootMain(sessionID)
       if (rootMain) {
           await this.manifestWriter.updateChildStatus(rootMain, sessionID, "idle")
       }
   }
   ```
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/capture/event-capture.test.ts tests/features/session-tracker/capture/event-capture-child.test.ts</automated>
  </verify>
  <done>Child .json files written immediately at session.created. hierarchy-manifest.json updated with each child event. All 7 behavior tests pass. No orphan directories created.</done>
</task>

<task type="auto">
  <name>Task 3: Harden orphan directory cleanup + end-to-end verification</name>
  <files>
    src/features/session-tracker/index.ts
    tests/features/session-tracker/integration/e2e-verification.test.ts
  </files>
  <action>
Harden the existing `cleanupOrphanDirectories()` method and add end-to-end verification.

**In `src/features/session-tracker/index.ts` — `cleanupOrphanDirectories()` (lines 853-895):**

1. Current implementation removes directories where `hierarchyIndex.isChild()` returns true. Enhance:
   - Also check `pendingRegistry` (though it's in-memory, not persisted — may not help on restart)
   - Add check: if a directory has NO `session-continuity.json` but children exist in another directory's index, it's an orphan
   - Log each directory removal with reason and sessionID for audit trail

2. The enhanced cleanup:
   ```typescript
   private async cleanupOrphanDirectories(): Promise<void> {
     const { readdir, rm, access } = await import("node:fs/promises")
     const trackerRoot = sessionTrackerRoot(this.projectRoot)
     
     // ... existing directory scan ...
     
     for (const entry of entries) {
       if (!entry.isDirectory()) continue
       const sessionID = entry.name
       if (!isValidSessionID(sessionID)) continue
       
       let isOrphan = false
       let reason = ""
       
       // Check 1: hierarchyIndex classifies as child
       if (this.hierarchyIndex?.isChild(sessionID)) {
         isOrphan = true
         reason = "classified as child by HierarchyIndex"
       }
       
       // Check 2: No session-continuity.json in directory (indicates
       // it was created by the race condition, not a real main session)
       if (!isOrphan) {
         const indexPath = safeSessionPath(this.projectRoot, sessionID, "session-continuity.json")
         try {
           await access(indexPath)
           // Has session-continuity.json — might be a legitimate main session
         } catch {
           // No session-continuity.json — likely orphan from race condition
           // Only remove if the session ID appears as a child in another directory
           if (this.hierarchyIndex?.isChild(sessionID)) {
             isOrphan = true
             reason = "no session-continuity.json + classified as child"
           }
         }
       }
       
       if (isOrphan) {
         const dirPath = resolve(trackerRoot, sessionID)
         try {
           await rm(dirPath, { recursive: true, force: true })
           void this.client.app?.log?.({
             body: {
               service: "session-tracker",
               level: "info",
               message: `[Harness] Session tracker: removed orphan directory "${sessionID}" (${reason})`,
             },
           })
         } catch {
           // Best-effort
         }
       }
     }
   }
   ```

3. The cleanup runs during `initialize()` at line 762 (already in place).

**End-to-end verification (update `tests/features/session-tracker/integration/e2e-verification.test.ts`):**

4. Add scenario tests (may require mocking OpenCode SDK):
   - Scenario: task dispatch → session.created for child → child .json exists, no directory exists
   - Scenario: parent with 3 children → all 3 .json files under root main directory
   - Scenario: restart (re-initialize) → orphan directories cleaned up
   - Scenario: grandchild (L2) → .json under root main, not under L1 parent

5. If the e2e test file doesn't exist, create it in the integration directory.

**Regression check:**

6. Run ALL session-tracker tests:
   ```bash
   npx vitest run tests/features/session-tracker/
   ```
   Expected: all 27+ test files pass. No regressions from CP-ST-04-01 or CP-ST-04-02 changes.

7. Typecheck: `npm run typecheck` — zero errors.
  </action>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/</automated>
  </verify>
  <done>Orphan cleanup removes directories for sessions classified as children. End-to-end tests verify: child .json written immediately, no orphan directories created, grandchild stored under root main. All session-tracker tests pass (no regressions).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| hierarchy-manifest.json → file system read/write | Manifest content crosses from memory to disk; atomic write prevents corruption |
| session.created → immediate child .json write | Child ID from SDK event crosses into filesystem write |
| orphan cleanup → directory removal | HierarchyIndex classification crosses into `rm -rf` on disk |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04-09 | Tampering | hierarchy-manifest.json corruption | mitigate | Atomic write (write-to-tmp → rename) prevents partial writes. `loadManifest` returns empty manifest on parse failure (graceful degradation). |
| T-04-10 | Denial of Service | orphan directory removal | mitigate | `isValidSessionID` guard prevents path-injection. `rm` with `force: true` is bounded to one directory per sessionID. HierarchyIndex limits the set of removable directories to known children. |
| T-04-11 | Spoofing | Immediate child .json write | mitigate | `isValidSessionID` validates sessionID before any filesystem operation. `delegatedBy` metadata sourced from PendingDispatchRegistry (PreToolUse data), not untrusted input. |
| T-04-12 | Information Disclosure | hierarchy-manifest.json content | accept | Manifest contains session IDs, statuses, and delegation metadata — same level of sensitivity as session-continuity.json. Stored with same filesystem permissions. |
</threat_model>

<verification>
1. `npm run typecheck` passes with zero errors
2. `npx vitest run tests/features/session-tracker/` — all tests pass, no regressions
3. Verify hierarchy-manifest.json is created in each root main directory
4. Verify orphan directories are cleaned up on re-initialization
5. Manual check: grep for `createSessionDir` in event-capture.ts — only called in main session path (line 221)
</verification>

<success_criteria>
- [ ] hierarchy-manifest.json exists in every root main session directory (D-07)
- [ ] Child .json files written immediately at session.created (D-06)
- [ ] Manifest updated with every child status change
- [ ] Orphan directories cleaned up on startup
- [ ] All 27+ session-tracker test files pass
- [ ] `npm run typecheck` passes
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-04-session-tracker-architecture-fix/CP-ST-04-03-SUMMARY.md`
</output>
