# Phase 21 Context — Session-Tracker Design Fix

**Date:** 2026-05-21
**Group:** 1 — Orchestration Design Fix (HIGHEST PRIORITY)
**Predecessor:** Phase 19-20 (root cleanup, dependency cleanup) — COMPLETE
**Successor:** P22 — Coordination Status + Error Unification

---

## Phase Goal

Fix 6 flaw categories in the session-tracker persistence layer surgically — making it authoritative, restart-safe, and internally consistent — without structural rewrites. The 6 categories are: temp file leak (F-01), manifest asymmetry (F-02/F-17), recovery blindness (F-07), MAX_DEPTH safety (F-13), anonymous children (F-18), and empty childCount (F-19). Phase 21 also applies 8 resolved gray-area decisions (G-1 through G-8), adds guardrails for deferred flaws (F-05 status divergence warning, F-20 orphan warning), and produces a clean exit gate for P22 status unification.

---

## Flaws Addressed

### Surgically Fixed (6 flaw categories)

| Flaw | Severity | Fix Approach | Effort | Primary File(s) | Exit Gate |
|------|----------|-------------|--------|-----------------|-----------|
| **F-01** (temp leak) | CRITICAL | Add `unlink(tmpPath)` after successful `rename()` + cross-volume validation | 1 file, ~25 LOC | `persistence/atomic-write.ts` | 0 `.tmp.*` files after 100 writes |
| **F-02/F-17** (manifest asymmetry) | HIGH | Per G-1: make manifest a derivative cache of continuity tree. Remove write-side `addChild()` calls, add read-side `generateFromContinuity()` | 3-4 files, ~100 LOC | `hierarchy-index.ts`, `hierarchy-manifest.ts`, `project-index-writer.ts` | Generated manifest matches continuity tree exactly |
| **F-07** (recovery blindness) | HIGH | Per G-2: add deterministic `rebuildChildToRootMain()` function that rebuilds from continuity tree at startup | 2-3 files, ~60 LOC | `hierarchy-index.ts` | `getRootMain(childId)` returns correct root after restart |
| **F-13** (MAX_DEPTH guard) | MEDIUM | Add `MAX_DEPTH = 20` guard to `ensureAncestorRoute()` | 1 file, ~5 LOC | `session-tracker/index.ts` | No stack overflow on cyclical chain |
| **F-18** (anonymous children) | CRITICAL | Capture real agent metadata at child creation time; add backfill on delegation completion | 2-3 files, ~60 LOC | `event-capture.ts`, `child-recorder.ts` | Persisted child JSON shows real `agentName`, not `"unknown"` |
| **F-19** (childCount = 0) | HIGH | Compute `childCount` and `totalDelegationDepth` before writing to project-continuity.json | 1 file, ~30 LOC | `project-index-writer.ts` | Session with 5 children shows `childCount: 5` |

### Guardrails Added (full fix deferred)

| Guardrail | For Flaw | Effort | Implementation | Deferred To |
|-----------|----------|--------|---------------|-------------|
| Status divergence WARNING | F-05 | ~10 LOC | Log warning when child `.json` status ≠ manifest status ≠ project-index status | P22 (status unification) |
| Orphan quarantine warning | F-20 | ~10 LOC | Check continuity tree before quarantining; log warning if child has valid entry | P24 (recovery redesign) |
| Depth truncation warning | F-12 | ~5 LOC | Log when `Math.min(depth, 2)` truncates | P23 (dispatch redesign) |

### Precondition Fixes (enable downstream phases)

| Fix | For | Effort | Purpose |
|-----|-----|--------|---------|
| Remove `existing.status` overwrite in `addSession()` | G-3 / F-14 | ~10 LOC | Stop status being reset to "active" on every hook callback; enables P22 status unification |
| Remove `commit_docs` gate from `persistDelegations()` | G-4 / F-21 | ~10 LOC | Delegations always persisted; enables P23 dispatch redesign |
| Document F-22 timestamp limitation in code | G-8 | ~5 LOC | Per-entry timestamps known to be stale; P22 will fix |

---

## Gray Areas Resolved (G-1 to G-8)

