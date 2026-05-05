# ROADMAP: Harness Ecosystem Recovery

**Workstream:** harness-ecosystem-recovery
**Created:** 2026-05-05
**Status:** Active

## Overview

Multi-phase ecosystem recovery workstream that began with a read-only audit (HER-0) producing a unified ecosystem map, then proceeds through documentation recovery (HER-1), dead code cleanup (HER-2), context management (HER-3), SDK integration depth (HER-4), and agent rationalization (HER-5). The workstream addresses the gap between the healthy runtime core and its significantly stale documentation/configuration layer.

## Milestone: HER — Ecosystem Recovery

### Phase HER-0: Ecosystem Re-map & Reality Audit ✅

**Goal:** Produce a unified, evidence-tagged ecosystem map that reconciles UAT findings, governance docs, module ownership, SDK integration, and legacy patterns across all 4 development paths × 2 lineages (hm/hf).

**Status:** COMPLETE (2026-05-05)

**Requirements:** [HER-0-A, HER-0-B, HER-0-C, HER-0-D, HER-0-E, HER-0-F, HER-0-G] — ALL COVERED

**Plans:** 6 plans — ALL COMPLETE

Plans:
- [x] HER-0-01-PLAN.md — Pre-audit setup: ROADMAP creation, foundational doc validation, output directory scaffolding
- [x] HER-0-02-PLAN.md — Lane A (UAT Reclassification) + Lane B (Governance Audit): 22 UAT findings reclassified, governance drift report (4 DRIFT / 3 CONFIRMED)
- [x] HER-0-03-PLAN.md — Lane E (Legacy Pattern Validation): 84 legacy concepts validated against codebase
- [x] HER-0-04-PLAN.md — Lane C (Module Ownership Matrix): 116 modules mapped to lifecycle responsibilities
- [x] HER-0-05-PLAN.md — Lane D (OpenCode Runtime Verify): 34 SDK API surfaces verified (32 VERIFIED, 2 stubs, 0 DRIFT)
- [x] HER-0-06-PLAN.md — Reconciliation + Ecosystem Map: 5 conflicts resolved, unified map produced, quality gate passed

**Key Artifacts:**
- Ecosystem Map (SOT): `phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md`
- Phase Summary: `phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md`
- Reconciliation Matrix: `phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-reconciliation-matrix-2026-05-05.md`

---

### Phase HER-1: Documentation & Configuration Recovery ✅

**Goal:** Bring all documentation and agent configuration into alignment with runtime reality. Zero code changes. Unblock L1 delegation and fix validate-restart errors.

**Status:** COMPLETE (2026-05-05)

**Depends on:** HER-0 (COMPLETE)

**Requirements:** [HER-1-A, HER-1-B, HER-1-C, HER-1-D, HER-1-E, HER-1-F, HER-1-G, HER-1-H] — ALL COVERED

**Plans:** 8 plans in 4 waves — ALL COMPLETE

Wave 1 — Surgical Edits:
- [x] Plan 1.1 — L1 Coordinator delegate-task permission (already present, verified)
- [x] Plan 1.2 — AGENTS.md count correction (97→89 agents, 51→58 skills)
- [x] Plan 1.3 — ARCHITECTURE.md count correction (9→16 tools, 57→89 agents, 50→58 skills, 20→18 commands)
- [x] Plan 1.4 — notification-handler status (DEPRECATED → ACTIVE, Re-activated Phase 16.2)

Wave 2 — Batch Command Repair:
- [x] Plan 2.1 — 14 broken command agent references fixed (researcher→hm-l2-researcher, hivefiver-orchestrator→hf-l0-orchestrator, conductor→hm-l2-conductor, hf-prompter→hf-l2-prompter)
- [x] Plan 2.2 — Skill frontmatter verified (already valid)

Wave 3 — New File Creation:
- [x] Plan 3.1 — CHANGELOG.md created (Keep a Changelog format)
- [x] Plan 3.2 — .hivemind/ READMEs created (journal/README.md, lineage/README.md)

