# Phase 21 Research: Session-Tracker Design Fix

**Researched:** 2026-05-21
**Domain:** Session-tracker persistence layer — atomic writes, hierarchy index, manifest, child metadata, project index
**Confidence:** HIGH

## Summary

Phase 21 surgically fixes 6 flaw categories (F-01, F-02/F-17, F-07, F-13, F-18, F-19) in the session-tracker persistence layer. All 8 gray area decisions (G-1 through G-8) have been resolved. The implementation is organized into 6 sequential plans that touch 6 source files (plus test files). Critical correctness constraints exist across plans — particularly the ordering between Plan 02 (manifest derivative cache) and downstream plans that depend on the continuity tree being stable.

**Primary recommendation:** Execute plans in the SPEC-defined order (Plan 01 → 02 → 03 → 04 → 05 → 06), with Plan 02 serving as the architectural prerequisite that unblocks manifest and childCount correctness. Plan 01 (temp fix) and Plan 05 (gate removal) can run in parallel with any plan.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (from G-1 through G-8)
- **G-1:** Manifest = derivative cache. Generate from continuity tree on read. Remove write-side `addChild()` calls.
- **G-2:** `childToRootMain` = reconstruct from continuity tree via deterministic rebuild function. No new file format.
- **G-3:** `project-continuity.json` = canonical status authority. P21 fixes F-14 precondition (stop status overwrite on hook callback). Full unification deferred to P22.
- **G-4:** Remove `commit_docs` gate from `delegation-persistence.ts:58-64`. Keep schema field for GSD framework (162+ refs). The SPEC says "keep the `commit_docs` schema field for GSD external use."
- **G-5:** Clean temp after EVERY write + volume validation. Defense-in-depth.
- **G-6:** No parent in continuity tree = orphan definition. P21: warning-only guardrail when quarantining a child that has continuity entry.
- **G-7:** Keep depth=2 cap with runtime warning at truncation point (`Math.min(depth, 2)` in `hierarchy-index.ts:299`).
- **G-8:** Defer per-session timestamps to P22. Document known limitation.

### the agent's Discretion
- Config key name for delegation persistence gate: the G-4 resolution says "Remove the gate entirely. `persistDelegations()` always writes to disk. Keep `commit_docs` schema field for GSD framework." No new config key needed — simply delete the `if (!config.commit_docs) return` lines.

### Deferred Ideas (OUT OF SCOPE)
- Historical data backfill (repairing 122 zero-entry childCount records, 33 quarantined directories) — P24/P22 territory
- Per-entry timestamps in project-continuity.json — P22
- Full status unification — P22
- quarantine algorithm redesign — P24
- depth cap removal — P23
</user_constraints>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Temp file cleanup | Persistence (atomic-write.ts) | — | Post-rename `unlink()` is a local filesystem operation |
| Cross-volume rename validation | Persistence (atomic-write.ts) | — | `stat()` on tmp vs target paths ensures atomic rename |
| Manifest generation | Persistence (hierarchy-manifest.ts) | Hierarchy index | Manifest derived from continuity tree; index owns hierarchy topology |
| childCount computation | Persistence (project-index-writer.ts) | Hierarchy index | Project index writes `childCount`; index provides child count |
| Child metadata capture | Capture (event-capture.ts) | Persistence (child-writer.ts) | Event-capture receives delegation metadata at session.created |
| Backfill on completion | Capture (event-capture.ts) | Persistence (child-writer.ts) | Delegation completion handler updates child .json |
| childToRootMain rebuild | Persistence (hierarchy-index.ts) | Session tracker (index.ts) | `buildFromDisk()` calls `rebuildChildToRootMain()` as final step |
| MAX_DEPTH guard | Session tracker (index.ts) | — | `ensureAncestorRoute()` needs stack overflow protection |
| Status overwrite fix | Persistence (project-index-writer.ts) | — | `addSession()` must stop blanket-resetting status to "active" |
| Gate removal | Continuity (delegation-persistence.ts) | — | Remove `if (!config.commit_docs) return` lines |
| Orphan continuity warning | Orphan cleanup (orphan-cleanup.ts) | Persistence (hierarchy-index.ts) | Check continuity tree before quarantining |
| Depth truncation warning | Persistence (hierarchy-index.ts) | — | Warn at `Math.min(depth, 2)` in `getDepth()` |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs/promises | built-in | Filesystem I/O (writeFile, rename, unlink, stat, readdir, readFile, mkdir) | Already imported in every source file. No alternative. |
| Node.js fs (sync) | built-in | Synchronous file operations for delegation-persistence | Uses renameSync, writeFileSync. Standard pattern. |

### Supporting
The session-tracker has zero external dependencies beyond Node.js built-ins. All persistence uses:
- `node:fs/promises` for async atomic writes
- `node:fs` for sync delegation writes (delegation-persistence.ts)
- `node:path` for path resolution (resolve, dirname, sep)
- `node:crypto` for temp file UUIDs (delegation-persistence.ts)

---

## Source File Inventory

