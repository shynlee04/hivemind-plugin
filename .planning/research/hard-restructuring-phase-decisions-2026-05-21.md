# Hard Restructuring — Phase Insertion Decisions

**Date:** 2026-05-21
**Author:** gsd-advisor-researcher (subagent)
**Calibration tier:** full_maturity
**Context:** User directive to restructure `src/` systematically — audit → truth verification → integration → resolve — then cluster by lifecycle/actors/consumers, partition features by harness mechanism, starting from user journey source.

---

## Executive Summary

Phases 19-20 are COMPLETE. Phase 21 (Sync I/O Async) is the next planned phase but is **blocked by unresolved architectural decisions** about how to sequence the remaining 5 restructuring phases (22-26). This document resolves 8 gray areas and recommends a **7-phase insertion sequence** (renumbered as Phases 19-25, with original Phases 19-25 pushed to 26-32). The recommended sequence follows the HIVEMIND-PHILOSOPHY pillars: non-destructive first (Iteratively Granular), architecture before cleanup (Hierarchical Superiority), and truth verification at every gate (Strategically Measurable).

**Key recommendation:** Use **decimal insertion** (19.1, 19.2, ...) for the new restructuring phases rather than renumbering the entire roadmap. This preserves commit history references, avoids breaking phase manifest links, and aligns with GSD's established pattern for mid-milestone insertions (e.g., CP-DT-01-06, CA-04.1-04.4).

---

## Gray Area Decisions

| Decision | Options | Recommendation | Rationale |
|----------|---------|----------------|-----------|
| **1. Phase numbering** | (A) Decimal insertion (19.1-19.7), (B) Renumber everything (19→26, 20→27, etc.), (C) New workstream prefix (HR-01 through HR-07) | **Rec: Option A — Decimal insertion** | ROADMAP.md already uses decimal patterns (CA-04.1-04.4, CP-DT-01-01 through 06). Renumbering breaks 50+ cross-references in STATE.md, ROADMAP.md, and phase plan files. Decimal insertion is the established GSD pattern for mid-milestone insertions. New workstream prefix creates unnecessary namespace fragmentation. |
| **2. Cluster boundary for cross-cutting modules** | (A) Assign by primary consumer (who calls it most), (B) Assign by data ownership (who mutates its state), (C) Create shared/ sub-module for cross-cutting code | **Rec: Option B — Assign by data ownership** | HIVEMIND-PHILOSOPHY CQRS principle: write-side owns the data, read-side observes. `session-api.ts` imports from routing/ because it reads behavioral profiles — the write-side is `routing/behavioral-profile/`, so the read function belongs there. This eliminates the leaf violation by moving the function to its data owner. |
| **3. Journal subsystem (540 LOC unwired)** | (A) Wire into lifecycle handler, (B) Delete and defer to future, (C) Formally defer with @future annotation + tracking issue | **Rec: Option C — Formally defer** | The journal was designed as an append-only audit trail (Q3 decision) but has no runtime consumers. Wiring it now adds complexity without evidence of need. Deleting it wastes 540 LOC of thoughtful design. Formal deferral preserves the design for future use while keeping it out of the active codebase. Add `@future — wire when session-journal-export tool proves insufficient` annotation to `task-management/journal/index.ts`. |
| **4. Sidecar/readonly-state.ts (120 LOC, 2/10 readiness)** | (A) Integrate into existing tool surface, (B) Delete, (C) Formally defer with @future annotation | **Rec: Option C — Formally defer** | The sidecar is a Q2 decision (sidecar dashboard) that requires the `@json-render/*` stack now moved to optionalDependencies. Integrating it prematurely creates a half-wired feature. Deleting it wastes design work that may be needed when Q2 is confirmed. Formal deferral is the PHILOSOPHY-aligned choice: preserve the design, defer the implementation until the sidecar decision is confirmed. |
| **5. Dual delegation stores (coordinator.ts + state-machine.ts)** | (A) Consolidate now into single store, (B) Keep dual, add drift detection, (C) Defer until v1 migration complete | **Rec: Option B — Keep dual, add drift detection** | Consolidation (Option A) is the correct end-state but is a HIGH-risk change to the delegation runtime path — the most complex surface in the codebase. Adding drift detection (a periodic consistency check between the two stores) is a LOW-risk phase that surfaces the problem without changing behavior. Full consolidation belongs in a post-restructuring phase when the v1 migration facade is removed. |
| **6. Manager.ts migration facade (362 LOC v1/v2 bridge)** | (A) Remove v1 paths now, (B) Keep and annotate with removal gate, (C) Defer until all v1 callers migrated | **Rec: Option B — Keep and annotate with removal gate** | CONCERNS.md confirms the facade is fragile but functional. Removing v1 paths now (Option A) requires verifying that zero callers use the v1 runtime adapter path — which requires L1 runtime proof we don't have. Annotating each v1 method with `@deprecated — remove after <caller-migration-verified>` and tracking in CONCERNS.md is the PHILOSOPHY-aligned "Strategically Measurable" approach. |
| **7. Test-first vs refactor-first** | (A) Add tests before every refactor (safety net), (B) Refactor first, add tests after (easier to test clean code), (C) Hybrid — tests for high-risk refactors only | **Rec: Option C — Hybrid** | The codebase has 2,382 passing tests providing a strong regression baseline. Adding tests before every refactor (Option A) would double the restructuring timeline. Refactoring first (Option B) is acceptable for LOW-risk changes (dead code deletion, import path standardization) but unacceptable for HIGH-risk changes (plugin decomposition, CQRS boundary fixes). The hybrid approach: add targeted tests BEFORE plugin decomposition and CQRS fixes; rely on existing regression suite for LOW-risk changes. |
| **8. Scope containment** | (A) 3 phases max (minimal viable restructuring), (B) 7 phases (comprehensive), (C) 10+ phases (everything in the map) | **Rec: Option B — 7 phases** | The hard-restructuring map identifies 3 CRITICAL + 6 HIGH + 10 MEDIUM findings. A 3-phase scope (Option A) cannot address the CRITICAL findings without leaving HIGH findings as active risks. A 10+ phase scope (Option C) exceeds reasonable insertion limits and creates scope creep. 7 phases covers all CRITICAL and HIGH findings, addresses the most impactful MEDIUM findings (plugin decomposition, sync I/O, typed errors), and defers lower-priority items to post-restructuring. |