Wave 4 — Verification:
- [x] Plan 4.1 — Exit gate: 0 broken command refs, all counts verified, all files exist

**Key Artifacts:**
- Context: `phases/HER-1-doc-config-recovery/HER-1-CONTEXT.md`
- Plan: `phases/HER-1-doc-config-recovery/HER-1-PLAN.md`

---

### Phase HER-2: Dead Code Cleanup

**Goal:** Remove or wire orphan modules. Reduce dead code ratio from 13.7% to <5% of src/lib/.

**Status:** 🔄 Plan 01 Complete

**Depends on:** HER-1 ✅ (COMPLETE)

**Requirements:** [HER-2-A, HER-2-B]

**Plans:** 1 plan complete

Plans:
- [x] HER-2-01-PLAN.md — Remove Dead Code: 4 module groups removed (~1,511 LOC source, ~955 LOC tests). All verification passes.

---

### Phase HER-3: Context & Compaction

**Goal:** Implement context budget management using wired prompt-packet/ + re-implemented Cognitive Packer and Injection Orchestrator.

**Status:** Blocked

**Depends on:** HER-2 (prompt-packet/ wiring)

**Requirements:** TBD

---

### Phase HER-4: SDK Integration Depth

**Goal:** Expand SDK integration: handle unhandled event types, implement hook write-safety, test L2→L3 delegation depth.

**Status:** Ready

**Depends on:** HER-1 ✅ (COMPLETE)

**Requirements:** TBD

---

### Phase HER-5: Agent Rationalization

**Goal:** Reduce agent overlap (<50% keyword overlap across all pairs), specialize ambiguous agents.

**Status:** Ready

**Depends on:** HER-1 ✅ (COMPLETE)

**Requirements:** TBD

## Requirements

| ID | Description | Phase | Status |
|----|-------------|-------|--------|
| HER-0-A | All UAT findings reclassified by 4 paths × 2 lineages with evidence tags | HER-0 | ✅ Covered |
| HER-0-B | Governance drift report with per-claim verification against source files | HER-0 | ✅ Covered |
| HER-0-C | Module ownership matrix covering all src/lib/ modules with lifecycle responsibilities | HER-0 | ✅ Covered |
| HER-0-D | OpenCode SDK integration claims verified with Context7/URL citations | HER-0 | ✅ Covered |
| HER-0-E | Legacy concept catalog patterns validated against current codebase | HER-0 | ✅ Covered |
| HER-0-F | Unified ecosystem map reconciling all 5 lane outputs with conflict resolution | HER-0 | ✅ Covered |
| HER-0-G | Zero conflicting classifications across audit lanes | HER-0 | ✅ Covered |
| HER-1-A | `hm-l1-coordinator.md` grants `delegate-task` tool permission | HER-1 | ✅ Covered (already present) |
| HER-1-B | AGENTS.md counts match reality: 89 agents, 58 skills, sync date updated | HER-1 | ✅ Covered |
| HER-1-C | ARCHITECTURE.md counts match reality: 16 tools, 89 agents, 58 skills, 18 commands | HER-1 | ✅ Covered |
| HER-1-D | src/lib/AGENTS.md: notification-handler status updated to "Re-activated Phase 16.2" | HER-1 | ✅ Covered |
| HER-1-E | All 14 broken commands updated to reference actual agent names | HER-1 | ✅ Covered |
| HER-1-F | hm-l2-planning-persistence SKILL.md frontmatter fixed | HER-1 | ✅ Covered (already valid) |
| HER-1-G | CHANGELOG.md + .hivemind/ READMEs created | HER-1 | ✅ Covered |
| HER-1-H | validate-restart returns 0 errors (exit gate) | HER-1 | ✅ Covered |
| HER-2-A | Remove confirmed dead code modules with zero runtime consumers | HER-2 | ✅ Covered (Plan 01) |
| HER-2-B | Reduce dead code ratio from 13.7% toward <5% | HER-2 | 🔄 In Progress (Plan 01: 13.7% → ~6.8%) |