### 1. atomic-write.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/persistence/atomic-write.ts` |
| **LOC** | 160 |
| **Key functions** | `atomicWriteJson(filePath, data)` (L33-42), `atomicAppendMarkdown(filePath, content)` (L60-77), `ensureDirectory(dirPath)` (L85-87), `sanitizeSessionID(sessionID)` (L97-105), `safeSessionPath(...)` (L121-150), `sessionTrackerRoot(projectRoot)` (L158-160) |
| **Temp leak locations** | L40-41 (`rename(tmpPath, filePath)` in atomicWriteJson), L75-76 (`rename(tmpPath, filePath)` in atomicAppendMarkdown). **Neither has post-rename cleanup.** |
| **Existing tests** | `tests/features/session-tracker/persistence/atomic-write.test.ts` |
| **Import dependencies** | `node:fs/promises` (mkdir, rename, writeFile, readFile), `node:path` (dirname, resolve, sep) |
| **Imported by** | `hierarchy-manifest.ts`, `child-writer.ts`, `project-index-writer.ts`, `orphan-cleanup.ts`, `session-writer.ts`, `session-index-writer.ts`, `initialization.ts` |
| **Risk level** | **LOW** — isolated change. Adding `unlink()` and `stat()` after existing rename calls. No signature change. |

### 2. hierarchy-manifest.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/persistence/hierarchy-manifest.ts` |
| **LOC** | 206 |
| **Key functions** | `addChild(params)` (L58-90), `updateChildStatus(rootMain, child, status)` (L103-117), `getChildren(rootMain)` (L125-130), `getChild(rootMain, child)` (L139-145), `loadManifest(rootMain)` (L160-181), `writeManifest(rootMain, manifest)` (L192-205) |
| **Temp leak: writeManifest** | L201-204: `writeFile(tmpPath, ...) → rename(tmpPath, filePath)` — **third leak site**, same pattern as atomicWriteJson |
| **Existing tests** | `tests/features/session-tracker/persistence/hierarchy-manifest.test.ts` |
| **Import dependencies** | `node:fs/promises` (writeFile, rename, mkdir, readFile), `node:path` (dirname), `./atomic-write.js` (safeSessionPath), `../types.js` (types) |
| **Imported by** | `event-capture.ts`, `tool-delegation.ts`, `session-tracker/index.ts` (via initialization.ts) |
| **Risk level** | **MEDIUM** — REQ-21-04 (derivative cache) fundamentally changes addChild/getChildren semantics. Must ensure backward compatibility for consumers. |

### 3. hierarchy-index.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/persistence/hierarchy-index.ts` |
| **LOC** | 308 |
| **Key functions** | `buildFromDisk()` (L94-137), `registerChildrenFromTree(parentID, children)` (L149-168), `registerChild(parentID, childID)` (L182-201), `propagateRootMain(childID, rootMain)` (L213-221), `getParent(childID)` (L229-231), `getRootMain(childID)` (L245-247), `resolveRootMain(childID)` (L259-268), `isChild(sessionID)` (L276-278), `getDepth(sessionID)` (L289-300) |
| **Depth truncation** | L299: `return Math.min(depth, 2)` — G-7 warning insertion point |
| **childToRootMain NOT rebuilt** | `buildFromDisk()` only rebuilds `childToParent` and `parentToChildren` in L131-136. `childToRootMain` is rebuilt only if NOT already in the map — but the map is initialized as empty and never populated for children whose root main appears in the continuity tree |
| **Existing tests** | `tests/features/session-tracker/persistence/hierarchy-index.test.ts` |
| **Import dependencies** | `node:fs/promises` (readdir, readFile), `./atomic-write.js` (sessionTrackerRoot, safeSessionPath), `../types.js` (ChildHierarchyEntry, SessionContinuityIndex) |
| **Imported by** | `child-writer.ts`, `event-capture.ts`, `tool-capture.ts`, `session-tracker/index.ts`, `orphan-cleanup.ts`, `initialization.ts`, `tool-delegation.ts` |
| **Risk level** | **MEDIUM** — `rebuildChildToRootMain()` is additive (new function). Not called by any existing code path — only from `buildFromDisk()`. Risk of DAG non-determinism (children under multiple parents, confirmed in production). |

### 4. child-writer.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/persistence/child-writer.ts` |
| **LOC** | 379 |
| **Key functions** | `constructor(deps)` (L67-75), `getChildFilePath(parentID, childID)` (L84-93), `resolveWriteParent(childID, parentID)` (L106-113), `createChildFile(parentID, childID, metadata)` (L253-278), `updateChildStatus(...)` (L290-307), `appendChildTurn(...)` (L319-343), `appendJourneyEntry(...)` (L358-378) |
| **F-18 backfill target** | Add `backfillChildMetadata(sessionID, metadata)` method performing same write pattern as `updateChildStatus()` |
| **Existing tests** | `tests/features/session-tracker/persistence/child-writer.test.ts`, `tests/features/session-tracker/persistence/child-writer-depth-journey.test.ts` |
| **Import dependencies** | `node:fs/promises` (readFile), `./atomic-write.js` (atomicWriteJson, ensureDirectory, safeSessionPath), `../types.js`, `./hierarchy-index.js`, `./retry-queue.js` |
| **Imported by** | `event-capture.ts`, `tool-capture.ts`, `session-tracker/index.ts` (via initialization), `tool-delegation.ts` |
| **Risk level** | **LOW** — additive change only (new `backfillChildMetadata` method). No existing callers affected. |

