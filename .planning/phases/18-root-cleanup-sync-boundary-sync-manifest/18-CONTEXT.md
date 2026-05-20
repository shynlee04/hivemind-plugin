# Phase 18: Root Cleanup, Sync Boundary, Sync Manifest — Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute on Phase 17's structured findings: delete dead code, fix context rot, clean barrel noise, update boundary manifests. Pure cleanup phase — no new features, no behavior changes.

- **Dead code removal:** Delete confirmed dead files (~1,558 LOC) from `src/hooks/transforms/` (toggle-gates), `src/features/steering-engine/` (3 files), `src/features/runtime-detection/`, and `src/task-management/recovery/` (5 files, 763 LOC).
- **Context rot fix:** Extract `storeCache` singleton from `src/task-management/continuity/index.ts` into dedicated `store-cache.ts` module with explicit `resetCache()` API. Defer session-tracker index.ts split (561 LOC is well-factored, 12% over cap is acceptable exception).
- **Noise/stub cleanup:** Narrow `export *` in `src/index.ts` to explicit named exports for command-engine barrel. Keep `src/harness/` and `src/kernel/` stub dirs as reserved architecture slots.
- **Boundary sync:** Boundary audit first (detect CQRS drifts against `last_mapped_commit`), then cleanup, then update manifests (STRUCTURE.md, ARCHITECTURE.md, codebase maps, AGENTS.md).

</domain>

<decisions>
## Implementation Decisions

### D-01: Dead Code Deletion Order
Module-batched (2 commits):
1. `toggle-gates.ts` + `tests/hooks/toggle-gates.test.ts`
2. `src/features/steering-engine/` (3 files: types.ts, steering-state.ts, steering-policy.schema.ts) + `src/features/runtime-detection/`

NOT all-in-one (poor bisect granularity), NOT per-file atomic (steering-engine internal imports defeat it).

### D-01.1: Supplementary — recovery/ Submodule Deletion
Research confirmed `src/task-management/recovery/` (5 files, 763 LOC) is fully dead — zero external importers. Add as 3rd commit batch:
- 3. `src/task-management/recovery/` (assess-state.ts, recovery-engine.ts, recovery-orchestrator.ts, state-verifier.ts, index.ts)

NOT merged into D-01 batches (separate module boundary, distinct rollback context).

### D-02: Context Rot — storeCache Extraction
Extract `storeCache` singleton from `continuity/index.ts` into new `continuity/store-cache.ts` with exported `resetCache()` API. Fixes test isolation fragility (currently masked by `vi.resetModules()` boilerplate). Session-tracker split DEFERRED — 561 LOC (12% over 500 cap) is well-factored into submodules; re-evaluate when class body exceeds ~650 LOC.

### D-03: Noise/Stub Cleanup — Narrow Barrel
Fix `export *` in `src/index.ts` for `command-engine` → explicit named exports only. Keep `src/harness/` and `src/kernel/` `.gitkeep` dirs as reserved architecture slots per STRUCTURE.md.

### D-04: Boundary Sync — Verify Then Cleanup
1. Boundary audit against `last_mapped_commit` (906b21a0) — detect CQRS drifts
2. Execute cleanup (D-01 through D-03)
3. Update `.planning/codebase/` maps (STRUCTURE.md, ARCHITECTURE.md, CONCERNS.md, AGENTS.md)

### the agent's Discretion
- Context rot: agent chose `extract storeCache, defer split` over `resetStoreCache API only` — recommended by research due to genuine test isolation gap.
- Boundary sync: agent chose `verify-then-cleanup` — project has known CQRS violations in CONCERNS.md; verifying first prevents regressions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 17 Findings (Input to Phase 18)
- `.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md` — 60 findings covering dead code, context rot, noise across all 15 src/ modules
- `.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-04-PLAN.md` — Plan 04 task definitions, readiness for Phase 18 section

### Architecture & Conventions
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, dependency rules (last_mapped_commit: 906b21a0)
- `.planning/codebase/STRUCTURE.md` — File tree, placement conventions, folder registration
- `.planning/codebase/CONVENTIONS.md` — Code style, naming, import organization, 500 LOC cap
- `.planning/codebase/CONCERNS.md` — Known CQRS violations for boundary audit
- `.planning/codebase/TESTING.md` — Test conventions, `vi.resetModules()` pattern for singleton testing

### State Root & State Ownership
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Q6 state root, naming contract
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership model, Phase 0 mutation gates

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/helpers.ts` — `isObject()`, `unwrapData()` patterns usable in new store-cache.ts
- `src/task-management/continuity/index.ts` — existing `deepCloneStore()` pattern for clone-on-read (reusable in extract)

### Established Patterns
- **Module extraction pattern:** New modules go in same directory as consumer, named `{concern}.ts` (e.g., `store-cache.ts` in `continuity/`)
- **Singleton test pattern:** `vi.resetModules()` + dynamic import in `beforeEach` — storeCache fix should eliminate need for this boilerplate
- **Barrel narrowing pattern:** `src/index.ts` already uses selective re-exports for most modules; command-engine barrel is the remaining `export *` outlier

### Integration Points
- `src/index.ts` line 24 — target for barrel narrowing
- `src/task-management/continuity/` — target for store-cache.ts addition
- `.planning/codebase/` — target for manifest updates after cleanup

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches per decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-root-cleanup-sync-boundary-sync-manifest*
*Context gathered: 2026-05-20*
