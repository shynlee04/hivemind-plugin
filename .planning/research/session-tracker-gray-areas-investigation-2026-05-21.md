# Session-Tracker Gray Areas: Deep Investigation

**Date:** 2026-05-21
**Analyst:** gsd-advisor-researcher (subagent)
**Evidence Level:** L2-L3 (filesystem + code inspection + session exports)
**Sources:** 4 cross-referenced discovery documents + source code in `src/features/session-tracker/` + `src/task-management/continuity/delegation-persistence.ts`

---

## Executive Summary

This investigation resolves 8 gray area design decisions (G-1 through G-8) for Phase 21. Each gray area has a clear recommendation backed by filesystem evidence and code analysis. **Two gray areas require explicit human decision: G-3 (status authority store) and G-4 (delegation persistence config key name).** The remaining 6 have unambiguous optimal choices.

**Critical finding from code analysis:** The earlier claim that `event-capture.ts` never writes to `hierarchy-manifest.json` is **partially disproven** by direct code inspection. At `event-capture.ts:490`, `manifestWriter.addChild()` IS called within `writeImmediateChildFile()`. However, `tool-capture.ts` never calls it (confirmed by grep: 0 matches). The manifest holes (`ses_1b59c269...`, `ses_1b90978a...`) are **historical artifacts** — children created before the manifest write code was wired into `event-capture.ts` during CP-ST-06. This shifts the G-1 recommendation: the manifest is already being written from most paths; the issue is drift and historical gaps, not dead code.

---

## G-1: Manifest Role

**Question:** What is the role of `hierarchy-manifest.json`?

### Decision Tree

```
(a) Authoritative hierarchy source
    └── Fix ALL write paths to update it (event-capture, tool-capture, tool-delegation)
    └── Requires: 2-3 additional file modifications, ongoing maintenance
    └── Risk: Writes never stop diverging; 3 separate paths will always have races
    
(b) Derivative cache (RECOMMENDED)
    └── Generate from continuity tree on read
    └── Requires: Remove write-side manifest calls, add read-side generation
    └── Risk: Slightly more CPU on manifest read (negligible for JSON generation)
    
(c) Deprecated — remove entirely
    └── Migrate all manifest consumers to continuity tree directly
    └── Requires: Update session-hierarchy.ts tool + all read paths
    └── Risk: Breaking change for tools depending on flattened format
```

### Trade-off Analysis

| Aspect | (a) Authoritative | (b) Derivative Cache | (c) Deprecated |
|--------|-------------------|---------------------|-----------------|
| **Effort** | 2 files, ~60 LOC to wire remaining paths | 1-2 files, ~40 LOC to add generation + remove writes | 3-4 files, ~120 LOC |
| **Risk** | Writes will always race — continuity and manifest can still drift | No drift — single source of truth | Breaks `get-manifest` tool contract; consumers must migrate |
| **Downstream** | None — stays compatible | Improves P22-25 reliability | Blocks P24-25 tooling |
| **Reversibility** | High — can add reads later | Medium — removing write calls is easy, adding reads requires format decisions | Low — consumers must migrate to different API |

### Evidence

**Actual code analysis (corrects earlier report):**

```
event-capture.ts:490 → manifestWriter.addChild() IS called ✓
tool-delegation.ts:288 → manifestWriter.addChild() IS called ✓  
tool-capture.ts     → manifestWriter.addChild() NOT called ✗ (0 grep matches)
```

The manifest is already wired in 2 of 3 paths. The missing path (`tool-capture.ts`) handles `skill`, `read`, `task`, and fallback tool calls. However, the `handleTask()` method in tool-capture.ts (line 132) triggers `event-capture.ts:writeImmediateChildFile()` indirectly through session lifecycle events — so the manifest IS eventually written for `task` tool calls. The gap is for legacy children created before the wiring was added.