### 5. project-index-writer.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/persistence/project-index-writer.ts` |
| **LOC** | 353 |
| **Key functions** | `constructor(deps)` (L64-67), `getIndexPath()` (L74-76), `readIndex()` (L83-91), `createDefault()` (L98-106), `initializeIndex()` (L121-139), `addSession(sessionID, dir, mainFile)` (L151-191), `updateSession(sessionID, updates)` (L203-225), `incrementChildCount(sessionID, depth?)` (L239-255), `removeSession(sessionID)` (L266-280), `getQueueHealth()` (L310-316), `enqueueWrite(fn)` (L331-352) |
| **Status overwrite** | L167-170 in `addSession()`: `existing.updated = now` and `if (status !== "error" && status !== "deleted") { existing.status = "active" }` — **G-3 precondition fix target**. Every hook callback resets status to "active" |
| **childCount gap** | `incrementChildCount()` is defined at L239-255 and **IS** called from `event-capture.ts:484` and `tool-capture.ts:348`. The problem is historical data and uneven call paths |
| **Existing tests** | Not found under session-tracker tests directory |
| **Import dependencies** | `node:fs/promises` (readFile), `node:path` (resolve), `./atomic-write.js` (atomicWriteJson, etc), `../types.js`, `../../../shared/session-api.js` |
| **Imported by** | `event-capture.ts`, `tool-capture.ts`, `session-tracker/index.ts` (via initialization), `tool-delegation.ts` |
| **Risk level** | **MEDIUM** — status overwrite fix affects all hook consumers. Must verify: which callers depend on status being "active" after callback? |

### 6. event-capture.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/capture/event-capture.ts` |
| **LOC** | 702 |
| **Key functions** | `constructor(deps)` (L58-76), `handleSessionEvent(event)` (L91-171), `handleSessionCreated(sessionID)` (L182-306), `writeImmediateChildFile(sessionID, parentID, subagentType?, depth?)` (L428-511), `resolveChildLifecycleRoute(sessionID)` (L525-548), `recordJourneyEntry(...)` (L668-701) |
| **F-18 anonymous children** | L438: `const subagentType = explicitSubagentType ?? pendingEntry?.subagentType ?? "unknown"` — the fallback chain that produces "unknown". L463: `mainAgent: { name: "pending", model: "" }` — always "pending" |
| **4 writeImmediateChildFile call sites** | L200 (Gate 0, has `anyPending.subagentType`), L235 (SDK-based, NO subagentType — relies on fallback), L248 (hierarchy index, NO subagentType), L263 (pending registry, has `pendingEntry?.subagentType`) |
| **manifestWriter.addChild call** | L490 — called within `if (this.hierarchyIndex && this.manifestWriter)` guard at L471 |
| **incrementChildCount call** | L484 — called within same guard |
| **Existing tests** | `tests/features/session-tracker/session-tracker.test.ts` (indirect, via SessionTracker) |
| **Import dependencies** | `../../../shared/session-api.js` (OpenCodeClient, getSession), `../persistence/*` (all 5 persistence classes), `../types.js` |
| **Imported by** | `session-tracker/index.ts` (via initialization) |
| **Risk level** | **HIGH** — largest file (702 LOC), most active code path, 4 different child creation call sites with different metadata availability. Must trace each to verify metadata flows correctly. |

### 7. tool-capture.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/capture/tool-capture.ts` |
| **LOC** | 489 |
| **Key functions** | `constructor(deps)` (L73-89), `handleToolExecuteAfter(input, output)` (L98-149), `handleSkill(...)` (L164-181), `handleRead(...)` (L193-215), `handleTask(...)` (L227-381), `handleOther(...)` (L391-401) |
| **Delegator agent resolution** | L258-268: resolves from `pendingRegistry.getSubagentType()`, then falls back to `args.subagent_type`, then "unknown". This agentName IS correct — the gap is that `event-capture.ts:writeImmediateChildFile()` (called via different path for Gate 0) doesn't receive it |
| **No manifestWriter call** | tool-capture.ts does NOT call `manifestWriter.addChild()` — F-17 root cause. But per G-1 (derivative cache), manifest is generated from continuity tree, so this becomes a non-issue |
| **Existing tests** | Not found directly — tested via `session-tracker.test.ts` integration |
| **Import dependencies** | `../persistence/*` (sessionWriter, childWriter, sessionIndexWriter, projectIndexWriter, hierarchyIndex, pendingRegistry), `../types.js`, `../../../shared/session-api.js` |
| **Imported by** | `session-tracker/index.ts` (via initialization) |
| **Risk level** | **LOW** — no changes needed to tool-capture.ts for manifest (G-1). Only Plan 03 may need to enhance metadata passing |