---

## Recommended Phase Insertion Sequence

All phases use decimal insertion under Phase 19. Original Phases 19-25 are pushed to Phases 26-32.

### Phase 19.1 — Dead Code Final Sweep + Dist Rebuild

**Scope:** Delete remaining dead code identified by synthesis (not covered by Phase 19): `permission.schema.ts` bug fix before deletion, `skill-metadata.schema.ts` consumer verification, `messages-transform.ts` (67 LOC, zero imports), `spawner/concurrency-key.ts` (12 LOC), deprecated profile methods. Rebuild `dist/` to eliminate stale artifacts.

**Entry gate:** Phase 19 COMPLETE (verified: `npm test` passes, `dist/` rebuilt)
**Exit gate:** `npm test` passes, `npm run typecheck` clean, `dist/` contains only active modules, zero grep hits for deleted module names in `src/`
**Risk:** VERY LOW — non-destructive deletions only
**Estimated scope:** 8 files, ~300 LOC removed

### Phase 19.2 — Plugin Decomposition (Phase 23 content, moved up)

**Scope:** Extract tool registration map → `src/tools/registry.ts`, startup tasks → `src/plugin/startup.ts`, hook composition → `src/hooks/composition/composer.ts`. Fix fire-and-forget promise hygiene (5 `.catch()` additions). Fix `setupDelegationModules` temporal coupling. Remove legacy non-SDK hooks (`system.transform`, `messages.transform`). Fix `decompileAgent` bug. Fix `execute-slash-command` return envelope. Standardize `tool()` import paths.

**Entry gate:** Phase 19.1 COMPLETE (clean dist, no dead code)
**Exit gate:** `plugin.ts` < 200 LOC, `npm test` passes (regression baseline), `npm run typecheck` clean, all 23 tools verified registered, fire-and-forget promises have `.catch()` handlers
**Risk:** MODERATE — composition root changes require careful ordering verification
**Estimated scope:** 6 new files, `plugin.ts` 493 → ~150 LOC

### Phase 19.3 — Sync I/O Async Conversion (original Phase 21)

**Scope:** Convert sync `fs` calls to `fs/promises` in runtime paths: `task-management/continuity/index.ts`, `continuity/delegation-persistence.ts`, `features/agent-work-contracts/store.ts`, `plugin.ts` startup path. Retain sync I/O only in CLI cold-start paths (`cli/`, `bin/`, `bootstrap-init.ts`).

**Entry gate:** Phase 19.2 COMPLETE (plugin decomposed, no composition root risk)
**Exit gate:** Sync I/O count in runtime paths < 30, `npm test` passes, `npm run typecheck` clean, CLI cold-start paths verified functional
**Risk:** MODERATE — must not break cold-start/CLI paths
**Estimated scope:** 7 files, ~130 sync calls converted