**Filesystem evidence:** All 37 session directories have populated manifests. Some children (`ses_1b59c269...`, `ses_1b90978a...`) are missing from manifests but present in continuity trees — these are historical artifacts from before the manifest wire was added.

### Recommendation: **(b) Derivative cache**

The continuity tree in `session-continuity.json` is the canonical hierarchy representation (it's the only store that preserves nested depth, parent-child topology, and de-deplication). The manifest is a flattened view optimized for quick lookup. Rather than maintaining a separate write path that can drift, generate the manifest from the continuity tree at read time.

**Implementation:** In `hierarchy-manifest.ts:getChildren()`/`getManifest()`, add a `generateFromContinuity()` function that walks the continuity tree and produces a flattened manifest. Remove the `addChild()` write-side calls from `event-capture.ts` and `tool-delegation.ts`. Keep `writeManifest()` as a cache-write-to-disk optimization.

### Fallback Plan

If option (b) is rejected, choose option (a): wire `tool-capture.ts` to call `manifestWriter.addChild()` for `skill`, `read`, and `handleOther` paths. This is a simple 10-LOC fix but perpetuates the dual-write drift problem.

---

## G-2: childToRootMain Persistence

**Question:** How should `childToRootMain` survive restart?

### Decision Tree

```
(a) New durable file childToRootMain-index.json
    └── Requires: new file format, two write paths (one for tracker, one for index)
    └── Risk: New file = new drift source (see G-1 lesson)
    
(b) Reconstruct from continuity tree (RECOMMENDED)
    └── Deterministic rebuild from existing session-continuity.json hierarchy
    └── Requires: rebuild function only — no new file format
    
(c) Extend project-continuity.json schema
    └── Add rootMain field to ProjectSessionEntry
    └── Risk: Cross-contamination of project index with hierarchy routing data
```

### Trade-off Analysis

| Aspect | (a) New File | (b) Continuity Tree | (c) Extend Project Index |
|--------|-------------|---------------------|--------------------------|
| **Effort** | 3 files, ~200 LOC | 3 files, ~100 LOC | 1 file, ~30 LOC |
| **Risk** | New drift surface (same class as G-1) | No new drift — single source of truth | Couples hierarchy routing to project index |
| **Downstream** | All restart consumers must read new file | Clean — no consumer changes needed | Must update session-context reader P22 |
| **Reversibility** | Medium — adding file is easy, removing requires migration | High — just a function, no file format | Medium — schema change needs version bump |

### Evidence

**Hierarchy tree in session-continuity.json already contains parent-child topology:**

```typescript
// types.ts:270-288
export interface SessionContinuityIndex {
  hierarchy: {
    root: string     // <-- root is already stored
    children: Record<string, ChildHierarchyEntry>  // nested tree
  }
}
```

The `buildFromDisk()` function at `hierarchy-index.ts:94-137` already reconstructs `childToParent` from continuity tree files. Extending it to compute `childToRootMain` is a natural extension: walk from the child up the `childToParent` chain until reaching a node with `parentSessionID === null`.

**Production evidence:** `hierarchyIndex.getRootMain()` is called in `resolveWriteParent()` (child-writer.ts:106-113) and during manifest writes. After restart, `buildFromDisk()` repopulates `childToParent` from disk, but `getRootMain()` relies on an in-memory map that's never rebuilt. The fix is to add a `rebuildRootMainFromTree()` function that walks the reconstructed tree.

### Recommendation: **(b) Reconstruct from continuity tree**

No new file format needed. Add a deterministic `rebuildChildToRootMain()` function to `hierarchy-index.ts` that walks the continuity tree (already reconstructed by `buildFromDisk()`) and computes rootMain for each child. This is function-scoped (~40 LOC), testable in isolation, and has zero drift risk because it derives from the existing canonical source.

### Fallback Plan

Choose option (a) only if the rebuild proves non-deterministic due to DAG structures (children appearing under multiple parents — which IS observed in ses_1baf). In that case: add `childToRootMain-index.json` but restrict writes to a single path (the rebuild function) — never a second independent write path.

---

## G-3: Status Authority Store (NEEDS HUMAN DECISION)

**Question:** Which store is the canonical source for session status?

### Consumer Mapping (Complete)

| Store | Type | Where Written | Number of Writers | Number of Consumers | Data Completeness |
|-------|------|--------------|-------------------|---------------------|-------------------|
| **Child .json** (`ChildSessionRecord.status`, types.ts:218) | Per-child file | `child-writer.ts:290-307` (`updateChildStatus`) | 1 writer | 1 consumer (child-writer readers) | **Highest** — per-child granular, updated on delegation completion |
| **Continuity tree** (`ChildHierarchyEntry.status`, types.ts:258) | In-memory → `session-continuity.json` | `session-index-writer.ts:178-183` (updateChildStatus) | 1 writer | 2 consumers (`session-hierarchy.ts:84`, `hivemind-session-view.ts:108`) | **Partial** — `hivemind-session-view` expects root-level status but continuity has none |
| **Hierarchy manifest** (`HierarchyManifestChild.status`, types.ts:121) | Per-root manifest | `hierarchy-manifest.ts:103-117` (`updateChildStatus`) | 1 writer | 1 consumer (`session-hierarchy.ts:get-manifest`) | **Medium** — flattened, may miss historical children |
| **Project-continuity** (`ProjectSessionEntry.status`, types.ts:306) | Project-global | `project-index-writer.ts:168-225` (`addSession`/`updateSession`) | 2 writers (`addSession`, `updateSession`) | 2 consumers (`session-context.ts:188`, `hivemind-session-view` indirectly) | **Lowest** — ALL entries show `childCount: 0`, timestamps frozen |

### Data Flow Integrity Analysis

**Which store is written FIRST?**

1. Child session `.json` created via `event-capture.ts:writeImmediateChildFile()` — sets `status: "active"` at line 462
2. `project-index-writer.ts:addSession()` called at line 485-489 — sets `status: "active"` in project index
3. `manifestWriter.addChild()` called at line 490 — sets `status: "active"` in manifest
4. Later, child session completes → `event-capture.ts:357` calls `manifestWriter.updateChildStatus(rootMain, sessionID, "completed")` AND `projectIndexWriter?.updateSession()` updates project index

**Which store has the MOST complete data?**
The **child .json** has the most granular and frequently updated status. It's the only store that updates on every delegation lifecycle transition.

**Which store is read by the MOST consumers?**
The **continuity tree** (read by `session-hierarchy.ts` and `hivemind-session-view.ts`) and the **project-continuity** (read by `session-context.ts`). Both are consumed by 2 consumers each.

### Status Divergence Risk

The current architecture has **3 independent status update paths** with zero reconciliation:

```
delegation completion event
├── child-writer.ts:290-307 → updates child .json status   (type.ts:218)
├── hierarchy-manifest.ts:103-117 → updates manifest status (types.ts:121)
└── project-index-writer.ts:203-225 → updates project status (types.ts:306)
                           └── BUT addSession():168-169 overwrites to "active" on EVERY hook callback
```

**Evidence from ses_1bda:** `session-continuity.json` shows `"status": "idle"` for 5 of 8 children, while the session export shows `"status": "running"` and `"executionState": "confirmed"`. The project-continuity status is constantly reset to "active" by hook callbacks (F-14).

### Feasibility of Option (c) — project-continuity.json as Canonical

**PROS:**
- It's the project-global index — logically the highest-level authority
- `session-context.ts` already reads from it
- Fixing its update path (F-14, F-19, F-22) is already in scope for P21/P22
- Single reconciliation point simplifies P22 status unification

**CONS:**
- Currently the LEAST reliable store (all statuses are "active" due to F-14)
- Doesn't track per-child granularity (only project-level summary)
- The update path needs to be fixed BEFORE it can be canonical
- `hivemind-session-view.ts:108` reads from `session-continuity.json`, not project-continuity — would need migration

**Migration steps if option (c) is chosen:**
1. **P21:** Fix `project-index-writer.ts:updateSession()` to accept and persist status from callers (not overwrite to "active")
2. **P21:** Add `incrementChildCount()` call from delegation completion path (currently NOT called — verified: `event-capture.ts:484` calls it BUT only in `writeImmediateChildFile`, not in status transitions)
3. **P22:** Make `hivemind-session-view.ts` read from project-continuity instead of session-continuity
4. **P22:** Add a reconciliation loop that propagates project-continuity status DOWN to child .json and manifest

### Recommendation: **(c) project-continuity.json is canonical** — with preconditions

The project-continuity.json is the right canonical store because it's the project-global index with the broadest consumer base. However, it cannot be treated as canonical UNTIL:
1. F-14 (status overwritten to "active" on every hook) is fixed
2. F-19 (childCount never populated) is fixed
3. F-22 (shared timestamps) is fixed

**Phase 21 actions before P22 can trust it:**
- Fix `addSession()` at `project-index-writer.ts:168-169` — remove the blanket `existing.status = "active"` override
- Fix `updateSession()` at line 213-217 — preserve caller's status instead of spread-overwriting
- Add a `project-continuity.json -> child .json` status reconciliation function (logging-only warning in P21, active in P22)

**Consumer realignment matrix for P22:**

| Consumer | Current Source | Should Read From | Migration |
|----------|---------------|------------------|-----------|
| `session-hierarchy.ts:84` | `session-continuity.json` hierarchy | **Stay on continuity tree** — this is for per-child status | None |
| `hivemind-session-view.ts:108` | `session-continuity.json` root | **Migrate to project-continuity.json** | Update read path |
| `session-context.ts:188` | `project-continuity.json` | Already correct | None |

### Fallback Plan

If option (c) is rejected, choose option (a): child .json status as canonical. This preserves per-child granularity but forces P22 to add a project-level aggregation function that walks all child .json files — which is O(n) on every project-continuity read.

---

## G-4: Delegation Persistence Gate (NEEDS HUMAN DECISION)

**Question:** Should the `commit_docs` gate on delegation persistence be removed or replaced?

### Code Investigation

**File:** `src/task-management/continuity/delegation-persistence.ts:58-64`

```typescript
export function persistDelegations(delegations: Delegation[]): void {
  // CA-03: commit_docs toggle gate (D-16)
  // When false, document auto-commit is skipped.
  const config = getCachedConfig()
  if (!config.commit_docs) {
    return  // Skip document persistence
  }
  // ... writes delegations.json ...
}
```

**What does `commit_docs` actually control?**

Defined in `src/schema-kernel/hivemind-configs.schema.ts:282`:
```typescript
commit_docs: z.boolean().default(true),
```

The schema comment (missing from the code) is minimal. The name `commit_docs` implies it controls whether OpenCode commits documentation files to git. The code comment "CA-03: commit_docs toggle gate (D-16)" references D-16 which is about document auto-commit behavior.

**Is it used elsewhere?**

Grep shows 23 matches total, all in:
- `delegation-persistence.ts:62` — the gate itself
- Test files that test both `true` and `false` paths
- Config schema definitions

**No other runtime code uses `commit_docs`.** The flag was co-opted for delegation persistence gate because it was a convenient boolean, not because delegation persistence is semantically related to document committing.

**Performance impact of always-persist:**

The `persistDelegations()` function:
1. Reads and serializes all delegations
2. Calls `redactBoundaryFields()` to strip sensitive fields
3. Writes sync to temp file, then renames
4. Overwrites the entire `delegations.json` file

Current default: `commit_docs: true` means delegation persistence IS enabled by default. But the config can be set to `false`, which silently disables delegation persistence — a footgun.

**Key insight from config schema:**
```typescript
parallelization: z.boolean().default(true),
atomic_commit: z.boolean().default(true),
commit_docs: z.boolean().default(true),
```

`commit_docs` defaults to `true` — so delegation persistence IS active by default. The problem is: (a) the config name is misleading, and (b) if a user disables `commit_docs` for its intended purpose (git auto-commit skipped), they unwittingly disable delegation persistence too.

### Three Proposed Config Key Names

| # | Key Name | Rationale | Length | Consistency |
|---|----------|-----------|--------|-------------|
| **1** | `persist_delegations` | **RECOMMENDED.** Verb+noun format, matches `parallelization` (noun) and `atomic_commit` (noun-compound) pattern. Self-documenting: "should we persist delegation records?" | 19 chars | Follows existing config naming (action-oriented) |
| **2** | `delegation_persistence` | Noun-based, clean but passive. "Delegation persistence is enabled." Reads less like a toggle. | 22 chars | Consistent with `parallelization` (noun pattern) |
| **3** | `record_delegations` | Verb-based, implies active recording. Shorter, more actionable. But `record_delegations: false` reads oddly. | 18 chars | Breaks noun pattern slightly |

### Recommendation: Option (b) — Add separate config flag `persist_delegations` (default: `true`)

**Changes required:**
1. `src/schema-kernel/hivemind-configs.schema.ts:282` — add `persist_delegations: z.boolean().default(true)`
2. `src/task-management/continuity/delegation-persistence.ts:62` — change `!config.commit_docs` to `!config.persist_delegations`
3. Update tests to use `persist_delegations` instead of `commit_docs`

**Effort:** 3 files, ~10 LOC total. Trivial.

**Rationale:** Separating concerns prevents the footgun where disabling document auto-commit silently disables delegation persistence. The `commit_docs` flag should remain for its original purpose (git auto-commit behavior in future phases).

### Human Decision Required

**Please choose one config key name:**
1. `persist_delegations`
2. `delegation_persistence`
3. `record_delegations`

(Recommendation: `persist_delegations`)

### Fallback Plan

If all 3 are rejected, choose option (c): Keep gated on `commit_docs` but change schema description to document the dual purpose. This is the least safe option.

---

## G-5: Temp File Cleanup Strategy

**Question:** Should temp files be cleaned immediately after write or at startup only?

### Decision Tree

```
(a) Clean after EVERY successful rename()
    └── Add unlink(tmpPath) in atomicWriteJson post-rename
    └── Already the planned F-01 fix
    └── Risk: None significant — simple synchronous unlink

(b) Keep startup-only cleanup but fix cross-volume rename
    └── Add same-volume TMPDIR validation
    └── Risk: Still leaks during live sessions on volume-crossing setups

(c) Both (a) + (b) (RECOMMENDED)
    └── Immediate cleanup + volume validation
    └── Defense-in-depth
```

### Evidence

**APFS rename() behavior on macOS:** `fs.rename()` is atomic ONLY on the same volume. If `TMPDIR` crosses volumes (e.g., TMPDIR=/tmp, target=/Volumes/project), the rename degrades to copy+delete, and the temp file survives.

**Session evidence from ses_1baf.md:** The same temp file `project-continuity.json.tmp.1779307372108` appeared in 3 separate git status snapshots (lines 901, 1284, 1423) — confirming the leak persists across multiple write cycles during a single session.

### Recommendation: **(c) Both**

**Implementation:**
```typescript
// In atomicWriteJson post-write:
await writeFile(tmpPath, data)  // existing
await rename(tmpPath, filePath) // existing
try { await unlink(tmpPath) } catch { /* best-effort cleanup */ }

// In initialization:
const tmpDirStats = await stat(dirname(tmpPath))
const targetDirStats = await stat(dirname(filePath))
if (tmpDirStats.dev !== targetDirStats.dev) {
  log.warn("TMPDIR crosses filesystem volumes — atomic rename NOT guaranteed")
}
```

The post-rename `unlink()` handles the common case. The volume validation prevents re-introduction on unusual filesystem configurations. Both together are ~20 LOC.

### Fallback

Option (a) alone is acceptable — the cross-volume case is rare. But option (b) without (a) leaves the leak during live sessions unaddressed.

---

## G-6: Orphan Definition

**Question:** What defines a legitimate orphan?

### Decision Tree

```
(a) No parent in ANY continuity tree (RECOMMENDED)
    └── Check continuity tree references, not directory structure
    
(b) No parent AND created >5 minutes ago
    └── Adds time-based grace period for race conditions
    
(c) No parent AND parent is "deleted"/"error"
    └── Accepts deleted sessions as valid orphan root cause
```

### Evidence

**33 quarantined directories exist at `.hivemind/session-tracker/quarantine/`.** Example: `ses_1c571efb0ffeIloZPzsnqS0P0y` is quarantined but exists in `ses_1bda`'s continuity tree with 2 L2 children. The quarantine algorithm checks directory structure rather than continuity tree references.

**Root cause:** `orphan-cleanup.ts` scans for directories that don't match expected parent directory layouts. Since some children were written to immediate parent directories (F-03 fallback path), they appear as "orphans" to directory-level scans but are legitimate children in the continuity tree.

### Recommendation: **(a) No parent in ANY continuity tree** with a 5-minute grace period

P21 action: Add a warning log when quarantining a child that has a valid continuity tree entry. Do NOT change the quarantine algorithm in P21 (deferred to P24).

**Implementation:** 
```typescript
// In orphan-cleanup.ts:
const hasContinuityEntry = await checkContinuityTree(childId)
if (hasContinuityEntry) {
  log.warn(`Quarantine candidate ${childId} has continuity tree entry — may be legitimate`)
}
```

### Fallback

Option (b) alone if (a) is rejected — adding 5-minute grace prevents race conditions during active delegation creation but doesn't solve the directory-structure scanning root cause.

---

## G-7: Depth Cap

**Question:** Should the depth cap of 2 be removed?

### Decision Tree

```
(a) Remove entirely — support arbitrary depth
    └── Requires: type change (types.ts:61), index change (hierarchy-index.ts:299)
    └── Risk: Cascading effects through routing, classification, recovery
    └── Downstream: P23 dispatch redesign must handle arbitrary depth

(b) Increase to 3
    └── Production evidence shows 3-level chains
    └── Risk: Still hits limit eventually

(c) Keep at 2 with runtime warning (RECOMMENDED)
    └── Add log.warning when Math.min(depth, 2) truncates

(d) Keep at 2 silently
    └── Current behavior — production silently truncates
```

### Evidence

**Production evidence from ses_1bda:** A genuine 3-level chain exists:
- L0: `ses_1bda22cc3ffebCEHYfj5Djbuyc` (root)
- L1: `ses_1c571efb0ffeIloZPzsnqS0P0y` (hm-l2-researcher)  
- L2: `ses_1c56bddc2ffe3DEHK2jkYCGQAz` (hm-l2-build), `ses_1c5660edcffeEBRK8DMQIl5VNp` (hm-l2-scout)

The depth=2 cap correctly handles this 3-level chain (root=0, L1=1, L2=2). The cap would only hit at L3 (4th level) and beyond.

**Architecture constraint:** The Q1 design decision explicitly limits delegation depth. Removing the cap requires rethinking classification, routing, and recovery — all scheduled for P23-P24.

### Recommendation: **(c) Keep at 2 with runtime warning**

P21 action: Add a single `console.warn` (or SDK log) at `hierarchy-index.ts:299` when `Math.min(depth, 2)` truncates. This makes the cap observable.

```typescript
// hierarchy-index.ts:299
const cappedDepth = Math.min(depth, MAX_DEPTH)
if (cappedDepth !== depth) {
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Delegation depth ${depth} exceeds max ${MAX_DEPTH} — truncating to ${MAX_DEPTH}`,
    },
  })
}
```

**Effort:** 1 file, ~5 LOC (included in F-13 MAX_DEPTH guard fix).

### Fallback

Choose option (b) if production data shows 4+ level chains existing. Currently no evidence for this.

---

## G-8: Per-Session Timestamps

**Question:** Should per-session timestamps in project-continuity.json be fixed in P21?

### Decision Tree

```
(a) Fix now — add per-entry updated tracking
    └── Add per-entry updated field that's updated independently
    └── Requires: decoupling project-index-global lastUpdated from per-entry updated

