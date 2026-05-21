# Session-Tracker Design Fix — Phase 21 SPEC

**Date:** 2026-05-21
**Phase:** 21 (Group 1 — Orchestration Design Fix, HIGHEST PRIORITY)
**Status:** DRAFT — pending human authorization
**Evidence Level:** L2-L3 (filesystem proof + code analysis + production session exports)

---

## 1. Phase Goal

Make session-tracker persistence **authoritative, restart-safe, and internally consistent** so that Phase 16 query tools and Phases 22-28 orchestration work can trust it. Fix 6 flaw categories surgically (F-01, F-02/F-17, F-07, F-13, F-18, F-19), add guardrails for deferred flaws (F-05, F-20), apply G-3/G-4/G-5/G-6/G-7/G-8 resolved gray-area decisions, and produce a clean exit gate for P22 status unification.

---

## 2. Requirements (EARS Format)

### REQ-21-01: Temp File Cleanup After Every Write
| Field | Value |
|-------|-------|
| **ID** | REQ-21-01 |
| **EARS Type** | **Ubiquitous** — applies to every `atomicWriteJson()` call |
| **Description** | The `atomicWriteJson()` function SHALL delete its temporary file (`*.tmp.*`) immediately after a successful `rename()` to the target path. |
| **Acceptance Criteria** | A loop of 100 consecutive atomic writes leaves zero `.tmp.*` files in the session-tracker directory after each write completes. |
| **Verification** | Unit test: mock `rename` → assert `unlink(tmpPath)` is called after `rename()`. Integration test: loop 100 writes → glob `**/*.tmp.*` → assert count == 0. |
| **Source Flaw** | F-01 |
| **Plan** | 21-01 |

### REQ-21-02: Cross-Volume Rename Validation
| Field | Value |
|-------|-------|
| **ID** | REQ-21-02 |
| **EARS Type** | **Unwanted** — SHALL warn when rename is NOT atomic |
| **Description** | Before `rename()`, the system SHALL validate that the temp file path and the target file path reside on the same filesystem volume. If they differ, a warning SHALL be logged. |
| **Acceptance Criteria** | When `TMPDIR` is on a different volume than the target directory, a warning log entry is emitted that includes both device IDs. No data loss occurs (existing atomic fallback in OS handles cross-volume). |
| **Verification** | Unit test: mock `stat()` with different `dev` values → assert warning log emitted. |
| **Source Flaw** | F-01 (reinforcement) |
| **Plan** | 21-01 |

### REQ-21-03: Manifest Writing in Event-Capture Path
| Field | Value |
|-------|-------|
| **ID** | REQ-21-03 |
| **EARS Type** | **Event** — SHALL update manifest WHEN `session.created` fires from event-capture |
| **Description** | `event-capture.ts` SHALL call `manifestWriter.addChild()` when a new session child is created via the event-capture path. However, per G-1 resolution (manifest = derivative cache), this requirement is satisfied by generating the manifest from the continuity tree at read time, not by adding another write path. |
| **Acceptance Criteria** | All children visible in `session-continuity.json` hierarchy tree are also present in `hierarchy-manifest.json` after a `getManifest()` call that triggers cache regeneration. |
| **Verification** | Integration test: create root session → dispatch 3 delegates → call `getManifest()` → assert all 3 children appear in output. |
| **Source Flaw** | F-02 (reclassified), F-17 |
| **Plan** | 21-02 |

### REQ-21-04: Manifest Read-Side Generation from Continuity Tree
| Field | Value |
|-------|-------|
| **ID** | REQ-21-04 |
| **EARS Type** | **State** — manifest SHALL be a derivative cache |
| **Description** | Per G-1 resolution, `hierarchy-manifest.ts:getManifest()` / `getChildren()` SHALL generate the flattened manifest from the continuity tree when the cache is missing or stale. Remove write-side `addChild()` calls from `event-capture.ts` and `tool-delegation.ts` — the manifest is derived from the continuity tree, not independently written. |
| **Acceptance Criteria** | After removing write-side manifest calls, `get-manifest` tool returns identical children to those visible in `session-continuity.json` hierarchy tree. No children are missing. |
| **Verification** | Unit test: rebuild manifest from continuity tree → compare vs direct continuity read → assert same set of children. |
| **Source Flaw** | F-02, F-17 (fundamental resolution) |
| **Plan** | 21-02 |