### Phase 19.4 — Typed Error Hierarchy (original Phase 22)

**Scope:** Create `src/shared/errors.ts` with 5 typed error classes (`HarnessValidationError`, `HarnessPermissionError`, `HarnessNotFoundError`, `HarnessPersistenceError`, `HarnessRuntimeError`). Replace ~100 `throw new Error` sites across 45 files. Fix silent `catch {}` blocks in `lifecycle/index.ts` and `orphan-cleanup.ts`.

**Entry gate:** Phase 19.3 COMPLETE (async I/O stable)
**Exit gate:** Zero `throw new Error("[Harness]")` sites remaining, all 5 error classes have dedicated tests, silent catch blocks replaced with typed error handling, `npm test` passes
**Risk:** LOW — behaviorally equivalent until callers catch specific types
**Estimated scope:** 1 new file, 45 files modified

### Phase 19.5 — CQRS Boundary Enforcement + shared/ Leaf Fix

**Scope:** Fix `tool-after-workflow.ts` CQRS violation (move durable writes from hooks sector). Make `assertHookWriteBoundary` actually enforce at runtime. Move `getSessionBehavioralProfile()` from `session-api.ts` to `routing/behavioral-profile/`. Add drift detection between dual delegation stores (coordinator.ts + state-machine.ts). Annotate manager.ts v1 paths with `@deprecated` removal gates.

**Entry gate:** Phase 19.4 COMPLETE (typed errors stable)
**Exit gate:** Zero CQRS violations (verified by grep for `persistWorkflow` in hooks/), `assertHookWriteBoundary` throws on durable-write attempt, `session-api.ts` has zero imports from routing/, drift detection test proves consistency check works, manager.ts v1 methods annotated
**Risk:** MODERATE — CQRS changes affect runtime behavior
**Estimated scope:** 5 files modified, 1 new drift detection module

### Phase 19.6 — Module Size Fixes + Test Gap Closure

**Scope:** Split `event-capture.ts` (702 LOC) by lifecycle event family. Split `session-tracker/index.ts` (561 LOC) — extract initialization block. Simplify `PendingDispatchRegistry` (3 reverse indices → simple Map pair). Add tests for: routing/session-entry/ (542 LOC), config/compiler.ts (410 LOC), hivemind-session-view.ts (127 LOC).

**Entry gate:** Phase 19.5 COMPLETE (CQRS boundaries enforced)
**Exit gate:** Zero files over 500 LOC cap, new test files provide coverage for previously untested modules, `npm test` passes with increased coverage, `npm run typecheck` clean
**Risk:** MODERATE — module splitting changes import graphs
**Estimated scope:** 4 new files, 3 files split, 3 new test files

### Phase 19.7 — Formal Deferrals + Legacy Inventory + Integration Verification

**Scope:** Formally defer journal/ (540 LOC) and sidecar/readonly-state.ts (120 LOC) with `@future` annotations and tracking issues. Inventory all 48 legacy/deprecated references with owner + removal gate dates. Full integration verification: `npm run typecheck`, `npm test`, rebuild `dist/`, update all manifests (STRUCTURE.md, ARCHITECTURE.md, CONCERNS.md, AGENTS.md).

**Entry gate:** Phase 19.6 COMPLETE (all module splits and tests done)
**Exit gate:** All deferred modules annotated, legacy inventory committed, manifests synced, `npm test` passes (regression baseline), `dist/` clean, STATE.md focus advanced to Phase 20 (original)
**Risk:** LOW — documentation and verification only
**Estimated scope:** 10 files annotated, 4 manifests updated

---

## Risk Mitigations

| Risk | Mitigation | Trigger |
|------|-----------|---------|
| Plugin decomposition breaks tool registration | Keep existing `plugin.ts` as fallback; extract incrementally (tool registry first, then startup, then hooks); verify each extraction with `npm test` | Any test failure after extraction |
| Sync I/O conversion breaks CLI cold-start | Add integration test for `bootstrap-init` CLI path before conversion; verify `npx hivemind init` works in temp directory after conversion | CLI command returns non-zero exit |
| Typed error hierarchy breaks error message parsing | Preserve exact error message strings; only change the Error subclass; add test that verifies message content is unchanged | Any error message string differs |
| CQRS fix breaks workflow persistence | Add test that verifies `persistWorkflow()` still succeeds after moving from hooks to coordination | Workflow persistence test fails |
| Module splitting breaks import graph | Use TypeScript `--noEmit` after each split; verify no circular dependencies introduced | typecheck fails or circular dependency detected |
| Scope creep during restructuring | Each phase has explicit entry/exit gates; no phase may absorb findings from another phase without explicit user authorization | Phase scope exceeds documented actions |