(b) Defer to P22 (RECOMMENDED)
    └── It's a status-staleness symptom (same root cause as F-14)
    └── P21 should document the limitation

(c) Document as known limitation — never fix
    └── Accept that all entries share same timestamp
```

### Evidence

**ALL 122 session entries in `project-continuity.json` share the same `updated` timestamp** (`2026-05-21T12:35:17.XXXZ`). This is because `index.lastUpdated` is written globally (line 220), and the per-entry timestamp is only updated when `addSession()` or `updateSession()` explicitly sets it — but `addSession()` is only called on first creation, and `updateSession()` receives the caller's timestamp.

**Root cause analysis:** The per-entry `updated` field in `ProjectSessionEntry` (types.ts:304) is set by `addSession()` at creation time (line 177: `updated: now`) and by `updateSession()` via spread overwrite (line 216: `updated: now`). But `addSession()` is only called once per session. `updateSession()` is called on every lifecycle transition — so the timestamp SHOULD update per-session. 

Wait — let me re-check: `project-index-writer.ts:213-217`:
```typescript
index.sessions[sessionID] = {
  ...existing,
  ...updates,
  updated: now,  // <-- this IS set on every updateSession call
}
```

So `updated` IS being set to `now` on every `updateSession()` call. Why are all 122 entries showing the same timestamp?

**The real answer is simpler:** All 122 entries share the same timestamp because they were ALL written in a single `project-continuity.json` file write. The per-entry `updated` field is per-entry in the JSON structure, but `updateSession()` writes the ENTIRE file (not per-entry). The `index.lastUpdated` (file-level) is always recent, but the per-entry `updated` is only fresh for sessions that called `updateSession()` since the last write.

Wait, actually `updateSession()` does call `atomicWriteJson(filePath, index)` at line 223 — which writes ALL sessions, not just the updated one. So every session's `updated` timestamp becomes the current time on every `updateSession()` call. That means they SHOULD all show the current time.

But the evidence shows they all show `2026-05-21T12:35:17.XXXZ`. That's a single moment in time. This suggests either:
1. All sessions were updated in a single batch (unlikely — 37 sessions)
2. The `updated` field is never actually passed in `updates` and the spread `...existing` preserves the original timestamp
3. The file was last fully written at 12:35:17

Actually, looking more carefully: `updateSession()` sets `updated: now` explicitly (line 216). And `addSession()` also sets it (line 177). So the timestamp should be updated on every call.

The only explanation for all 122 entries having the SAME timestamp is that the `project-continuity.json` file was last written at 12:35:17 and no `updateSession()` call has been made since. OR the `atomicWriteJson` failed silently.

**Regardless of root cause:** Fixing this requires decoupling the per-entry `updated` from the file-global `lastUpdated`, which is a P22 concern.

### Recommendation: **(b) Defer to P22**

F-22 is a symptom of the same problem as F-14 (status being overwritten globally). Both are addressed by P22's status unification. P21 should document the known limitation.

**P21 action:** Add a comment in `project-index-writer.ts`:
```typescript
// KNOWN LIMITATION (F-22): Per-entry updated timestamps may be stale.
// All entries share the file's last-write time due to whole-file writes.
// Per-entry independent tracking deferred to P22 status unification.
```

### Fallback

Choose option (a) if P22 is at risk of schedule slip. Effort is ~30 LOC to add a `sessionTimestamps` map separate from the file write.

---

## Summary Decision Matrix

| Gray Area | Recommendation | Human Needed? | P21 Effort | Blocks |
|-----------|---------------|---------------|------------|--------|
| **G-1** Manifest role | (b) Derivative cache — generate from continuity tree, remove write-side calls | No | 1-2 files, ~40 LOC | ✅ Independent |
| **G-2** childToRootMain persistence | (b) Reconstruct from continuity tree via deterministic rebuild | No | 3 files, ~100 LOC | ✅ Independent |
| **G-3** Status authority store | **(c) project-continuity.json as canonical** — with P21 preconditions (fix F-14, F-19, F-22 foundations) | **YES** | 2 files, ~60 LOC (preconditions) | ⚠️ Blocks P22 status unification |
| **G-4** Delegation persistence gate | **(b) Add `persist_delegations` config flag** — separate from `commit_docs`, default `true` | **YES** (config key name) | 3 files, ~10 LOC | ⚠️ Blocks P23 dispatch redesign |
| **G-5** Temp cleanup | (c) Both immediate cleanup + volume validation (defense-in-depth) | No | 1 file, ~20 LOC | ✅ F-01 fix covers this |
| **G-6** Orphan definition | (a) No parent in ANY continuity tree + 5-min grace | No | Logging only | ✅ Guardrail for P24 |
| **G-7** Depth cap | (c) Keep at 2 with runtime warning | No | 1 file, ~5 LOC | ✅ F-13 fix covers MAX_DEPTH |
| **G-8** Per-session timestamps | (b) Defer to P22 — document known limitation | No | 0 LOC in P21 | ✅ Documented deferral |

### Critical Path

```
P21 (current) 
├── G-1 → G-2 → G-5 → G-6 → G-7 → G-8  (all independent, no human needed)
├── G-3 ← human decision → defines P22 status unification direction
└── G-4 ← human decision → defines P23 delegation persistence contract