### REQ-21-05: childToRootMain Persistence via Continuity Tree Rebuild
| Field | Value |
|-------|-------|
| **ID** | REQ-21-05 |
| **EARS Type** | **State** — childToRootMain SHALL survive restart |
| **Description** | Per G-2 resolution, after restart, `buildFromDisk()` SHALL reconstruct the `childToRootMain` mapping by walking the continuity tree hierarchy. Add a deterministic `rebuildChildToRootMain()` function in `hierarchy-index.ts` (no new file format). |
| **Acceptance Criteria** | After a simulated restart (reinitialize `SessionTracker`), `hierarchyIndex.getRootMain(childId)` returns the correct root session ID for any previously-persisted child. |
| **Verification** | Integration test: register L1→L2 child chain → flush writes to disk → reinitialize session-tracker → call `getRootMain(L2Id)` → assert root session ID matches the original root. |
| **Source Flaw** | F-07 |
| **Plan** | 21-04 |

### REQ-21-06: BuildFromDisk Rebuilds childToRootMain
| Field | Value |
|-------|-------|
| **ID** | REQ-21-06 |
| **EARS Type** | **Event** — SHALL rebuild WHEN `buildFromDisk()` completes |
| **Description** | `buildFromDisk()` SHALL call the new `rebuildChildToRootMain()` as the final step after reconstructing `childToParent` from session-continuity.json files. |
| **Acceptance Criteria** | After `buildFromDisk()` completes, the in-memory `childToRootMain` map has entries for every child in every continuity tree. |
| **Verification** | Unit test: create fixture continuity tree on disk → call `buildFromDisk()` → inspect `hierarchyIndex` → assert `getRootMain()` works for all children. |
| **Source Flaw** | F-07 |
| **Plan** | 21-04 |

### REQ-21-07: MAX_DEPTH Guard on ensureAncestorRoute
| Field | Value |
|-------|-------|
| **ID** | REQ-21-07 |
| **EARS Type** | **Unwanted** — SHALL NOT exceed MAX_DEPTH |
| **Description** | `ensureAncestorRoute()` in `session-tracker/index.ts` SHALL have a `MAX_DEPTH = 20` guard. When the recursion depth exceeds this limit, the function SHALL return gracefully with a logged warning instead of throwing a stack overflow. |
| **Acceptance Criteria** | A unit test with a deep (depth > 20) or cyclical parent chain does not cause a stack overflow. A warning is logged at the exceeded point. |
| **Verification** | Unit test: inject a chain of 25+ ancestors → call `ensureAncestorRoute()` → assert no crash → assert warning logged. |
| **Source Flaw** | F-13 |
| **Plan** | 21-04 |

### REQ-21-08: Anonymous Children Metadata Capture on Creation
| Field | Value |
|-------|-------|
| **ID** | REQ-21-08 |
| **EARS Type** | **Event** — SHALL capture real metadata WHEN child is created |
| **Description** | `event-capture.ts:writeImmediateChildFile()` SHALL accept and persist the real agent name, model, and description at creation time — not fallback `"unknown"` / `"pending"` values. |
| **Acceptance Criteria** | When a `delegate-task` dispatch creates a child session, the persisted child `.json` file shows the actual agent name (e.g., `hm-l2-researcher`), not `"unknown"`. |
| **Verification** | Integration test: dispatch `delegate-task` with `hm-l2-researcher` agent → read persisted child `.json` → assert `agentName === "hm-l2-researcher"`. |
| **Source Flaw** | F-18 |
| **Plan** | 21-03 |

### REQ-21-09: Anonymous Children Backfill on Delegation Completion
| Field | Value |
|-------|-------|
| **ID** | REQ-21-09 |
| **EARS Type** | **Event** — SHALL backfill WHEN delegation completes |
| **Description** | When a delegation completes (success or error), the system SHALL backfill the child `.json` file with the final agent identity and metadata if it was initially created with `"unknown"` / `"pending"` fallback values. |
| **Acceptance Criteria** | If a child was created with fallback values, after delegation completion the child `.json` file SHALL show the correct agent name. |
| **Verification** | Integration test: create child with insufficient metadata → simulate delegation completion → read child `.json` → assert `agentName` is updated. |
| **Source Flaw** | F-18 |
| **Plan** | 21-03 |