---

## Scope Boundaries

### IN Scope (Phases 19.1-19.7)

- Dead code deletion (remaining items not covered by Phase 19)
- Plugin decomposition (tool registry, startup, hook composition)
- Sync I/O → async conversion (runtime paths only)
- Typed error hierarchy (5 classes, ~100 sites)
- CQRS boundary enforcement (tool-after-workflow, assertHookWriteBoundary)
- shared/ leaf constraint fix (session-api.ts → routing/)
- Module size fixes (event-capture.ts, session-tracker/index.ts)
- PendingDispatchRegistry simplification
- Test gap closure (routing, config, session-view)
- Dual delegation store drift detection (additive, not consolidating)
- Manager.ts v1 annotation (not removal)
- Formal deferrals (journal/, sidecar/)
- Legacy reference inventory
- Integration verification + manifest sync

### OUT Scope (Deferred to Post-Restructuring)

- Full consolidation of dual delegation stores (coordinator.ts + state-machine.ts)
- Removal of manager.ts v1 migration paths
- Wiring of journal/ subsystem into runtime
- Integration of sidecar/readonly-state.ts
- Full routing test coverage (behavioral-profile, command-engine)
- Full schema test coverage (9 untested schemas)
- Full config test coverage (workflow module)
- Feature test coverage (runtime-pressure, doc-intelligence, agent-work-contracts)
- Security redaction in session-tracker writers
- helpers.ts and types.ts splitting
- Notification-formatter/notifications-router consolidation
- coordinatorRef forward reference refactor
- Multi-project cache for config subscriber
- `mkdirSync` rollback in mixedBatchCompile
- Routing target dispatch wiring
- Registry validation into intake-gate hook

---

## Go/No-Go Assessment

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **Phase 19 COMPLETE** | GO | Plans 01-04 executed, gatekeeping passed, dist rebuilt |
| **Phase 20 COMPLETE** | GO | 11 deps removed, yaml consolidated, 6 minors bumped, react moved to optional |
| **Test baseline stable** | GO | 2,382 tests passing (Phase 20 baseline) |
| **Typecheck clean** | GO | `npm run typecheck` passes |
| **No active runtime blockers** | GO | CP-DT-01 is separate workstream; restructuring does not depend on it |
| **Research artifacts complete** | GO | 4 research reports + full restructuring map + advisor decisions available |
| **User authorization** | PENDING | Requires explicit user approval of this phase sequence before execution |
| **Scope containment** | GO | 7 phases, all CRITICAL + HIGH findings covered, OUT scope explicitly bounded |

**Overall verdict:** GO (pending user authorization). The restructuring sequence is technically sound, risk-managed, and aligned with HIVEMIND-PHILOSOPHY pillars. Each phase has explicit entry/exit gates, and the OUT scope is large enough to prevent creep while the IN scope is comprehensive enough to address all active risks.

---

## Updated ROADMAP Mapping

After insertion, the phase sequence becomes:

| Phase | Title | Status | Depends On |
|-------|-------|--------|------------|
| 19.1 | Dead Code Final Sweep + Dist Rebuild | PENDING | Phase 19 |
| 19.2 | Plugin Decomposition | PENDING | 19.1 |
| 19.3 | Sync I/O Async Conversion | PENDING | 19.2 |
| 19.4 | Typed Error Hierarchy | PENDING | 19.3 |
| 19.5 | CQRS Enforcement + shared/ Leaf Fix | PENDING | 19.4 |
| 19.6 | Module Size Fixes + Test Gaps | PENDING | 19.5 |
| 19.7 | Formal Deferrals + Legacy Inventory + Integration | PENDING | 19.6 |
| 20 (was 21) | Session-Tracker Module Split | PENDING | 19.7 |
| 21 (was 22) | Legacy Cleanup + Tool Relocation + Test Gaps | PENDING | 20 |
| 22 (was 23) | Post-Restructuring Integration Verification | PENDING | 21 |
| 23 (was 24) | Fix sync-oss.yml workflow | DEFERRED | 22 |
| 24 (was 25) | Package .opencode/ primitives | DEFERRED | 23 |

---

*End of phase insertion decisions — generated 2026-05-21 by gsd-advisor-researcher*