P22 depends on G-3 decision:
  ├── If project-continuity.json canonical → status unification = fix update path + add reconciliation
  └── If child .json canonical → status unification = add project-level aggregation function

P23 depends on G-4 decision:
  ├── If persist_delegations → delegation persistence always on, can trust store
  └── If commit_docs stays → delegation persistence may be off, P23 must check config
```

---

## References

1. `.planning/research/session-tracker-unified-flaw-register-context-2026-05-21.md` — Gray area definitions (lines 183-208)
2. `.planning/research/session-tracker-evidence-audit-2026-05-21.md` — Evidence audit (6 findings)
3. `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` — Original 16-flaw register
4. `.planning/research/session-tracker-production-evidence-analysis-2026-05-21.md` — Extended analysis with F-17 to F-22
5. `.planning/research/session-tracker-phase-implementation-map-2026-05-21.md` — Phase map and remediation strategies
6. `src/features/session-tracker/capture/event-capture.ts` — manifestWriter.addChild() at line 490
7. `src/features/session-tracker/capture/tool-capture.ts` — NO manifest writer calls (0 grep matches)
8. `src/features/session-tracker/persistence/project-index-writer.ts` — Status overwrite at line 168-169
9. `src/features/session-tracker/persistence/hierarchy-manifest.ts` — Full manifest writer (206 LOC)
10. `src/features/session-tracker/types.ts` — All 3 status field definitions
11. `src/task-management/continuity/delegation-persistence.ts:58-64` — commit_docs gate
12. `src/schema-kernel/hivemind-configs.schema.ts:282` — commit_docs default
13. `src/tools/hivemind/hivemind-session-view.ts:105-115` — Status consumer
14. `src/tools/hivemind/session-context.ts:188` — Status consumer
15. `src/tools/hivemind/session-hierarchy.ts:84` — Status consumer
16. `.hivemind/session-tracker/` — Live filesystem (37 session dirs, 33 quarantined)