### REQ-21-10: childCount Computation in project-index-writer
| Field | Value |
|-------|-------|
| **ID** | REQ-21-10 |
| **EARS Type** | **State** — `childCount` SHALL be populated, not zero |
| **Description** | `project-index-writer.ts:updateSession()` SHALL compute `childCount` by walking the hierarchy tree (or reading from the hierarchy index) before writing the entry to `project-continuity.json`. |
| **Acceptance Criteria** | A root session with 5 children has `childCount: 5` in its `project-continuity.json` entry. A root with L1→L2 chain has `totalDelegationDepth: 2`. |
| **Verification** | Integration test: dispatch 5 delegates to root session → inspect `project-continuity.json` → assert `childCount === 5`. Unit test: verify the computation function returns correct count. |
| **Source Flaw** | F-19 |
| **Plan** | 21-02 |

### REQ-21-11: totalDelegationDepth Computation
| Field | Value |
|-------|-------|
| **ID** | REQ-21-11 |
| **EARS Type** | **State** — `totalDelegationDepth` SHALL reflect max depth |
| **Description** | `updateSession()` SHALL compute `totalDelegationDepth` as the maximum delegation depth in the hierarchy tree. |
| **Acceptance Criteria** | A session with L0→L1→L2 chain has `totalDelegationDepth: 2`. A session with only direct children (L0→L1) has `totalDelegationDepth: 1`. |
| **Verification** | Integration test with known hierarchy depth → inspect `project-continuity.json` → assert `totalDelegationDepth` matches expected max. |
| **Source Flaw** | F-19 |
| **Plan** | 21-02 |

### REQ-21-12: Status Overwrite Protection in addSession
| Field | Value |
|-------|-------|
| **ID** | REQ-21-12 |
| **EARS Type** | **Unwanted** — SHALL NOT overwrite existing status on hook callback |
| **Description** | Per G-3 precondition, `project-index-writer.ts:addSession()` SHALL NOT blanket-overwrite `existing.status` to `"active"` on every hook callback. Only initial creation sets status. Subsequent hook callbacks SHALL preserve the caller-provided status. |
| **Acceptance Criteria** | A session explicitly set to `"idle"` persists as `"idle"` across subsequent hook callbacks that don't explicitly change status. |
| **Verification** | Unit test: set session status to `"idle"` → simulate 10 hook callbacks with default parameters → assert `project-continuity.json` shows `"idle"`. |
| **Source Flaw** | F-14 (G-3 precondition for P22) |
| **Plan** | 21-05 |

### REQ-21-13: Delegation Persistence Gate Removal
| Field | Value |
|-------|-------|
| **ID** | REQ-21-13 |
| **EARS Type** | **Ubiquitous** — `persistDelegations()` SHALL always write |
| **Description** | Per G-4 resolution, remove the `commit_docs` gate from `src/task-management/continuity/delegation-persistence.ts:58-64`. `persistDelegations()` SHALL always write delegation records to disk. Keep the `commit_docs` schema field for GSD external use (162+ refs). |
| **Acceptance Criteria** | `persistDelegations()` writes delegation data to `.hivemind/state/delegations.json` regardless of `commit_docs` config value. |
| **Verification** | Unit test: set `commit_docs: false` → call `persistDelegations()` → assert delegations file is written. |
| **Source Flaw** | F-21 (G-4) |
| **Plan** | 21-05 |

### REQ-21-14: Orphan Quarantine Warning for Continuity-Tree Children
| Field | Value |
|-------|-------|
| **ID** | REQ-21-14 |
| **EARS Type** | **Event** — SHALL warn WHEN quarantining a session with continuity entry |
| **Description** | Per G-6 resolution, `orphan-cleanup.ts` SHALL check continuity tree existence before quarantining. If the child has a valid continuity tree entry, SHALL log a warning before quarantining. |
| **Acceptance Criteria** | When `orphanCleanup` processes a session that has a continuity tree entry, a warning is logged containing the session ID and "may be legitimate" message. |
| **Verification** | Unit test: seed continuity tree with child → trigger orphan cleanup for that child → assert warning log emitted. |
| **Source Flaw** | F-20 (guardrail for P24) |
| **Plan** | 21-06 |

### REQ-21-15: Depth Truncation Warning
| Field | Value |
|-------|-------|
| **ID** | REQ-21-15 |
| **EARS Type** | **Event** — SHALL warn WHEN depth exceeds 2 |
| **Description** | Per G-7 resolution, `hierarchy-index.ts:299` SHALL log a warning when `Math.min(depth, 2)` truncates a deeper delegation depth. The cap stays at 2, but truncation is observable. |
| **Acceptance Criteria** | When a delegation depth > 2 is encountered, a warning is logged indicating the truncated depth. |
| **Verification** | Unit test: register child with depth 5 → assert warning logged showing `delegation depth 5 exceeds max 2`. |
| **Source Flaw** | F-12 (guardrail) |
| **Plan** | 21-06 |

