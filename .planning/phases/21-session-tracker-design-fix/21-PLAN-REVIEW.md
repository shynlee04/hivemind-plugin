# Phase 21 Plan Review

**Date:** 2026-05-21  
**Reviewer:** gsd-plan-checker  
**Plans reviewed:** 6 (21-01 through 21-06)

---

## Summary

**Overall verdict:** PASS — 2 BLOCKER issues were fixed in re-verification. 4 WARNING issues remain (non-blocking).

**Plans reviewed:** 6  
**Issues found:** 2 BLOCKER (FIXED), 4 WARNING, 1 INFO

All 15 EARS requirements are claimed by at least one plan. The plan structure (Wave ordering, task structure, threat models) is excellent — among the most thorough plan sets reviewed. The two production-blocking gaps identified in the initial review have been corrected:

1. **✅ `tool-delegation.ts:288` removed** — Plan 02 Task 3 Step 5 now explicitly removes the `manifestWriter.addChild()` call at L288-296. Zero write-side addChild calls remain after both removals (event-capture + tool-delegation).
2. **✅ `initialization.ts:99` wired** — Plan 02 Task 2 Step 5 now explicitly passes `hierarchyIndex` to `ProjectIndexWriter` constructor. The `computeChildCount()`/`computeMaxDepth()` methods will use a live hierarchy index at runtime.

---

## Per-Plan Review

### Plan 21-01: F-01 Temp Fix + Cross-Volume Guardrail

| Dimension | Result |
|-----------|--------|
| Requirement coverage | PASS — REQ-21-01, REQ-21-02 fully covered |
| Completeness | PASS — 3 tasks, all with Files+Action+Verify+Done+read_first |
| Dependencies | **Incorrect** — `depends_on: []` with `wave: 2` (should be Wave 1) |
| Feasibility | PASS — ~30 LOC, correct implementation, verifiable exit criteria |
| Anti-patterns | None |

**Verdict:** CONDITIONAL  
**Issues:**
- **WARNING:** Wave inconsistency — `depends_on: []` but manual `wave: 2`. Plans with no dependencies should be Wave 1. This affects the RESEARCH.md dependency graph which says "can run in parallel with any plan" — Wave 2 suggests it waits but it doesn't need to.
- **WARNING:** Context path typo at L51: `design-fit` (should be `design-fix`). Won't break execution but shows editorial slip.

**Strengths:** Fixes ALL 3 write-tmp-rename sites (atomicWriteJson, atomicAppendMarkdown, writeManifest). Cross-volume stat() check correctly placed after writeFile, before rename. Try/catch unlink with best-effort pattern matches project conventions. 100-write integration test is properly rigorous.

---

### Plan 21-02: Manifest Derivative Cache + childCount/depth

| Dimension | Result |
|-----------|--------|
| Requirement coverage | **PASS** — REQ-21-04 fully covered after fixes (both event-capture.ts AND tool-delegation.ts) |
| Completeness | PASS — 4 tasks (borderline), all have required sections |
| Dependencies | PASS — `depends_on: []` with `wave: 1` ✅ |
| Feasibility | **PASS** — `initialization.ts:99` now wires `hierarchyIndex` into `ProjectIndexWriter` |
| Anti-patterns | 4 tasks (WARNING threshold) |

**Verdict:** **PASS** (2 blockers fixed in re-verification)  
**Issues:**
- **FIXED [REQ-21-04 gap]:** Plan 02 now explicitly removes `manifestWriter.addChild()` from `tool-delegation.ts:288-296` (Task 3 Step 5). Verification confirms both sites removed. Zero write-side addChild calls remain.
- **FIXED [Initialization wiring gap]:** Plan 02 now explicitly wires `hierarchyIndex` into `ProjectIndexWriter` constructor at `initialization.ts:99` (Task 2 Step 5). childCount/depth computation is live at runtime.
- **WARNING:** 4 tasks in one plan exceeds the 2-3 task target threshold. Quality may degrade, especially given the architectural complexity of the derivative cache pattern.

**Strengths:** `generateFromContinuity()` correctly handles cache miss, missing continuity file, and full regeneration. `loadManifest()` regeneration pattern is clean. Removal of `event-capture.ts:490` write-side call is correct. Child walking with recursion handles arbitrary depth.

---

### Plan 21-03: F-18 Anonymous Children

| Dimension | Result |
|-----------|--------|
| Requirement coverage | PASS — REQ-21-08, REQ-21-09 covered |
| Completeness | PASS — 3 tasks, all complete |
| Dependencies | **Incorrect** — `depends_on: []` with `wave: 2` (should be Wave 1) |
| Feasibility | CONDITIONAL — see issues below |
| Anti-patterns | None |

