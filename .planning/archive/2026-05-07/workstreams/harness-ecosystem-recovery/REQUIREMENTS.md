# Requirements: Harness Ecosystem Recovery

**Workstream:** harness-ecosystem-recovery
**Derived from:** HER ROADMAP.md
**Last Updated:** 2026-05-06

## Phase HER-0 — Ecosystem Re-map & Reality Audit

| ID | Description | Status |
|----|-------------|--------|
| HER-0-A | All UAT findings reclassified by 4 paths × 2 lineages with evidence tags | ✅ Covered |
| HER-0-B | Governance drift report with per-claim verification against source files (4 DRIFT / 3 CONFIRMED) | ✅ Covered |
| HER-0-C | Module ownership matrix covering all src/lib/ modules with lifecycle responsibilities (116 modules) | ✅ Covered |
| HER-0-D | OpenCode SDK integration claims verified with Context7/URL citations (34 surfaces: 32 VERIFIED, 2 stubs, 0 DRIFT) | ✅ Covered |
| HER-0-E | Legacy concept catalog patterns validated against current codebase (84 concepts) | ✅ Covered |
| HER-0-F | Unified ecosystem map reconciling all 5 lane outputs with conflict resolution (5 conflicts resolved) | ✅ Covered |
| HER-0-G | Zero conflicting classifications across audit lanes | ✅ Covered |

## Phase HER-1 — Documentation & Configuration Recovery

| ID | Description | Status |
|----|-------------|--------|
| HER-1-A | `hm-l1-coordinator.md` grants `delegate-task` tool permission | ✅ Covered (already present) |
| HER-1-B | AGENTS.md counts match reality: 89 agents, 58 skills, sync date updated | ✅ Covered |
| HER-1-C | ARCHITECTURE.md counts match reality: 16 tools, 89 agents, 58 skills, 18 commands | ✅ Covered |
| HER-1-D | src/lib/AGENTS.md: notification-handler status updated to "Re-activated Phase 16.2" | ✅ Covered |
| HER-1-E | All 14 broken commands updated to reference actual agent names | ✅ Covered |
| HER-1-F | hm-l2-planning-persistence SKILL.md frontmatter fixed | ✅ Covered (already valid) |
| HER-1-G | CHANGELOG.md + .hivemind/ READMEs created | ✅ Covered |
| HER-1-H | validate-restart returns 0 errors (exit gate) | ✅ Covered |

## Phase HER-2 — Dead Code Cleanup

| ID | Description | Status |
|----|-------------|--------|
| HER-2-A | Remove confirmed dead code modules with zero runtime consumers (4 module groups: ~1,511 LOC source, ~955 LOC tests) | ✅ Covered (Plan 01) |
| HER-2-B | Reduce dead code ratio from 13.7% toward <5% (achieved ~6.5%) | ✅ Covered (both plans) |
| HER-2-C | Fix notification-handler boundary violations (D-06 through D-09) | ✅ Covered (Plan 02) |
| HER-2-D | Wire auto-loop and ralph-loop as runtime DI primitives (D-01 through D-03) | ✅ Covered (Plan 02) |
| HER-2-E | Wire session-entry/ as event observer on session.created + system.transform hook | ✅ Covered (Plan 03) |
| HER-2-F | Wire prompt-packet/ compaction-preservation into compaction hook | ✅ Covered (Plan 03) |

## Phase HER-3 — Context & Compaction (READY)

| ID | Description | Status |
|----|-------------|--------|
| HER-3-A | Implement context budget management using wired prompt-packet/ | ⊘ TBD |
| HER-3-B | Re-implement Cognitive Packer with compaction durability | ⊘ TBD |
| HER-3-C | Re-implement Injection Orchestrator with context routing | ⊘ TBD |
| HER-3-D | Event-tracker output usable as queryable context (f-08) | ⊘ TBD |

## Phase HER-4 — SDK Integration Depth (READY)

| ID | Description | Status |
|----|-------------|--------|
| HER-4-A | Handle unhandled event types in OpenCode SDK API surface | ⊘ TBD |
| HER-4-B | Implement hook write-safety (f-10) | ⊘ TBD |
| HER-4-C | Test L2→L3 delegation depth | ⊘ TBD |

## Phase HER-5 — Agent Rationalization (READY)

| ID | Description | Status |
|----|-------------|--------|
| HER-5-A | Reduce agent overlap (<50% keyword overlap across all agent pairs) | ⊘ TBD |
| HER-5-B | Specialize ambiguous agents | ⊘ TBD |
| HER-5-C | Role-specific tool access with E2E path validation (f-11) | ⊘ TBD |

## Requirement Metrics

| Metric | Value |
|--------|-------|
| Total requirements | 28 defined (22 covered + 6 TBD) |
| HER-0 requirements | 7/7 covered |
| HER-1 requirements | 8/8 covered |
| HER-2 requirements | 6/6 covered |
| HER-3 requirements | TBD (3 pending scope definition) |
| HER-4 requirements | TBD (3 pending scope definition) |
| HER-5 requirements | TBD (3 pending scope definition) |