| Gray Area | Question | Resolution | Reasoning |
|-----------|----------|-----------|-----------|
| **G-1** | Role of `hierarchy-manifest.json`? | **Derivative cache** — generate from continuity tree on read. Remove write-side calls. | The continuity tree is the canonical hierarchy. Manifest is a flattened view — generate it from the tree at read time to eliminate drift. |
| **G-2** | How does `childToRootMain` survive restart? | **Reconstruct from continuity tree** via deterministic rebuild function. No new file format. | The hierarchy data is already in `session-continuity.json`. Add a rebuild function that walks the reconstructed tree. |
| **G-3** | Which store is canonical for session status? | **`project-continuity.json`** — with P21 preconditions (F-14 fix, F-19 fix). | It's the project-global index. P21 fixes its update path so P22 can trust it. |
| **G-4** | What to do with `commit_docs` gate? | **Remove from delegation-persistence.** Keep field in schema for GSD (162+ refs). | The gate was a design error (CA-03). Remove now. If opt-out needed later, add `persist_delegations` field. |
| **G-5** | When to clean temp files? | **Both** after every write AND volume validation. Defense-in-depth. | Post-rename `unlink()` handles common case. Volume validation prevents re-introduction on unusual filesystem configs. |
| **G-6** | What defines a legitimate orphan? | **No parent in ANY continuity tree** + 5-minute grace period. | Current algorithm is too aggressive (33 false quarantines). Fix in P24; add warning guardrail in P21. |
| **G-7** | Should depth cap of 2 be removed? | **Keep at 2 with runtime warning.** Make the cap observable. | Architecture explicitly limits depth (Q1). Warning allows monitoring during P23 dispatch redesign. |
| **G-8** | Fix per-session timestamps in P21? | **Defer to P22.** Same root cause as F-14 status overwrite. | Both are addressed by P22 status unification. Document known limitation. |

---

## Dependencies

### What P21 Needs (from prior phases)
| Dependency | Status | Notes |
|-----------|--------|-------|
| Phase 19-20 cleanup complete | ✅ COMPLETE | Dead code sweep, dependency cleanup |
| Production session exports available | ✅ AVAILABLE | `ses_1baf`, `ses_1bb1`, `ses_1bda` — 3 exports analyzed |
| `.hivemind/session-tracker/` filesystem intact | ✅ AVAILABLE | 37 session directories, 33 quarantined for evidence |
| Test baseline (2,382+ tests) | ✅ PASSING | Verified during Phase 20 gate |

### What P22+ Needs from P21
| Downstream Phase | Needs | Risk if Not Delivered |
|-----------------|-------|----------------------|
| **P22** (Status Unification) | G-3 preconditions: F-14 fix (status overwrite), F-19 fix (childCount). Stable `project-continuity.json` as canonical status store. | P22 cannot trust project-continuity.json — status unification is premature. |
| **P23** (Dispatch Fix) | G-4: delegation persistence always writes. F-07: childToRootMain survives restart. F-18: children have real agent metadata. | Dispatch redesign cannot rely on persisted delegation records. Recovery blindness means restart breaks child routing. |
| **P24** (Trajectory/Contract) | F-07: restart-safe hierarchy. G-6 guardrail data for quarantine fix. | Trajectory recovery builds on incorrect assumptions about which children exist after restart. |
| **P25** (Pressure/Notification) | F-19: childCount populated. Stable session hierarchy index. | Pressure scoring cannot evaluate delegation depth/count — decisions are uninformed. |
| **P28** (Auto-Loop/PTY) | F-07: restart-safe child routing. Stable manifest. | Auto-loop resumption after restart drops child connections. |

---

## Entry / Exit Gates

### Entry Gates (P21 can begin when...)
- [x] Phase 19-20 complete (dead code sweep, dependency cleanup)
- [x] All 8 research artifacts produced and cross-referenced
- [x] Gray area decisions (G-1 to G-8) locked
- [x] 15 EARS requirements defined in SPEC.md
- [ ] **User authorization received** to begin P21 execution