**Verdict:** CONDITIONAL  
**Issues:**
- **WARNING:** `explicitAgentName` and `explicitModel` parameters are added to `writeImmediateChildFile()` but NONE of the 4 call sites (L200, L235, L248, L263) are updated to pass them. The parameters are dead code — they're always `undefined` at runtime. The fix still works for 2 of 4 call sites (L200, L263) via the `subagentType` fallback, and the backfill catches the remaining 2 (L235, L248). But the primary-fix-through-signature-extensions is incomplete.
- **WARNING:** Same wave inconsistency as Plan 01 — `depends_on: []` with `wave: 2`.
- **INFO:** The L235 and L248 call sites (SDK-based child, hierarchy index child) have NO metadata source even after the fix. They rely solely on the backfill mechanism. This is a documented known limitation but worth highlighting.

**Strengths:** Backfill pattern correctly follows existing `updateChildStatus()` enqueueWrite pattern. No-overwrite guard (only backfills when `mainAgent.name === "pending"`) prevents dangerous overwrites. Missing file no-op is correct. STRIDE threat model correctly identifies backfill race with concurrent reads.

---

### Plan 21-04: F-07 Recovery + F-13 MAX_DEPTH

| Dimension | Result |
|-----------|--------|
| Requirement coverage | PASS — REQ-21-05, REQ-21-06, REQ-21-07 fully covered |
| Completeness | PASS — 3 tasks, all complete |
| Dependencies | **Incorrect** — `depends_on: []` with `wave: 2` |
| Feasibility | PASS |
| Anti-patterns | None |

**Verdict:** PASS (with wave warning)  
**Issues:**
- **WARNING:** Same wave inconsistency — `depends_on: []` with `wave: 2`.

**Strengths:** `rebuildChildToRootMain()` method is correctly additive with no signature changes to existing methods. Called at end of `buildFromDisk()` after the existing second pass — clean architecture. DAG first-found-wins strategy correctly documented. `MAX_DEPTH=20` guard is well-implemented with proper warning log via `this.client.app?.log`. `depth` parameter correctly threaded through recursion. Tests for L0→L1→L2 chain, disk fixture, and isolated children.

---

### Plan 21-05: G-3 Precondition + G-4 Gate Removal

| Dimension | Result |
|-----------|--------|
| Requirement coverage | PASS — REQ-21-12, REQ-21-13 fully covered |
| Completeness | PASS — 3 tasks, all complete |
| Dependencies | **Incorrect** — `depends_on: []` with `wave: 2` |
| Feasibility | PASS |
| Anti-patterns | None |

**Verdict:** PASS (with wave warning)  
**Issues:**
- **WARNING:** Same wave inconsistency — `depends_on: []` with `wave: 2`.

**Strengths:** Status overwrite fix correctly distinguishes between initial creation (`status: "active"`) and subsequent callbacks (preserve existing). Gate removal correctly keeps `commit_docs` schema field for GSD (162+ refs). Test removal guidance for `commit_docs` toggle tests is appropriate. STRIDE correctly identifies that explicit status passes still work — only the BLANKET reset is removed.

---

### Plan 21-06: Guardrails + Integration Verification

| Dimension | Result |
|-----------|--------|
| Requirement coverage | PASS — REQ-21-14, REQ-21-15 fully covered |
| Completeness | PASS — 3 tasks, all complete |
| Dependencies | PASS — `depends_on: ["21-02"]` with `wave: 3` ✅ |
| Feasibility | PASS |
| Anti-patterns | None |

**Verdict:** PASS  
**Issues:** None

**Strengths:** Correctly uses `depends_on: ["21-02"]` to express real dependency on manifest derivative cache. Wave 3 = max(2) + 1 = 3 — correct. Orphan guardrail correctly uses `access()` to check continuity file existence before quarantine — warning-only, no behavioral change. Depth warning correctly uses `process.emitWarning()` since `hierarchy-index.ts` has no client reference. Integration test covers all 5 phases (F-01, F-19, F-18, F-07, G-3) with proper temp-dir lifecycle.

---

## Wave Structure Review

| Plan | depends_on | Wave | Expected Wave | Status |
|------|-----------|------|---------------|--------|
| 21-01 | [] | 2 | 1 | ❌ Incorrect |
| 21-02 | [] | 1 | 1 | ✅ Correct |
| 21-03 | [] | 2 | 1 | ❌ Incorrect |
| 21-04 | [] | 2 | 1 | ❌ Incorrect |
| 21-05 | [] | 2 | 1 | ❌ Incorrect |
| 21-06 | [21-02] | 3 | 2 | ✅ Correct |

**Rule:** `depends_on: []` → Wave 1. Plans 01, 03, 04, 05 should all be Wave 1 since they have no dependencies. This doesn't affect execution ordering (they'll all run in parallel in Wave 1) but the manual `wave: 2` creates confusion about whether they were intended to wait for something.