### 8. session-tracker/index.ts (SessionTracker class)
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/index.ts` |
| **LOC** | 561 |
| **Key functions** | `constructor(deps)` (L98-101), `handleSessionEvent(event)` (L134-182), `handleChatMessage(input, output)` (L215-263), `handleToolExecuteAfter(input, output)` (L272-331), `ensureChildRoute(parentID, childID)` (L343-348), `isSdkRootSession(sessionID)` (L359-367), `ensureAncestorRoute(sessionID, seen)` (L375-388), `handleToolExecuteBefore(params)` (L403-422), `initialize()` (L432-509), `cleanup()` (L516-532) |
| **F-13: MAX_DEPTH** | L375-388: `ensureAncestorRoute()` recursively calls `getSessionSafely()` with only a `seen` Set. **No MAX_DEPTH guard.** After 20 iterations, should return gracefully with warning. |
| **F-07: childToRootMain rebuild** | L434: `await this.hierarchyIndex?.buildFromDisk?.()` — should call `rebuildChildToRootMain()` as final step. Currently NO such call exists. |
| **Existing tests** | `tests/features/session-tracker/session-tracker.test.ts` |
| **Import dependencies** | `../../shared/session-api.js`, `./capture/message-capture.js`, `./initialization.js`, `node:fs/promises`, `node:path`, `./tool-delegation.js`, `./project-continuity.js`, `./persistence/retry-queue.js` |
| **Imported by** | `src/plugin.ts` |
| **Risk level** | **MEDIUM** — F-07 change is additive (calls new function). F-13 MAX_DEPTH is 5-LOC change. Both are low-risk if the function signatures match. |

### 9. delegation-persistence.ts
| Property | Value |
|----------|-------|
| **Path** | `src/task-management/continuity/delegation-persistence.ts` |
| **LOC** | 196 |
| **Key functions** | `getDelegationsFilePath()` (L54-56), `persistDelegations(delegations)` (L58-79), `readPersistedDelegations()` (L169-196), `normalizePersistedDelegation(value)` (L81-167), `quarantineCorruptDelegationsFile(filePath)` (L48-52) |
| **commit_docs gate** | L58-64: `const config = getCachedConfig(); if (!config.commit_docs) { return }` — **G-4 fix target**. Lines 62-63 to delete. |
| **Existing tests** | `tests/lib/delegation-persistence.test.ts` (3 tests for commit_docs at lines ~141-222) |
| **Import dependencies** | `node:crypto`, `node:fs`, `node:path`, `./index.js`, `../../config/subscriber.js`, `../../shared/security/redaction.js`, `../../shared/types.js` |
| **Imported by** | `src/coordination/delegation/state-machine.ts` (L218, 394), `src/coordination/delegation/retry-handler.ts` (L23) |
| **Risk level** | **LOW** — removing 3 lines of code. No downstream impact because `commit_docs` is only consumed here. |

### 10. orphan-cleanup.ts
| Property | Value |
|----------|-------|
| **Path** | `src/features/session-tracker/orphan-cleanup.ts` |
| **LOC** | 341 |
| **Key functions** | `constructor(deps)` (L44-54), `cleanupOrphanDirectories()` (L73-159), `preserveOrphanHierarchy(orphanID)` (L173-235), `moveChildJsonToRoot(source, target, file)` (L245-265), `cleanupOrphanedTmpFiles()` (L320-340) |
| **G-6 guardrail target** | L135-148: `isOrphan` block calls `this.quarantine.quarantineOrphan()`. Need to add `checkContinuityTree()` before L135 — log warning if child has continuity tree entry |
| **Existing tests** | `tests/features/session-tracker/orphan-cleanup-preserve.test.ts` |
| **Import dependencies** | `../../shared/session-api.js`, `./persistence/hierarchy-index.js`, `./persistence/orphan-quarantine.js`, `./types.js`, `./persistence/atomic-write.js`, `node:fs/promises`, `node:path` |
| **Imported by** | `session-tracker/index.ts` |
| **Risk level** | **LOW** — additive warning-only change. No behavioral modification to quarantine algorithm. |

---

## Per-Plan Implementation Guidance

### Plan 01: F-01 Temp Fix + Cross-Volume Guardrail (REQ-21-01, REQ-21-02)

**Target file:** `src/features/session-tracker/persistence/atomic-write.ts`

**Exact changes:**

1. **Post-rename cleanup in `atomicWriteJson()`** (around L40-42):
   ```typescript
   await writeFile(tmpPath, content, "utf-8")
   await rename(tmpPath, filePath)
   // NEW: Clean up temp file after successful rename
   try { await unlink(tmpPath) } catch { /* best-effort */ }
   ```

2. **Post-rename cleanup in `atomicAppendMarkdown()`** (around L74-77):
   ```typescript
   await writeFile(tmpPath, merged, "utf-8")
   await rename(tmpPath, filePath)
   // NEW: Clean up temp file after successful rename
   try { await unlink(tmpPath) } catch { /* best-effort */ }
   ```

3. **Pre-rename volume validation** (before line 41):
   ```typescript
   // Cross-volume rename detection
   const tmpStat = await stat(tmpPath).catch(() => null)
   const targetStat = await stat(dirname(filePath)).catch(() => null)
   if (tmpStat && targetStat && tmpStat.dev !== targetStat.dev) {
     log.warn(`Cross-volume rename: tmp (dev=${tmpStat.dev}) vs target (dev=${targetStat.dev}) — rename NOT atomic`)
   }
   ```
   
   **Important:** The `stat` calls must happen AFTER `writeFile(tmpPath)` and BEFORE `rename()`. Insert between L40 and L41.

4. **Import additions needed:** Add `unlink, stat` to the `node:fs/promises` import on L10:
   ```typescript
   import { mkdir, rename, writeFile, readFile, unlink, stat } from "node:fs/promises"
   ```

5. **IMPORTANT: hierarchy-manifest.ts ALSO leaks** (already confirmed). `writeManifest()` at L201-204 has the same write-tmp-rename pattern. But per G-1 (Plan 02), `addChild()` write-side calls will be REMOVED. If writeManifest() stays as cache-write optimization, it needs the fix too. **Fix it in Plan 01 regardless** — the principle is "fix all leak paths, even ones that may be removed later."

   Add to `hierarchy-manifest.ts:204-205`:
   ```typescript
   await rename(tmpPath, filePath)
   try { await unlink(tmpPath) } catch { /* best-effort cleanup */ }
   ```

**Volume validation approach:**
- Use `fs.promises.stat()` to get `dev` (device ID) of both the tmp file's directory and the target directory
- Log warning via `client.app?.log?.(...)` if they differ
- The SPEC says "no data loss occurs (existing atomic fallback in OS handles cross-volume)" — so validation is warning-only, not abort

**Test Strategy:**
- **Unit test 1:** Mock `rename` → assert `unlink(tmpPath)` is called after `rename()`. Use `vi.spyOn(fs, 'rename').mockResolvedValue()` + `vi.spyOn(fs, 'unlink').mockResolvedValue()`.
- **Unit test 2:** Mock `stat()` with different `dev` values → assert warning log emitted via mock of `client.app?.log?.(...)`.
- **Integration test:** Loop `atomicWriteJson()` 100 times → `readdir` session-tracker root → assert no files match `**/*.tmp.*`. Use `beforeAll`/`afterAll` to create/clean temp directory.
- **Existing tests:** All in `tests/features/session-tracker/persistence/atomic-write.test.ts` must still pass.

---

### Plan 02: F-17 Manifest Derivative Cache + F-19 childCount (REQ-21-03, REQ-21-04, REQ-21-10, REQ-21-11)

**Target files:** `hierarchy-manifest.ts`, `hierarchy-index.ts`, `project-index-writer.ts`, `event-capture.ts`

**This is the most architecturally significant plan.** The G-1 decision (manifest = derivative cache) fundamentally changes how manifest is populated.

**Changes to hierarchy-manifest.ts:**

1. **Add `generateFromContinuity(rootMainID): HierarchyManifest` function:**
   - Walk the continuity tree from `session-continuity.json` for the root main session
   - Extract ALL children at all depths
   - Flatten into `HierarchyManifest` format with `children: Record<string, HierarchyManifestChild>`
   - Compute `totalChildren` and `maxDepth` from the tree
   - This function produces the manifest that `getChildren()` and `getManifest()` return on cache miss

2. **Modify `loadManifest()` (L160-181):** After loading the manifest from disk, call `generateFromContinuity()` to verify/regenerate. If the file doesn't exist, generate fresh from continuity tree instead of returning empty.

3. **Modify `getChildren()` (L125-130):** Regenerate from continuity on cache miss instead of reading existing manifest. Keep `writeManifest()` as cache-write optimization.

4. **Remove `addChild()` calls:**
   - `event-capture.ts:490` — remove `await this.manifestWriter.addChild({...})`
   - `tool-delegation.ts:288` — remove `manifestWriter.addChild()`
   - Keep `updateChildStatus()` — still useful for status propagation, even if derived

5. **Fix `writeManifest()` temp leak** (already included in Plan 01, but verify it's done)

**Changes to project-index-writer.ts:**

1. **Add `computeChildCount(sessionID): number` on project-index-writer:**
   - Walk the hierarchy index to count children for a given session
   - Call in `updateSession()` before computing the merge

2. **Add `computeMaxDepth(sessionID): number` on project-index-writer:**
   - Walk the hierarchy index to compute max delegation depth
   - Call in `updateSession()` before computing the merge

3. **Modify `updateSession()` (L203-225):** Add childCount and totalDelegationDepth to the updates payload:
   ```typescript
   updates.childCount = await this.computeChildCount(sessionID)
   updates.totalDelegationDepth = await this.computeMaxDepth(sessionID)
   ```
   **Important:** This requires `hierarchyIndex` to be available in `ProjectIndexWriter`. Currently it's NOT injected. Either:
   - Add `hierarchyIndex` to constructor deps (recommended)
   - OR have `updateSession()` accept `childCount` and `depth` as optional params from callers

**Changes to hierarchy-index.ts:**

1. **Add `getChildCountForSession(sessionID): number`:**
   - Return `this.parentToChildren.get(sessionID)?.size ?? 0`
   - For child sessions, return 0

2. **Add `getMaxDepthForSession(sessionID): number`:**
   - Walk all descendants via `parentToChildren` reverse index
   - Return max depth found

**Test Strategy:**
- **Unit test 1:** Create fixture continuity tree on disk → call `generateFromContinuity()` → assert manifest contains ALL children with correct metadata
- **Unit test 2:** Create hierarchy index with 5 children → call `getChildCountForSession()` → assert returns 5
- **Integration test:** Root + 5 delegates → `project-continuity.json` shows `childCount: 5`
- **Integration test:** Root + L1 + L2 → `totalDelegationDepth: 2`

---

### Plan 03: F-18 Anonymous Children (REQ-21-08, REQ-21-09)

**Target files:** `event-capture.ts`, `child-writer.ts`, `tool-capture.ts`

**Changes to event-capture.ts:**

1. **Modify `writeImmediateChildFile()` (L428-511):**
   - Accept additional params: `agentName?: string`, `model?: string`, `description?: string`
   - Replace L463 (`mainAgent: { name: "pending", model: "" }`) with real values when available
   - Replace L454 (`agentName: subagentType`) with actual agent name when available

2. **The 4 call sites to verify:**

   | Call Site | Line | Current Params | Metadata Available | Fix |
   |-----------|------|----------------|--------------------|-----|
   | Gate 0 (anyPending) | L200 | `(sessionID, parentID, anyPending.subagentType, depth)` | `anyPending.subagentType` has real agent name | Already using it — but also pass `agentName: anyPending.agentName` if available |
   | SDK-based child | L235 | `(sessionID, parentID)` — NO subagentType | NOTHING — no pending entry at all | Must resolve from SDK session metadata or pass through from handleSessionCreated |
   | Hierarchy index child | L248 | `(sessionID, resolvedParent)` — NO subagentType | `this.hierarchyIndex.getParent()` knows parent but not agent name | This path fires when SDK fails to report parentID BUT hierarchy index has it. Agent name must come from `resolveChildLifecycleRoute` or pending registry |
   | Pending registry child | L263 | `(sessionID, effectiveParent, pendingEntry?.subagentType)` | `pendingEntry?.subagentType` available | Already passing it — verify pendingEntry has the full metadata |

3. **Add `backfillChildMetadata()` call in delegation completion handler:**
   - After delegation completes (in handleSessionDeleted/handleSessionError), if `mainAgent.name === "pending"`, call `childWriter.backfillChildMetadata()`
   - Insert at L353-358 (handleSessionDeleted) and L386-392 (handleSessionError)

**Changes to child-writer.ts:**

1. **Add `backfillChildMetadata(parentID, childID, metadata):` method:**
   - Read existing child file
   - If `mainAgent.name === "pending"`, update with real values from metadata
   - Use same enqueueWrite pattern as `updateChildStatus()` (L290-307)

**Test Strategy:**
- **Integration test:** Dispatch `delegate-task` with `hm-l2-researcher` agent → read persisted child `.json` → assert `agentName === "hm-l2-researcher"`
- **Unit test:** Create child with `"pending"` → simulate delegation completion → assert child `.json` `agentName` is updated to real value
- **Trace test:** Add assertion that ALL 4 call sites of `writeImmediateChildFile()` produce children with `agentName !== "unknown"`

---

### Plan 04: F-07 Recovery + F-13 MAX_DEPTH (REQ-21-05, REQ-21-06, REQ-21-07)

**Target files:** `hierarchy-index.ts`, `session-tracker/index.ts`

**Changes to hierarchy-index.ts:**

1. **Add `rebuildChildToRootMain()` method:**
   ```typescript
   rebuildChildToRootMain(): void {
     // Walk all entries in childToParent
     for (const [childID] of this.childToParent) {
       if (!this.childToRootMain.has(childID)) {
         const root = this.resolveRootMain(childID)
         if (root) this.childToRootMain.set(childID, root)
       }
     }
   }
   ```
   This uses the EXISTING `resolveRootMain()` (L259-268) which walks the child→parent chain with cycle detection.

2. **Modify `buildFromDisk()` (L127-136):** After the second pass that resolves rootMain (L131-136), call `this.rebuildChildToRootMain()` as additional step:
   ```typescript
   // After line 136:
   this.rebuildChildToRootMain()
   ```

3. **DAG tiebreaker:** `resolveRootMain()` walks `childToParent` chain until finding a session NOT in `childToParent` (which IS the root). For DAG structures (child under multiple parents), the FIRST registered parent determines the root. This matches existing runtime behavior. **Document this.**

**Changes to session-tracker/index.ts:**

1. **Add MAX_DEPTH guard to `ensureAncestorRoute()` (L375-388):**
   ```typescript
   private async ensureAncestorRoute(sessionID: string, seen: Set<string>, depth: number = 0): Promise<void> {
     const MAX_DEPTH = 20
     if (depth > MAX_DEPTH) {
       this.client.app?.log?.({
         body: {
           service: "session-tracker",
           level: "warn",
           message: `[Harness] Session tracker: ensureAncestorRoute exceeded MAX_DEPTH=${MAX_DEPTH} at "${sessionID}"`,
         },
       })
       return
     }
     if (seen.has(sessionID)) return
     seen.add(sessionID)
     const session = await this.getSessionSafely(sessionID)
     const parentID = session && typeof session === "object" && "parentID" in session
       ? (session as { parentID?: string }).parentID
       : undefined
     if (!parentID) return
     await this.ensureAncestorRoute(parentID, seen, depth + 1)
     if (!this.hierarchyIndex.isChild(sessionID)) {
       this.hierarchyIndex.registerChild(parentID, sessionID)
     }
   }
   ```

2. **Update `ensureChildRoute()` (L343-348)** to pass depth parameter:
   ```typescript
   private async ensureChildRoute(parentID: string, childID: string): Promise<void> {
     await this.ensureAncestorRoute(parentID, new Set<string>(), 0)
     // ... rest unchanged
   }
   ```

**Test Strategy:**
- **Integration test:** Register L1→L2 child chain → flush writes → reinitialize `SessionTracker` → call `getRootMain(L2Id)` → assert root session ID matches
- **Unit test:** Create fixture continuity tree on disk → call `buildFromDisk()` → inspect `hierarchyIndex` → assert `getRootMain()` works for all children
- **Unit test:** Inject chain of 25+ ancestors → call `ensureAncestorRoute()` → assert no crash → assert warning logged

---

### Plan 05: G-3 Precondition Fix + G-4 Gate Removal (REQ-21-12, REQ-21-13)

**Target files:** `project-index-writer.ts`, `delegation-persistence.ts`

**Changes to project-index-writer.ts (G-3 / F-14):**

1. **Fix `addSession()` line ~167-170:** Remove the blanket status overwrite:
   ```typescript
   // BEFORE (lines 167-170):
   existing.updated = now
   if (existing.status !== "error" && existing.status !== "deleted") {
     existing.status = "active"
   }

   // AFTER:
   existing.updated = now
   // Status is preserved from caller — NOT reset to "active"
   // P22 will handle full status unification
   ```
   This means: subsequent hook callbacks do NOT change existing.status. Only the INITIAL creation at L172-181 sets `status: "active"`.

**Changes to delegation-persistence.ts (G-4 / F-21):**

1. **Remove lines 58-64:** Delete the entire early-return gate:
   ```typescript
   // DELETE:
   // CA-03: commit_docs toggle gate (D-16)
   // When false, document auto-commit is skipped.
   const config = getCachedConfig()
   if (!config.commit_docs) {
     return  // Skip document persistence
   }
   ```

2. **Keep `getCachedConfig()` import** if used elsewhere in function. After removing the gate, check if `getCachedConfig` is still referenced. If not (it was only used for the gate), remove the import.

3. **Config schema check:** The SPEC says "keep the `commit_docs` schema field for GSD external use (162+ refs)." `src/schema-kernel/hivemind-configs.schema.ts:282` — **NO change needed.** The field stays. The `persist_delegations` schema addition from earlier drafts is NOT needed per G-4 resolution (simple gate removal).

**Test Strategy:**
- **Unit test 1:** Set session status to `"idle"` → simulate 10 hook callbacks with default parameters → assert `project-continuity.json` shows `"idle"`
- **Unit test 2:** `commit_docs: false` → call `persistDelegations()` → assert delegations file is written to `.hivemind/state/delegations.json`
- **Modify existing tests:** Update `tests/lib/delegation-persistence.test.ts` lines ~141-222 — remove the 3 `commit_docs` toggle tests that verify write-skip behavior. Keep the write-succeeds tests as always-persist baseline.

---

### Plan 06: Guardrails + Integration Verification (REQ-21-14, REQ-21-15)

**Target files:** `orphan-cleanup.ts`, `hierarchy-index.ts`, `hierarchy-manifest.ts`

**Changes to orphan-cleanup.ts (G-6 / F-20 guardrail):**

1. **Add continuity tree check in `cleanupOrphanDirectories()` (before L135):**
   ```typescript
   // G-6 guardrail: warn if quarantining a child that has continuity tree entry
   if (isOrphan) {
     const hasContinuityEntry = await this.checkContinuityTree(sessionID)
     if (hasContinuityEntry) {
       void this.client.app?.log?.({
         body: {
           service: "session-tracker",
           level: "warn",
           message: `[Harness] Orphan cleanup: quarantining "${sessionID}" which has continuity tree entry — may be legitimate`,
         },
       })
     }
   }
   ```

2. **Add `checkContinuityTree(sessionID): boolean` helper:**
   ```typescript
   private async checkContinuityTree(sessionID: string): Promise<boolean> {
     try {
       const indexPath = safeSessionPath(this.projectRoot, sessionID, "session-continuity.json")
       await access(indexPath)
       return true
     } catch {
       return false
     }
   }
   ```

**Changes to hierarchy-index.ts (G-7 / F-12 guardrail):**

1. **Add warning at depth cap (line ~299):**
   ```typescript
   // BEFORE:
   return Math.min(depth, 2)
   
   // AFTER:
   const capped = Math.min(depth, 2)
   if (depth > 2) {
     // G-7 warning: make depth cap observable
     // (logging via injected client or console — whichever is available)
     // For hierarchy-index.ts, which doesn't have client access, use process.emitWarning or console.warn
     process.emitWarning(
       `[Harness] Session tracker: delegation depth ${depth} exceeds max 2 — truncating to ${capped}`
     )
   }
   return capped
   ```
   **Important:** `hierarchy-index.ts` does NOT have an `OpenCodeClient` reference. Use `process.emitWarning()` as fallback. If client is needed, inject via constructor or pass through from caller.

**Changes to hierarchy-manifest.ts (F-05 status divergence guardrail):**

1. **Add status cross-validation in `getChildren()` (L125-130):**
   ```typescript
   async getChildren(rootMainSessionID: string): Promise<Record<string, HierarchyManifestChild>> {
     const manifest = await this.loadManifest(rootMainSessionID)
     // F-05 guardrail: log status divergence warning
     for (const [childID, entry] of Object.entries(manifest.children)) {
       // Cross-validate: child .json status vs manifest status vs project-index status
       // Log warning if they diverge (P22 will fix this fully)
     }
     return manifest.children
   }
   ```
   **Note:** This guardrail requires access to child .json files and project-continuity index, which `hierarchy-manifest.ts` doesn't currently have. Consider deferring this guardrail to P22 or implementing as a separate cross-validation method that accepts the data.

**Integration Test (end-to-end):**

Create `tests/features/session-tracker/integration/phase-21.test.ts`:

1. **Phase 1 — Cleanup:** 100 atomic writes → assert 0 `.tmp.*` files
2. **Phase 2 — Hierarchy:** Root session + 5 delegates → assert `childCount === 5`, manifest matches continuity tree
3. **Phase 3 — Metadata:** Assert all children have real agent names (not "unknown")
4. **Phase 4 — Restart:** Reinitialize `SessionTracker` → assert `getRootMain()` works for all children
5. **Phase 5 — Status:** Assert status not overwritten to "active" after hook callbacks
6. **Phase 6 — Depth guard:** 25-ancestor chain → assert graceful handling → warning logged

---

## Dependency Graph (Implementation Order)

```
Plan 01 (F-01 temp fix)
  ├── Independent — can run first or in parallel with any plan
  └── Fix hierarchy-manifest.ts writeManifest() temp leak too

Plan 02 (Manifest derivative cache + childCount)
  ├── MUST run BEFORE Plan 06 (guardrails depend on manifest generation)
  ├── BLOCKED ON: G-1 decision (locked — derivative cache confirmed)
  └── Changes the most files, highest architectural impact

Plan 03 (F-18 anonymous children)
  ├── Independent — changes event-capture.ts and child-writer.ts only
  └── Does NOT depend on Plan 02

Plan 04 (F-07 recovery + F-13 MAX_DEPTH)
  ├── Independent — changes hierarchy-index.ts and session-tracker/index.ts
  ├── Does NOT depend on Plan 02
  └── `rebuildChildToRootMain()` is called by `buildFromDisk()` on initialize

Plan 05 (G-3 precondition + G-4 gate removal)
  ├── Independent — changes project-index-writer.ts and delegation-persistence.ts
  └── Can run in parallel with Plans 01, 03, 04

Plan 06 (Guardrails + integration)
  ├── MUST run LAST — integrates ALL prior changes
  ├── Depends on Plan 02 (manifest generation)
  ├── Depends on Plan 03 (child metadata)
  └── Depends on Plan 04 (rebuild function)
```

**Parallel execution groups:**
- **Group A** (can run in any order): Plan 01, Plan 03, Plan 04, Plan 05
- **Group B** (architectural prerequisite): Plan 02 — must precede Plan 06
- **Group C** (integration): Plan 06 — must be last

---

## Risk Mitigation

| Risk | Plan | Mitigation |
|------|------|-----------|
| **hierarchy-manifest.ts temp leak missed** | 01 | Audit shows `writeManifest()` at L201-204 has same pattern. Fix in Plan 01 regardless of whether G-1 deprecates it. |
| **Manifest derivative cache breaks session-hierarchy.ts tool consumers** | 02 | Keep `writeManifest()` as cache-write optimization. Generate from continuity tree only on cache miss. Tests in Plan 06 verify tool output. |
| **childCount computation requires HierarchyIndex in ProjectIndexWriter** | 02 | Currently `projectIndexWriter` does NOT have `hierarchyIndex`. Must add to constructor deps OR compute in caller and pass to `updateSession()`. Recommend adding to deps. |
| **DAG topology causes non-deterministic rootMain rebuild** | 04 | Production evidence confirms children under multiple parents. `resolveRootMain()` uses first-found-wins strategy. Document this. |
| **MAX_DEPTH=20 breaks existing deep chains** | 04 | Production shows at most 3-level chains (L0→L1→L2). 20 provides 6x headroom. Conservative and safe. |
| **Status fix breaks hooks that depend on "active" callback** | 05 | The fix only preserves existing status. If a hook explicitly passes `status: "active"`, it still works. Only the blanket `existing.status = "active"` is removed. |
| **Gate removal doesn't cover all delegation completion paths** | 05 | `persistDelegations()` must be called from `state-machine.ts:218,394` and `retry-handler.ts:23`. Verify each caller actually invokes it on every delegation completion. |
| **writeImmediateChildFile 4 call sites don't all have metadata** | 03 | The SDK-based call site (L235) has NO metadata. Must trace through and ensure handleSessionCreated passes through any available agent info from the session lifecycle event. |
| **Backfill creates race with concurrent reads** | 03 | Backfill runs on delegation completion, which is deferred from child creation. Document: "brief window where session-view shows 'unknown' for a child that just completed before backfill runs." |

---

## References

| File | Path | Lines |
|------|------|-------|
| atomic-write.ts | `src/features/session-tracker/persistence/atomic-write.ts` | 1-160 |
| hierarchy-manifest.ts | `src/features/session-tracker/persistence/hierarchy-manifest.ts` | 1-206 |
| hierarchy-index.ts | `src/features/session-tracker/persistence/hierarchy-index.ts` | 1-308 |
| child-writer.ts | `src/features/session-tracker/persistence/child-writer.ts` | 1-379 |
| project-index-writer.ts | `src/features/session-tracker/persistence/project-index-writer.ts` | 1-353 |
| event-capture.ts | `src/features/session-tracker/capture/event-capture.ts` | 1-702 |
| tool-capture.ts | `src/features/session-tracker/capture/tool-capture.ts` | 1-489 |
| session-tracker/index.ts | `src/features/session-tracker/index.ts` | 1-561 |
| delegation-persistence.ts | `src/task-management/continuity/delegation-persistence.ts` | 1-196 |
| orphan-cleanup.ts | `src/features/session-tracker/orphan-cleanup.ts` | 1-341 |

**Planning documents:**
| Document | Path | Status |
|----------|------|--------|
| SPEC | `.planning/phases/21-session-tracker-design-fix/21-SPEC.md` | 15 EARS requirements |
| CONTEXT | `.planning/phases/21-session-tracker-design-fix/21-CONTEXT.md` | Phase scope, flaw table, gray areas |
| ASSUMPTIONS | `.planning/phases/21-session-tracker-design-fix/21-ASSUMPTIONS.md` | 20 per-fix assumptions, risk matrix |
| Plan 01-06 | `.planning/phases/21-session-tracker-design-fix/21-0*-PLAN.md` | Plan stubs |
| Flaw Register | `.planning/research/session-tracker-unified-flaw-register-context-2026-05-21.md` | 22-flaw register |
| Gray Areas | `.planning/research/session-tracker-gray-areas-investigation-2026-05-21.md` | G-1 to G-8 analysis |
| commit_docs | `.planning/research/commit-docs-config-investigation-2026-05-21.md` | G-4 deep dive |
| Production Evidence | `.planning/research/session-tracker-production-evidence-analysis-2026-05-21.md` | F-17 to F-22 evidence |
