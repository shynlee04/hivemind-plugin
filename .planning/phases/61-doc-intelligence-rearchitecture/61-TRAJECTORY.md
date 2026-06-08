# Phase 61 — Doc-Intelligence Rearchitecture — Trajectory

**Phase:** 61-doc-intelligence-rearchitecture
**Inserted after:** Phase 60 (C2 Residuals)
**Status:** 🟢 PATTERNS_COMPLETE
**Last checkpoint:** CP-07 — Patterns (21-module map, 3 core design patterns, CQRS table, safety chain, anti-pattern catalog)

## Phase Objective

Transform the current read-only Markdown skim+search router into a full-spectrum document intelligence layer covering multi-format CRUD, metadata manipulation, hierarchy-aware operations, batch operations, code inspection, cross-reference analysis, governance integration, and LSP/type-aware document operations — integrated with both Hivemind's runtime and OpenCode's native platform capabilities.

## Trajectory Lifecycle States

| State | Status | Description |
|-------|--------|-------------|
| 🟢 planning | ✅ CURRENT | Spec, Context (CP-05 done), Research (CP-06 done), Patterns (CP-07 done), Plan |
| 🔄 executing | ⬜ NEXT | Implementation via specialist waves |
| 🔄 verifying | ⬜ AFTER | Verification gates |
| ✅ completed | ⬜ FINAL | Phase complete |
| 🔒 closed | ⬜ ARCHIVE | Archived for reference |

## Key Reference Documents

- Archive design: `.worktrees/product-detox/docs/planning-draft/modernize-doc-intelligence-layer.md` (593 LOC)
- Archive handoff: `.worktrees/product-detox/docs/handoffs/2026-03-13/doc-intel-modernization-handoff.md`
- Legacy source: `.worktrees/product-detox/.archive/legacy-src-20260314-140720/lib/doc-intel.ts` (~1600 LOC)
- Current impl: `src/features/doc-intelligence/` (5 files, ~400 LOC, read-only)
- Current tool: `src/tools/hivemind/hivemind-doc.ts`
- Architecture: `.planning/codebase/ARCHITECTURE.md`
- Omo reference: `.opencode/skills/hm-l3-omo-reference/SKILL.md`
- OpenCode platform: `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md`

## Trajectory Checkpoints

- [x] CP-01: Codebase Scouting (archive docs + current code read)
- [x] CP-02: Phase CRUD (Phase 61 created)
- [x] CP-03: Trajectory + Contract Init (this document)
- [x] CP-04: SPECIFICATION — lock falsifiable requirements (48 req, avg ambiguity 0.06)
- [x] CP-05: CONTEXT & ASSUMPTIONS — resolve gray areas (14/14, see 61-CONTEXT.md)
- [x] CP-06: RESEARCH — validate tech stack, STRIDE model, OMO/ecosystem synthesis (see 61-RESEARCH.md)
- [x] CP-07: PATTERNS — architecture patterns document (see 61-PATTERNS.md)
- [x] CP-08: PLANNING — execution PLAN.md (see 61-PLAN.md — 8 waves, 42 tasks)
- [x] CP-09: EXECUTION — implement via specialist waves (8 waves, 42 tasks, 73 tests)
- [x] CP-10: VERIFICATION — typecheck clean, 73/73 doc-intel tests pass, 18 source files
- [x] CP-11: SHIP — SUMMARY.md written, 8 atomic commits, state updated