---

## 3. Plan Breakdown

### Plan 21-01: F-01 Temp Fix + F-05 Cross-Volume Guardrail
- **Scope:** `atomic-write.ts` (cleanup + volume validation)
- **Files:** 1-2
- **LOC:** ~25
- **Requirements:** REQ-21-01, REQ-21-02

### Plan 21-02: F-17/F-02 Manifest + F-19 childCount + F-22 Timestamp Precondition
- **Scope:** `hierarchy-index.ts`, `project-index-writer.ts`, `hierarchy-manifest.ts`
- **Files:** 3-4
- **LOC:** ~100
- **Requirements:** REQ-21-03, REQ-21-04, REQ-21-10, REQ-21-11

### Plan 21-03: F-18 Anonymous Children Metadata
- **Scope:** `event-capture.ts`, `tool-capture.ts`
- **Files:** 2-3
- **LOC:** ~60
- **Requirements:** REQ-21-08, REQ-21-09

### Plan 21-04: F-07 Recovery Blindness + F-13 MAX_DEPTH Guard
- **Scope:** `hierarchy-index.ts` (rebuild function), `session-tracker/index.ts` (MAX_DEPTH)
- **Files:** 2-3
- **LOC:** ~80
- **Requirements:** REQ-21-05, REQ-21-06, REQ-21-07

### Plan 21-05: G-3 Precondition Fixes + G-4 Gate Removal
- **Scope:** `project-index-writer.ts` (status overwrite), `delegation-persistence.ts` (gate removal), test files
- **Files:** 3
- **LOC:** ~40
- **Requirements:** REQ-21-12, REQ-21-13

### Plan 21-06: Guardrails + Integration Verification
- **Scope:** `orphan-cleanup.ts`, `hierarchy-index.ts` (depth warning), test files
- **Files:** 3-4
- **LOC:** ~50
- **Requirements:** REQ-21-14, REQ-21-15 + regression gates

---

## 4. Gray Area Decisions Applied

| Gray Area | Decision | Effect on SPEC |
|-----------|----------|----------------|
| **G-1** | Manifest = derivative cache | REQ-21-04: generate from continuity tree on read, remove write-side calls |
| **G-2** | childToRootMain = reconstruct from continuity tree | REQ-21-05, REQ-21-06 |
| **G-3** | project-continuity.json = canonical status authority | REQ-21-12: precondition fix (stop status overwrite) |
| **G-4** | Remove `commit_docs` gate from delegation persistence | REQ-21-13: always persist delegations |
| **G-5** | Clean temp after EVERY write + volume validation | REQ-21-01, REQ-21-02 |
| **G-6** | No parent in continuity = orphan | REQ-21-14: warning-only guardrail |
| **G-7** | Keep depth=2 with runtime warning | REQ-21-15 |
| **G-8** | Defer per-session timestamps to P22 | Documented known limitation; no requirement |

---

## 5. Regression Gates

| Gate | Evidence Required |
|------|-------------------|
| Typecheck | `npm run typecheck` passes with zero errors |
| Existing tests | All 2,382+ existing tests pass |
| New tests | All new test files for P21 requirements pass |
| No temp files | After 100 writes loop, 0 `.tmp.*` files |
| childCount > 0 | At least one session in test shows non-zero childCount |
| Manifest-complete | Generated manifest matches continuity tree |
| childToRootMain survives restart | Integration test proves rebuild |
| Gate removal confirmed | delegations.json written with commit_docs=false |

---

## References

1. `.planning/research/session-tracker-unified-flaw-register-context-2026-05-21.md` — 22-flaw register
2. `.planning/research/session-tracker-gray-areas-investigation-2026-05-21.md` — G-1 to G-8 analysis
3. `.planning/research/commit-docs-config-investigation-2026-05-21.md` — G-4 deep dive
4. `.planning/research/session-tracker-production-evidence-analysis-2026-05-21.md` — F-17 to F-22 evidence
5. `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` — Original 16-flaw register
6. `.planning/research/session-tracker-evidence-audit-2026-05-21.md` — Evidence audit
7. `.planning/research/session-tracker-phase-implementation-map-2026-05-21.md` — Phase implementation map
8. `.planning/research/phase-reordering-final-recommendation-2026-05-21.md` — Reordering context