### Exit Gates (P21 is complete when...)
| Gate | Verification | Evidence Level |
|------|-------------|---------------|
| F-01 fixed | Loop 100 atomic writes → glob `**/*.tmp.*` → assert 0 | L1 (live test) |
| F-02/F-17 fixed | Integration test: root session + delegates → manifest matches continuity tree | L1 (test) |
| F-07 fixed | Simulate restart: `getRootMain()` returns correct root for all children | L1 (integration test) |
| F-13 fixed | Unit test with cyclical chain → no crash | L1 (unit test) |
| F-18 fixed | Persisted child `.json` shows real `agentName` after delegate dispatch | L1 (integration test) |
| F-19 fixed | Session with children shows `childCount > 0` | L1 (integration test) |
| G-3 precondition | Status not overwritten to "active" on hook callback without explicit change | L1 (unit test) |
| G-4 removed | `persistDelegations()` writes with `commit_docs: false` | L1 (unit test) |
| Regression | `npm run typecheck` passes | L3 (tool output) |
| Regression | `npm test` — all 2,382+ existing tests pass | L1 (test run) |
| Regression | All P21 new tests pass | L1 (test run) |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| **Manifest derivative cache breaks consumer** | LOW | HIGH | Keep `writeManifest()` as cache-write optimization. Generate from continuity tree only on cache miss. |
| **childToRootMain rebuild is non-deterministic** | MEDIUM | MEDIUM | DAG hierarchies (child under multiple parents) exist. Rebuild picks the first root found. Document this. |
| **Gate removal breaks GSD framework** | LOW | HIGH | `commit_docs` kept in schema. Only the delegation-persistence consumer changes. GSD uses `gsd-sdk query config-get` — unaffected. |
| **Status fix breaks existing hooks** | MEDIUM | MEDIUM | Some hooks may depend on status being "active" after callback. Verify all 3 hook consumers. |
| **Scope creep into P22 territory** | HIGH | MEDIUM | Status unification is tempting to fix "a little more" in P21. Strict boundary: P21 fixes F-14 precondition ONLY. Full unification is P22. |

---

## Quick Wins (Highest Impact ÷ Lowest Effort)

| Fix | Effort | Impact | Rationale |
|-----|--------|--------|-----------|
| F-13 MAX_DEPTH guard | ~5 LOC | Stack overflow prevention | Trivial change, prevents crash |
| G-4 gate removal | ~10 LOC | Enables delegation persistence | Fixes silent data loss |
| F-01 temp cleanup | ~25 LOC | Eliminates CRITICAL data loss risk | Proven production failure |
| F-19 childCount computation | ~30 LOC | Fixes `hivemind-session-view` output | Makes session-view useful immediately |
| F-18 metadata capture | ~60 LOC | Fixes anonymous children | Most visible data quality issue |

---

## Reference Index

| Document | Path | Relevance |
|----------|------|-----------|
| Unified Flaw Register | `.planning/research/session-tracker-unified-flaw-register-context-2026-05-21.md` | 22-flaw register, phase scope, 8 gray areas |
| Gray Areas Investigation | `.planning/research/session-tracker-gray-areas-investigation-2026-05-21.md` | G-1 to G-8 deep analysis |
| commit_docs Investigation | `.planning/research/commit-docs-config-investigation-2026-05-21.md` | G-4 deep dive |
| Production Evidence | `.planning/research/session-tracker-production-evidence-analysis-2026-05-21.md` | F-17 to F-22 with live filesystem proof |
| Original Flaw Analysis | `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` | 16-flaw original register |
| Evidence Audit | `.planning/research/session-tracker-evidence-audit-2026-05-21.md` | 6-critical-finding evidence audit |
| Implementation Map | `.planning/research/session-tracker-phase-implementation-map-2026-05-21.md` | Phase map, consumer analysis |
| Phase Reordering | `.planning/research/phase-reordering-final-recommendation-2026-05-21.md` | Why P21 is first in Group 1 |
| ROADMAP.md | `.planning/ROADMAP.md` | Current milestone context |
| STATE.md | `.planning/STATE.md` | State of all preceding phases |
| AGENTS.md | `AGENTS.md` | Project-level phase context |
| Session Export 1 | `session-ses_1baf.md` | 10,015 LOC production trace |
| Session Export 2 | `session-ses_1bb1.md` | 10,513 LOC production trace |
| Session Export 3 | `session-ses_1bda.md` | 10,716 LOC production trace |
| Source: atomic-write.ts | `src/features/session-tracker/persistence/atomic-write.ts` | F-01 root cause (160 LOC) |
| Source: hierarchy-manifest.ts | `src/features/session-tracker/persistence/hierarchy-manifest.ts` | F-02/F-17 root cause (206 LOC) |
| Source: hierarchy-index.ts | `src/features/session-tracker/persistence/hierarchy-index.ts` | F-07, F-12, F-13 root cause (308 LOC) |
| Source: event-capture.ts | `src/features/session-tracker/capture/event-capture.ts` | F-17, F-18 root cause |
| Source: project-index-writer.ts | `src/features/session-tracker/persistence/project-index-writer.ts` | F-19, F-14, F-22 root cause |
| Source: delegation-persistence.ts | `src/task-management/continuity/delegation-persistence.ts` | F-21 root cause |
| Source: orphan-cleanup.ts | `src/features/session-tracker/persistence/orphan-cleanup.ts` | F-20 root cause |