**Parallel execution candidates:** Plans 01, 02, 03, 04, 05 can all run in parallel (Wave 1). Plan 06 must wait for Plan 02 (Wave 2).

---

## Cross-Plan Issues

### Duplicate Work
None identified.

### Missing Coverage (All FIXED in re-verification)
1. **REQ-21-04 scope gap:** ✅ **FIXED** — Plan 02 now removes `manifestWriter.addChild()` from `tool-delegation.ts:288-296` in addition to `event-capture.ts:490`. Zero write-side addChild calls remain.
2. **initialization.ts wiring gap for childCount:** ✅ **FIXED** — Plan 02 now passes `hierarchyIndex` into `ProjectIndexWriter` constructor at `initialization.ts:99`. childCount/depth computation is live at runtime.

### Conflicting Approaches
None identified. All plans are internally consistent.

---

## Anti-Pattern Scan Results

| Anti-Pattern | Status | Details |
|-------------|--------|---------|
| Promise-chaining without error handling | ✅ None | Plans use proper try/catch |
| Silent catch blocks | ✅ None | All catch blocks have comments |
| In-memory state without persistence | ✅ Fixed | F-07 Plan 04 adds rebuild from continuity |
| Asymmetric write paths | ✅ Fixed | G-1 Plan 02 makes manifest derivative |
| Schema fields never populated | ⚠️ PARTIALLY FIXED | Plan 02 adds childCount computation but won't work at runtime (blocker #2) |
| Config field name != behavior | ✅ Fixed | G-4 Plan 05 removes the gate |
| No temp cleanup after write | ✅ Fixed | Plan 01 adds unlink to all 3 sites |
| Dead function parameters | ⚠️ PARTIAL | Plan 03 adds explicitAgentName/explicitModel but no callers pass them |

---

## Recommendations

### Before Execution (all BLOCKERS FIXED)

**BLOCKER 1: ✅ FIXED** — Plan 02 Task 3 Step 5 removes `manifestWriter.addChild()` from `tool-delegation.ts:288-296`. Both write-side paths (event-capture + tool-delegation) are removed. Zero calls remain.

**BLOCKER 2: ✅ FIXED** — Plan 02 Task 2 Step 5 wires `hierarchyIndex` into `ProjectIndexWriter` at `initialization.ts:99`. childCount/depth computation is live at runtime.

### Should Fix (WARNINGS)

**WARNING: Wave numbering — all 4 plans with empty depends_on should be Wave 1.**

Change `wave: 2` to `wave: 1` in Plans 01, 03, 04, 05. This is cosmetic but eliminates confusion in the execution engine about whether these plans are truly independent.

**WARNING: Plan 02 has 4 tasks — consider splitting.**

Plan 02 is the most architecturally significant plan (derivative cache + childCount + depth + manifest removal + DI wiring + tests). Consider splitting into Plan 02a (manifest derivative cache) and Plan 02b (childCount/depth computation + wiring). Not a blocker, but the combined scope risks quality degradation.

**WARNING: Plan 03 explicitAgentName parameter is dead code.**

Either update the 4 call sites to pass the new parameters (L200, L235, L248, L263), or remove the parameters and keep only the subagentType-based fallback. The current state adds dead code paths that complicate future maintenance.

**WARNING: Fix typo in Plan 01 L51 context path.**

---

## Exit Gate Assessment

| Gate | Status with Current Plans |
|------|--------------------------|
| Phase 21 goal achievable with these plans? | **YES** — 2 BLOCKER issues have been fixed |
| All 15 REQs covered? | **YES** — REQ-21-04 fully covered after tool-delegation.ts fix |
| Typecheck + tests pass expected? | **YES** — plans use proper verify commands with typecheck + vitest |
| F-01 fixed (0 `.tmp.*` files) | Achievable |
| F-02/F-17 fixed (manifest matches continuity) | ✅ Achievable — both write-side paths removed |
| F-07 fixed (getRootMain survives restart) | Achievable |
| F-13 fixed (no stack overflow) | Achievable |
| F-18 fixed (real agentName in children) | Conditionally achievable (backfill works, primary capture partial) |
| F-19 fixed (childCount > 0) | ✅ Achievable — initialization.ts:99 wired |
| G-3 precondition (status preserved) | Achievable |
| G-4 removed (always persist delegations) | Achievable |

### Resolution Path (COMPLETE)

Both BLOCKER issues resolved in re-verification:

1. ✅ **BLOCKER 1 (tool-delegation.ts:288):** Plan 02 now removes `manifestWriter.addChild()` from `tool-delegation.ts:288-296` (Task 3 Step 5)
2. ✅ **BLOCKER 2 (initialization.ts:99 wiring):** Plan 02 now passes `hierarchyIndex` to `ProjectIndexWriter` constructor (Task 2 Step 5)

Re-run plan review confirmed all gates pass.
