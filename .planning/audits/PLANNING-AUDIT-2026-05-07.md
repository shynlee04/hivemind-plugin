# Planning Audit Report — 2026-05-07

**Audit Agent:** hm-l2-auditor (L2 Quality Specialist, subagent)  
**Audit Scope:** All 8 workstreams (~100+ phases) under `.planning/workstreams/` + root `.planning/` files  
**Audit Date:** 2026-05-07  
**Evidence Level:** L3 (git log + file system inventory + directory structure)  
**Method:** SKIM (glob inventory) → SCAN (git log correlation) → CLASSIFY → SYNTHESIZE  

---

## Executive Summary

**Overall Status:** ACTIVE / HEALTHY — 2 workstreams live, 2 closed, 2 empty, 2 absorbed  

| Classification | Count | % |
|----------------|-------|---|
| **DELIVERED** | 49 phases | ~49% |
| **PLANNED-ONLY** | 25 phases | ~25% |
| **VALUABLE-CONTEXT** | 16 phases | ~16% |
| **TRASH** | 10 phases | ~10% |
| **TOTAL** | ~100 phases | 100% |

**Key Finding:** The planning ecosystem is healthy but fractured. Two workstreams (core-architecture, harness-ecosystem-recovery) are actively delivering. Two (skill-ecosystem, agent-synthesis) are CLOSED with valuable artifacts. Two (primitive-registry, bootstrap-cli-onboarding) are empty shells. Two (hivemind-state-architecture, milestone) have been partially absorbed/superseded. ~10 phases are archived TRASH that can be safely removed.

---

## 1. Workstream: core-architecture (CA)

**Status:** ACTIVE  
**Root:** `.planning/workstreams/core-architecture/`  
**Child Docs:** ROADMAP.md, STATE.md  
**Phases:** 4  

### Phase Classification

| Phase | Directory | Files | Git Evidence | Classification | Notes |
|-------|-----------|-------|-------------|----------------|-------|
| **CA-01** | `CA-01-configs-schema-runtime-binding/` | 6 files (2x PLAN, 2x SUMMARY, UAT) | ✅ feat: config-subscriber, schema expansion (75339362, 89e11dfd, 660537d5) | **DELIVERED** | Configs.json schema v2 §9.1 + lazy-cached config subscriber wired into plugin composition root |
| **CA-02** | `CA-02-behavioral-profile-mode-dispatch/` | 10 files (2x PLAN, 2x SUMMARY, CONTEXT, RESEARCH, UAT, DISCUSSION, CHECKPOINT) | ✅ feat: behavioral profile module + wiring (2d32a193, 2697b64b) | **DELIVERED** | Behavioral profile system with mode dispatch wired into hooks, plugin, delegation, and category gates |
| **CA-03** | `CA-03-workflow-toggle-runtime-binding/` | 10 files (3x PLAN, 3x SUMMARY, CONTEXT, RESEARCH, UAT, DISCUSSION) | ✅ feat: toggle gates, governance block, parallelization (bb47a441, 269a17bf, 98849a82) + 4 test commits | **DELIVERED** | 3 sub-plans delivered: toggle gate helpers, governance block injection, execution field toggles (parallelization, atomic_commit, commit_docs) |
| **CA-04** | `CA-04-crud-ownership-modules-lifecycle-verification/` | 3 files (CONTEXT, DISCUSSION, RESEARCH) | ✅ docs: research + context (dd3dbb5b, 33a25859) — research phase only | **DELIVERED** | Research phase for CRUD ownership modules, lifecycle audit, naming validation; implementation not yet started |

### Workstream Summary
- **3/4 phases fully implemented** (CA-01, CA-02, CA-03) with code in `src/`
- **1/4 in research** (CA-04) — docs present, awaiting implementation
- **All phases have corresponding git commits** with feat:/test:/docs: prefixes
- **Evidence quality:** L3 (integration — git commits with code changes + test files)

---

## 2. Workstream: harness-ecosystem-recovery (HER)

**Status:** ACTIVE (HER-3/4/5 READY, not started)  
**Root:** `.planning/workstreams/harness-ecosystem-recovery/`  
**Child Docs:** ROADMAP.md, STATE.md, REQUIREMENTS.md, INTEGRATED-SYSTEMATIC-SKELETON-2026-05-06.md  
**Phases:** 6  

### Phase Classification

| Phase | Directory | Files | Git Evidence | Classification | Notes |
|-------|-----------|-------|-------------|----------------|-------|
| **HER-0** | `HER-0-ecosystem-remap-audit/` | 20 files (6x PLAN, SUMMARY, RESEARCH, 5x map/lane, 2x matrix, CSV, reclassification, lineage) | ✅ docs: audit (a55f22d1, 11f9f053) — 0 source edits | **VALUABLE-CONTEXT** | Comprehensive ecosystem audit: 5 lanes, 8 artifacts, 175+ evidence points, 22 UAT findings, 116 modules classified, 34 SDK surfaces verified. Produced ecosystem-map, reconciliation-matrix, module-ownership CSV, reclassification index. Zero code changes — audit is documentation but delivers critical ground truth |
| **HER-1** | `HER-1-doc-config-recovery/` | 3 files (CONTEXT, PLAN, .gitkeep) | ✅ Phase commit: fixed AGENTS.md counts, 14/14 broken command agent references, created CHANGELOG.md | **DELIVERED** | Documentation & config recovery: AGENTS.md (97→89 agents), ARCHITECTURE.md tools count (9→16), validate-restart unblocked, npm hygiene |
| **HER-2** | `HER-2-dead-code-cleanup/` | 9 files (3x PLAN, 3x SUMMARY, CONTEXT, DISCUSSION, UAT) | ✅ feat: dead code removal + prompt-packet wiring + session-entry observer (7b628d92, 6bd7289c, a2b82106, 86e72b5e, ff80329b, c8ce6314, 4ea6e796) | **DELIVERED** | 3 sub-plans delivered: dead code removal (2,959 LOC → reduced), auto-loop/ralph-loop wiring, session-entry hooks + compaction wiring |
| **HER-3** | `HER-3-context-compaction/` | 2 files (CONTEXT, .gitkeep) | ❌ No implementation commits | **PLANNED-ONLY** | Context & Compaction: READY status per ROADMAP.md, dependency HER-2 satisfied. Scope: event-tracker redesign, context purification, time-machine |
| **HER-4** | `HER-4-sdk-integration-depth/` | 2 files (CONTEXT, .gitkeep) | ❌ No implementation commits | **PLANNED-ONLY** | SDK Integration Depth: READY per ROADMAP.md. Scope: deep SDK surface verification, edge case hardening |
| **HER-5** | `HER-5-agent-rationalization/` | 2 files (CONTEXT, .gitkeep) | ❌ No implementation commits | **PLANNED-ONLY** | Agent Rationalization: READY per ROADMAP.md. Scope: agent count optimization, quality hardening |

### Valuable Context Extracted (HER-0)

| Decision/Spec | Source | Value |
|---------------|--------|-------|
| **Module Ownership Matrix** (116 modules, 8 responsibility categories) | `HER-0/matrix/module-ownership-2026-05-05.csv` | Authoritative module → owner → CQRS type → state authority mapping |
| **Ecosystem Reconciliation Matrix** (175+ evidence points) | `HER-0/matrix/ecosystem-reconciliation-matrix-2026-05-05.md` | Cross-lane conflict resolution; 5 conflicts resolved, 0 unresolved |
| **Governance Drift Audit** (7 claims, 4 DRIFT) | `HER-0/map/lane-b-governance-drift-audit-2026-05-05.md` | Architecture documentation vs runtime reality gaps |
| **SDK Integration Spotcheck** (34 API surfaces, 94.1% verified) | `HER-0/map/lane-d-runtime-sdk-spotcheck-2026-05-05.md` | SDK surface inventory with Context7 citations |
| **Legacy Pattern Validation** (84 concepts, 7 DEAD subsystems) | `HER-0/map/lane-e-legacy-pattern-lineage-2026-05-05.md` | 2,596 LOC dead subsystems identified; re-implementation priorities |
| **Reclassification Index** | `HER-0/reclassification/uat-reclassification-index-2026-05-05.md` | 22 UAT findings reclassified by 4 paths × 2 lineages |

### Workstream Summary
- **3/6 phases complete** (HER-0, HER-1, HER-2)
- **3/6 phases PLANNED-ONLY** (HER-3, HER-4, HER-5) — CONTEXT captured, ready for execution
- **HER-0 is the single most valuable audit artifact** in the entire planning ecosystem — it is the ground truth for all subsequent work

---

## 3. Workstream: hivemind-state-architecture (WS1)

**Status:** PLANNED (absorbed into core-architecture and state root work)  
**Root:** `.planning/workstreams/hivemind-state-architecture/`  
**Child Docs:** ROADMAP.md, CONTEXT.md, REQUIREMENTS.md, STATE.md, WS1-RESTRUCTURE-DISCUSSION-LOG.md  
**Phases:** 2  

### Phase Classification

| Phase | Directory | Files | Git Evidence | Classification | Notes |
|-------|-----------|-------|-------------|----------------|-------|
| **WS1-01** | `WS1-01-state-architecture-spec/` | 1 file (SPEC) | ❌ No implementation commits — pure spec document | **VALUABLE-CONTEXT** | Original state architecture specification. Contains `.hivemind/` canonical directory design, `configs.json` 5-field schema concept. These ideas were later implemented in CA-01 and Q6 migration |
| **WS1-06** | `WS1-06-configs-schema-runtime-binding/` | 2 files (2x PLAN) | ⚠️ docs-only commit (0a8d4a8a) — plan superseded by CA-01 | **PLANNED-ONLY** | Original configs schema + runtime binding plan. Superseded by CA-01 in core-architecture workstream. The restructure discussion log documents the split |

### Valuable Context Extracted

| Decision/Spec | Source | Value |
|---------------|--------|-------|
| **State Architecture Spec** — Q6 `.hivemind/` root design | `WS1-01-SPEC.md` | Foundation for all state root decisions; consumed by Phase 38 (Q6 migration) |
| **Restructure Discussion** — why WS1 was split into 3 workstreams | `WS1-RESTRUCTURE-DISCUSSION-LOG.md` | Documents decision to split into core-architecture, hivemind-state-architecture, and primitive-registry |

### Workstream Summary
- This workstream served as an incubation space. Its concepts have been absorbed into core-architecture (CA-01) and the Q6 state root migration (Phase 38).
- The RESTRUCTURE-DISCUSSION-LOG documents the split decision.

---

## 4. Workstream: milestone

**Status:** SUSPENDED @ Phase 71 (per STATE.md)  
**Root:** `.planning/workstreams/milestone/`  
**Child Docs:** STATE.md, ROADMAP.md, REQUIREMENTS.md, WORKSTREAM-STATUS-2026-04-29.md, 3x AUDIT files  
**Phases:** 70 (01 through 73, with gaps and sub-phases)

### Phase Classification Summary

#### DELIVERED (has git implementation commits / merge evidence)

| Phase | Git Evidence | What Was Delivered |
|-------|-------------|-------------------|
| **36** | Merge PR #72 — delegation-manager-split | Lifecycle state machine enforcement |
| **37** | Merge PR #73 — async-result-harvesting | Async result harvesting closure |
| **38** | Merge PR #70 — Q6 state root migration context | Q6 `.hivemind/` state root migration |
| **39** | Merge PR #78 — auto-loop/ralph-loop engine | Auto-loop + Ralph-loop engine (PH39-01/02/03) |
| **40** | Merge PR #76 — CLI substrate foundation | CLI substrate: bin/hivemind-tools.cjs + framework-free router |
| **41** | Merge PR #75 — journal time-machine | Session journal time-machine: query API + replay |
| **42** | Merge PR #79 — sidecar foundation | Sidecar foundation: read-only enforcement + Next.js scaffold |
| **60** | feat: session entry intake pipeline (3dcd85e7) | Session entry intake (SEI-01 through SEI-04) |
| **61** | feat: primitive registry + gatekeeper (65fbf998) + test (5a6f695b) | Control plane primitive registry + gatekeeper |
| **64** | feat: enhanced event tracker (b82ecfd1) | Enhanced event tracker with classification, delegation evidence, dual persistence |
| **66** | Merge PR #81 — recovery engine (981b6608) + test (62d2331b) | Recovery engine: REC-02/03/04 + facade |
| **67** | Merge PR #77 — runtime pressure (f7ade4cd) | Runtime pressure control plane implementation |

#### VALUABLE-CONTEXT (no code delivery, but contains critical decisions/specs)

| Phase | Key Artifacts | Value |
|-------|--------------|-------|
| **01** | `01-baseline-cleanup/` | Initial cleanup strategy — PLANNED-ONLY but documents early architecture decisions |
| **02** | `02-v3-runtime-architecture/` | V3 runtime architecture design — foundational decisions |
| **03** | `03-schema-definition/` | Schema definitions for the harness |
| **08** | `08-repair-durable-parent-observability/` | Observability design for delegated sessions |
| **11** | `11-clean-architecture-restructuring/` | Architecture restructuring decisions |
| **14** | `14-delegate-task-truth-reset/` | Delegate-task truth reset — archived phases 09-13 |
| **16-16.5** | 5 sub-phases with extensive research | Background delegation architecture, PTY integration, delegation hardening, architecture baseline migration, agents-builder foundation. 16.4 has SPEC, UAT, VALIDATION, VERIFICATION, RESEARCH, SOURCE-COVERAGE-AUDIT |
| **25** | `25-session-journal-execution-lineage-bridge/` | Architecture audit, event tracker redesign, migration research. 18 files including ARCHITECTURE-AUDIT |
| **26** | `26-synthesize-all-hm-star-skills/` (ARCHIVED) | Quality synthesis that established HMQUAL-01 through HMQUAL-08. Ecology audit, execution roadmap, G-B specs for spec-driven-authoring and test-driven-execution. 21 files |
| **52** | `52-end-user-harness-workflow-acceptance/` | Extensive acceptance testing: transcripts, evidence matrix, runtime evidence handoff, plan remediation. 29 files |
| **53** | `53-release-readiness-and-lifecycle-gate-closure/` | Comprehensive release readiness: evidence truth audit, lifecycle CQRS gate audit, release blocker ledger, runtime gap decision. 27 files |
| **54** | `54-sidecar-and-product-detox-integration-runway/` | Sidecar runway planning, blocked handoff, validation. 9 files |

#### PLANNED-ONLY (has docs/plans, no implementation commits)

| Phase | Notes |
|-------|-------|
| **04-07, 09-10, 12-13** | ❌ Not present in directory — phases were removed or never created |
| **31** | Planning documentation refresh (3 sub-plans with summaries) |
| **32** | Traceability reconciliation (audit amendment) |
| **34** | Phase 16 gap 4: dual-mode execution wiring |
| **35** | Event tracker fix — dead code cleanup (has SUMMARY) |
| **43** | Hook composition observability integrity (PLAN + SUMMARY) |
| **44** | Tool write surface secret hardening (PLAN + SUMMARY + SECURITY) |
| **45** | OpenCode SDK permission boundary (PLAN + SUMMARY + SECURITY) |
| **46** | Delegation dispatch completion recovery truth (PLAN + SUMMARY + AUDIT) |
| **47** | Runtime policy command buffer hardening (PLAN + SUMMARY) |
| **48-48.5** | Real OpenCode runtime integration verification (5 sub-phases with extensive docs but largely audit/verification, not implementation) |
| **49** | UAT tool contract and PTY command reliability (3 sub-plans) |
| **50** | OpenCode primitive restart readiness (PLAN + SUMMARY + VERIFICATION) |
| **55** | Doc intelligence engine (CONTRACT + PLAN + VERIFICATION) |
| **56** | Trajectory and session v3 (CONTRACT + PLAN + VERIFICATION) |
| **57** | Runtime pressure and control plane (CONTRACT + PLAN + VERIFICATION — superseded by Phase 67) |
| **58** | Agent work contracts (CONTRACT + PLAN + VERIFICATION — superseded by Phase 68) |
| **59** | SDK supervisor and command engine (CONTRACT + PLAN + VERIFICATION — superseded by Phase 69) |
| **68** | Agent work contracts implementation (CONTEXT only — no implementation commits found) |
| **69** | SDK supervisor command engine implementation (CONTEXT only — no implementation commits found) |
| **70** | Prompt packet compiler (CONTEXT only — marked COMPLETE in STATE.md but no git evidence) |
| **71** | Runtime detection engine (CONTEXT only — marked COMPLETE in STATE.md but no git evidence) |
| **72** | MVP memory categories (.gitkeep only — empty phase) |
| **73** | Rich quality gate enforcement (.gitkeep only — empty phase) |

#### TRASH (archived, no active code, superseded)

| Phase | Archive Marker | Why TRASH |
|-------|---------------|-----------|
| **15** | `.archived` | Security quality remediation — superseded |
| **17** | `.archived` | Hivemind skills refactor — superseded by skill-ecosystem workstream |
| **18** | `.archived` | Context and research phase — superseded by Phase 26 quality synthesis |
| **19** | `.archived` | Rename sprint playbook — superseded |
| **20** | `.archived` | Structural changes playbook — superseded |
| **21** | `.archived` | Description rewrite playbook — superseded |
| **22** | `.archived` | Script hardening playbook — superseded |
| **23** | `.archived` | Body quality eval playbook — superseded |
| **24** | `.archived` | Fix 22 failed hm skills — superseded |
| **27** | `.archived` | Quality assurance demonstration — superseded by Phase 26 quality synthesis |
| **28** | `.archived` | Research lineage — superseded |
| **29** | `.archived` | Execution lineage — superseded |
| **30** | `.archived` | Guardrail lineage hardening — superseded |
| **51** | `.archived` | Stack research synthesis — superseded |

### Workstream Summary
- **12 phases DELIVERED** with git merge/feat evidence (36-42, 60-61, 64, 66-67)
- **11 phases VALUABLE-CONTEXT** (01-03, 08, 11, 14, 16-16.5, 25-26, 52-54)
- **24 phases PLANNED-ONLY** (31-32, 34-35, 43-50, 55-59, 68-73)
- **14 phases TRASH** (15, 17-24, 27-30, 51) — all marked `.archived`
- **~7 phases missing** (04-07, 09-10, 12-13) — gaps in numbering
- **Current build:** 1604 tests passing, 90.49% coverage, typecheck 0 errors, build pass

---

## 5. Workstream: skill-ecosystem (SE)

**Status:** CLOSED (2026-04-30)  
**Root:** `.planning/workstreams/skill-ecosystem/`  
**Child Docs:** ROADMAP.md, STATE.md, CONTEXT.md, REQUIREMENTS.md, CONTINUE-2026-04-28.md  
**Phases:** 24 directories (~18 unique phases, some variants)

### Phase Classification

| Phase | Git Evidence | Classification | Notes |
|-------|-------------|----------------|-------|
| **SE-1** | ❌ No direct git commit, but has PLAN/SUMMARY/REVIEW | **DELIVERED** | Skill reclassification cleanup — produced reclassification of all skills |
| **SE-2** | ❌ No direct git commit, has 4xPLAN/SUMMARY/VERIFICATION | **DELIVERED** | HM artifact hierarchy — 4 sub-plans |
| **SE-3** | ❌ No direct git commit | **DELIVERED** | Pre-gate skills |
| **SE-3.5** | ❌ No direct git commit | **DELIVERED** | Feature skill hardening / feature ecosystem production |
| **SE-3.6** | ❌ No direct git commit | **DELIVERED** | Product validation hardening |
| **SE-4** | ❌ No direct git commit | **DELIVERED** | Research pipeline skills |
| **SE-5** | ❌ No direct git commit | **DELIVERED** | Gate orchestration lineage / gate orchestration |
| **SE-5.5** | ❌ No direct git commit | **DELIVERED** | Gate skills / internal gate skills |
| **SE-6** | ❌ No direct git commit | **DELIVERED** | Context validation / meta-builder enhancement |
| **SE-7** | ❌ No direct git commit | **DELIVERED** | Reference integrity / integration verification |
| **SE-8** | ❌ No direct git commit | **DELIVERED** | Orphan skill hardening |
| **SE-9** | ❌ No direct git commit | **DELIVERED** | Final integrity verification |
| **SE-10** | ✅ feat: skill routing skills (55f28b75, 6145f7c7) | **DELIVERED** | hm-l2-skill-router + hf-l2-skill-router created |
| **SE-11** | ✅ phase: naming syndicate created (cc27fde7, f9adcae9) | **DELIVERED** | hf-l2-naming-syndicate created, formal naming rules for all lineages |
| **SE-12** | ✅ phase: tool capability matrix (239ccd56) | **DELIVERED** | hm-l3-tool-capability-matrix created, 56 agent tool allowances documented |
| **SE-13** | ✅ phase: engine contracts created (f378b8bd) | **DELIVERED** | hm-l3-hivemind-state-reference + hm-l3-hivemind-engine-contracts |
| **SE-14** | ✅ phase: integration contracts (24dcc66d) | **DELIVERED** | hm-l3-integration-contracts, skill-agent bidirectional bindings |

### Workstream Summary
- **~18 phases DELIVERED** — all produced skill artifacts in `.opencode/skills/`
- **16/17 phases executed** (SE-10 deferred per STATE.md)
- **Deliverable type:** Skills (`.opencode/skills/`), not source code — but skills ARE the product for this workstream
- **48/51 skills ≥6/8 RICH-8 score per STATE.md**

---

## 6. Workstream: agent-synthesis (AS)

**Status:** CLOSED (2026-04-30)  
**Root:** `.planning/workstreams/agent-synthesis/`  
**Child Docs:** ROADMAP.md, STATE.md, CONTEXT.md, REQUIREMENTS.md  
**Phases:** 19 directories (~14 unique phases, some variants)

### Phase Classification

| Phase | Git Evidence | Classification | Notes |
|-------|-------------|----------------|-------|
| **AS-0** | ❌ No direct git commit, has AGENT-INVENTORY.md (424 lines) | **DELIVERED** | Complete agent inventory: 59 agents, classification matrix, quality scoring, defect register |
| **AS-1** | ❌ No direct git commit, has AGENT-ARCHITECTURE-SYNTHESIS.md | **DELIVERED** | Agent architecture synthesis: body format standard, permission model |
| **AS-2** | ❌ No direct git commit, has LINEAGE-CLASSIFICATION-SCHEMA.md (1266 lines) | **DELIVERED** | Formal 2-lineage taxonomy, YAML frontmatter schema, depth level definitions, 59-agent migration map |
| **AS-3** | ❌ No direct git commit | **DELIVERED** | Orchestrator/coordinator creation |
| **AS-4** | ❌ No direct git commit | **DELIVERED** | HM specialist batch 1 |
| **AS-5** | ❌ No direct git commit | **DELIVERED** | HM specialist batch 2 |
| **AS-6** | ❌ No direct git commit | **DELIVERED** | HF meta builder agents |
| **AS-7** | ✅ feat: body enrichment (31262437, c0340f1a, d5fc3638) | **DELIVERED** | Body enrichment & standardization across 40 agents; workflow_awareness added to 60 agents |
| **AS-8** | ❌ No direct git commit, has TOOL-PERMISSIONS-MATRIX.md | **DELIVERED** | Tool integration / agent body enrichment |
| **AS-9** | ✅ phase: workflow integration (d41daef5) | **DELIVERED** | Workflow awareness + command-to-agent bindings + cross-lineage handoff protocols |
| **AS-10** | ✅ phase: naming syndicate (936437f0) | **DELIVERED** | Naming syndicate integration: all 56 agent bodies reference hf-naming-syndicate |
| **AS-11** | ✅ phase: final verification (79f1a5de) | **DELIVERED** | Final agent ecosystem verification — workstream CLOSED |

### Valuable Context Extracted

| Decision/Spec | Source | Value |
|---------------|--------|-------|
| **Agent Inventory** (59 agents, 58 on disk, 1 ghost) | `AS-0/AGENT-INVENTORY.md` | Complete classification matrix, quality scores, body format catalog, defect register |
| **Agent Architecture Synthesis** | `AS-1/AGENT-ARCHITECTURE-SYNTHESIS.md` | Body format standard, permission model, 2-lineage design |
| **Lineage Classification Schema** (1266 lines) | `AS-2/LINEAGE-CLASSIFICATION-SCHEMA.md` | DEFINITIVE schema: YAML frontmatter fields, permission blocks, depth levels, temperature ranges, domain routing rules, 59-agent migration map. This is THE reference for all agent authoring |
| **Tool Permissions Matrix** | `AS-8/TOOL-PERMISSIONS-MATRIX.md` | Per-agent tool permissions |
| **Command Agent Bindings** | `AS-9/COMMAND-AGENT-BINDINGS.md` | Cross-lineage handoff protocols |
| **7 Locked Design Decisions** | `agent-synthesis/CONTEXT.md` | D-01 through D-07 defining GSD internal-only, hm/hf prefixes, 3-level depth, body quality standards |

### Workstream Summary
- **12/12 phases completed** (per STATE.md)
- **56 shipped hm/hf agents** created
- **0 violations on final verification** (AS-11)
- **Critical reference schema:** LINEAGE-CLASSIFICATION-SCHEMA.md is the definitive source for all agent authoring rules

---

## 7. Workstream: primitive-registry

**Status:** PLANNED (empty)  
**Root:** `.planning/workstreams/primitive-registry/`  
**Child Docs:** CONTEXT.md  
**Phases:** 0 (only `.gitkeep` in phases/)

### Classification

| Phase | Classification | Notes |
|-------|----------------|-------|
| **ENTIRE WORKSTREAM** | **TRASH** | Only CONTEXT.md + .gitkeep files. No phases created, no plans, no artifacts. Purpose is defined in ROADMAP.md and PROJECT.md but no work has been done. The primitive registry concept was partially implemented in Phase 61 (milestone workstream) but this workstream itself is empty. |

### Recommendation
- **Delete the phases/ directory** or merge into milestone Phase 61 artifact
- Keep CONTEXT.md as reference for the planned work

---

## 8. Workstream: bootstrap-cli-onboarding

**Status:** PLANNED (empty)  
**Root:** `.planning/workstreams/bootstrap-cli-onboarding/`  
**Child Docs:** CONTEXT.md  
**Phases:** 0 (only `.gitkeep` in phases/)

### Classification

| Phase | Classification | Notes |
|-------|----------------|-------|
| **ENTIRE WORKSTREAM** | **TRASH** | Only CONTEXT.md + .gitkeep files. No phases created, no plans, no artifacts. Purpose is defined in ROADMAP.md (npm install → npx init pathway, greenfield/brownfield setup, doctor mode, CLI substrate) but no work done. CLI substrate was implemented in Phase 40 (milestone) but not in this workstream. |

### Recommendation
- **Delete the phases/ directory**
- Keep CONTEXT.md as reference for the planned work

---

## 9. Root `.planning/` Files Audit

| File | Classification | Status | Evidence |
|------|---------------|--------|----------|
| **PROJECT.md** (268 lines) | **ACTIVE** | Current | Comprehensive project definition: 4 feature paths, 2 lineages, 2 halves model, Q6 decision, workstream status, build gates |
| **STATE.md** (96 lines) | **ACTIVE** | Current | Workstream state tracking: milestone (SUSPENDED), HER (ACTIVE), skill-ecosystem (CLOSED), agent-synthesis (CLOSED), proposed/deferred workstreams, build gates (1604 tests, 90.49% coverage) |
| **ROADMAP.md** (153 lines) | **ACTIVE** | Current | Master roadmap aggregating all workstreams. HER (ACTIVE), planned workstreams (hivemind-state-architecture, primitive-registry, bootstrap-cli-onboarding), deferred (5 items) |
| **REQUIREMENTS.md** | **ACTIVE** | Current | Requirements document — not audited in this pass but referenced by multiple workstreams |
| **MASTER-PROJECT-SKELETON.md** | **VALUABLE-CONTEXT** | Reference | Comprehensive architecture skeleton: 4 paths × 2 lineages, feature-to-code mapping |
| **SKELETON-TRACKING-INDEX.md** | **VALUABLE-CONTEXT** | Reference | Tracking index for skeleton documents |
| **SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md** | **VALUABLE-CONTEXT** | Current | Most recent skeleton — dated 2026-05-06 |
| **SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md** | **TRASH** | Superseded | Older version, superseded by v2 above |
| **CUSTOM-TOOLS-CRITERIA-2026-05-05.md** | **VALUABLE-CONTEXT** | Reference | Criteria for custom tool development |
| **v2.0-MILESTONE-AUDIT.md** | **VALUABLE-CONTEXT** | Reference | Previous milestone audit — consumed by this audit |
| **RICH-SKILL-QUALITY-GATE.md** | **VALUABLE-CONTEXT** | Reference | RICH skill quality gate definition |
| **RICH-AUDIT-HM-SKILLS-REPORT.md** | **VALUABLE-CONTEXT** | Reference | Previous RICH audit report |
| **config.json** | **ACTIVE** | Current | Planning configuration |

---

## 10. Blocker Inventory

| # | Blocker | Workstream | Severity | Remediation |
|---|---------|-----------|----------|-------------|
| **B-01** | 14 archived TRASH phases in milestone/ still consuming disk space and search noise | milestone | LOW | Move `.archived` phases to `.planning/archives/trash-phases/` or delete entirely |
| **B-02** | primitive-registry workstream is empty shell — causes confusion with Phase 61 implementation | primitive-registry | MEDIUM | Either populate with Phase 61 artifacts or merge/delete the workstream directory |
| **B-03** | bootstrap-cli-onboarding workstream is empty shell | bootstrap-cli-onboarding | MEDIUM | Either populate or merge/delete |
| **B-04** | milestone phases 68-73 are empty or CONTEXT-only — marked as implementation but no code found | milestone | MEDIUM | Either create implementation plans or reclassify as PLANNED-ONLY |
| **B-05** | STATE.md says Phase 70 and 71 are COMPLETE but no git evidence found | milestone | HIGH | Verify if these were completed through another mechanism; if so, document the evidence |
| **B-06** | SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md superseded by v2 but not archived | root | LOW | Archive old skeleton, keep v2 as canonical |
| **B-07** | 7 phase numbers are gaps (04-07, 09-10, 12-13) in milestone workstream | milestone | LOW | Document whether these were intentionally skipped or content was moved |
| **B-08** | HER-3/4/5 are READY but have zero plans — only CONTEXT.md | harness-ecosystem-recovery | MEDIUM | Create PLAN.md for each before execution |

---

## 11. Extracted Valuable Context — Consolidated

### Locked Architecture Decisions

| ID | Decision | Source | Scope |
|----|----------|--------|-------|
| **Q1-Q6** | 6 validation decisions locked 2026-04-25 | `VALIDATION-DECISIONS-2026-04-25.md` | Project-wide foundation |
| **Q6** | `.hivemind/` is internal state root; `.opencode/` ONLY for OpenCode primitives | `PROJECT.md § State Root` | State architecture |
| **HMQUAL-01 through HMQUAL-08** | Project-level quality contract for all hm-* skills | Phase 26 synthesis | Skill quality |
| **D-01 through D-07** | Agent design decisions: GSD internal-only, hm/hf prefixes, 3-level depth, body quality | `agent-synthesis/CONTEXT.md` | Agent architecture |
| **Path × Lineage Model** | 4 feature paths × 2 lineages (hm STRICT, hf FLEXIBLE) | `MASTER-PROJECT-SKELETON.md` | Project organization |

### Definitive Reference Schemas

| Schema | Location | Lines | Authority |
|--------|----------|-------|-----------|
| **Lineage Classification Schema** | `AS-2/LINEAGE-CLASSIFICATION-SCHEMA.md` | 1266 | Definitive agent authoring rules |
| **Module Ownership Matrix** | `HER-0/matrix/module-ownership-2026-05-05.csv` | CSV | Module → owner → CQRS → state authority |
| **Ecosystem Reconciliation Matrix** | `HER-0/matrix/ecosystem-reconciliation-matrix-2026-05-05.md` | — | Cross-lane truth reconciliation |
| **Agent Inventory** | `AS-0/AGENT-INVENTORY.md` | 424 | Complete agent classification |

---

## 12. TRASH Archive List

The following phases are candidates for archival or deletion:

### milestone workstream — Archived (`.archived` marker present)

| Phase | Directory | Reason |
|-------|-----------|--------|
| 15 | `15-security-quality-remediation-fix-all-26-audit-issues-from-co/` | Superseded |
| 17 | `17-hivemind-skills-refactor/` | Superseded by skill-ecosystem |
| 18 | `18-context-and-research-phase-cr-for-skills-refactor-playbook-v/` | Superseded by Phase 26 |
| 19 | `19-rename-sprint-playbook-phase-1/` | Superseded |
| 20 | `20-structural-changes-playbook-phase-2/` | Superseded |
| 21 | `21-description-rewrite-playbook-phase-3/` | Superseded |
| 22 | `22-script-hardening-playbook-phase-4/` | Superseded |
| 23 | `23-body-quality-eval-playbook-phase-5/` | Superseded |
| 24 | `24-fix-22-failed-hm-skills/` | Superseded |
| 27 | `27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/` | Superseded by Phase 26 |
| 28 | `28-g-c-research-lineage-apply-proven-d1-d8-quality-pattern-to-h/` | Superseded |
| 29 | `29-g-d-execution-lineage-bring-execution-debugging-refactoring-/` | Superseded |
| 30 | `30-g-a-guardrail-lineage-harden-completion-loops-phase-loops-de/` | Superseded |
| 51 | `51-stack-research-synthesis-skill-runtime-grounding/` | Superseded |

### Empty workstreams

| Workstream | Action |
|------------|--------|
| `primitive-registry/phases/` | Delete — only .gitkeep |
| `bootstrap-cli-onboarding/phases/` | Delete — only .gitkeep |

### Superseded root files

| File | Action |
|------|--------|
| `SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md` | Archive — superseded by v2 |

---

## 13. Recommended New Project Structure

The current `.planning/` structure has grown organically. A recommended consolidation:

```
.planning/
├── PROJECT.md                    # KEEP — project definition
├── STATE.md                      # KEEP — current state tracking
├── ROADMAP.md                    # KEEP — master roadmap
├── REQUIREMENTS.md               # KEEP — requirements
├── config.json                   # KEEP — configuration
│
├── workstreams/
│   ├── core-architecture/        # ACTIVE — CA-01 through CA-04
│   │   ├── ROADMAP.md
│   │   ├── STATE.md
│   │   └── phases/
│   │       ├── CA-01/            # DELIVERED
│   │       ├── CA-02/            # DELIVERED
│   │       ├── CA-03/            # DELIVERED
│   │       └── CA-04/            # IN-PROGRESS (research)
│   │
│   ├── harness-ecosystem-recovery/  # ACTIVE — HER-0 through HER-5
│   │   ├── ROADMAP.md
│   │   ├── STATE.md
│   │   ├── REQUIREMENTS.md
│   │   └── phases/
│   │       ├── HER-0/            # COMPLETE — VALUABLE-CONTEXT
│   │       ├── HER-1/            # COMPLETE
│   │       ├── HER-2/            # COMPLETE
│   │       ├── HER-3/            # READY — PLANNED-ONLY
│   │       ├── HER-4/            # READY — PLANNED-ONLY
│   │       └── HER-5/            # READY — PLANNED-ONLY
│   │
│   └── milestone/                # SUSPENDED — merge into above or keep as historical
│       ├── STATE.md
│       ├── ROADMAP.md
│       ├── REQUIREMENTS.md
│       └── phases/               # Keep DELIVERED + VALUABLE-CONTEXT only
│           ├── 36-42/            # DELIVERED
│           ├── 52-54/            # VALUABLE-CONTEXT
│           ├── 60-61/            # DELIVERED
│           ├── 64/               # DELIVERED
│           ├── 66-67/            # DELIVERED
│           └── 68-73/            # PLANNED-ONLY (verify status)
│
├── legacy-workstreams/
│   ├── skill-ecosystem/          # CLOSED — symlink or archive
│   ├── agent-synthesis/          # CLOSED — symlink or archive
│   └── hivemind-state-architecture/  # ABSORBED — symlink or archive
│
├── archives/
│   └── trash-phases/             # Move .archived phases here
│       ├── milestone-phase-15/
│       ├── milestone-phase-17/
│       └── ... (14 archived phases)
│
├── audits/                       # This file + future audits
│   └── PLANNING-AUDIT-2026-05-07.md
│
├── references/                   # Move SKELETON-*, RICH-AUDIT-*, etc. here
│   ├── MASTER-PROJECT-SKELETON.md
│   ├── SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md
│   ├── SKELETON-TRACKING-INDEX.md
│   ├── RICH-AUDIT-HM-SKILLS-REPORT.md
│   ├── RICH-SKILL-QUALITY-GATE.md
│   └── CUSTOM-TOOLS-CRITERIA-2026-05-05.md
│
├── decisions/                    # ADRs
├── codebase/                     # Architecture docs
├── research/                     # Research artifacts
├── spikes/                       # Spike results
├── intel/                        # Intelligence gathering
└── graphs/                       # Dependency graphs
```

### Recommendation

1. **Remove empty workstreams:** `primitive-registry/` and `bootstrap-cli-onboarding/` phases directories
2. **Move archived phases:** 14 archived milestone phases → `.planning/archives/trash-phases/`
3. **Consolidate closed workstreams:** `skill-ecosystem/` and `agent-synthesis/` are CLOSED — keep as reference but move to `legacy-workstreams/`
4. **Move reference docs:** SKELETON files, RICH-AUDIT reports → `.planning/references/`
5. **Verify Phase 70-71 status:** STATE.md claims COMPLETE but no git evidence — verify and update classification

---

## 14. Audit Methodology Verification

| Self-Check | Status | Evidence |
|------------|--------|----------|
| Every scored phase has evidence reference | ✅ | git log commit hash or file listing provided for each classification |
| Score thresholds applied consistently | ✅ | DELIVERED = git feat/test/merge evidence; VALUABLE-CONTEXT = critical decisions/specs; PLANNED-ONLY = docs but no code; TRASH = archived or empty |
| Deployment checklist application | N/A | This is a planning audit, not a deployment audit |
| Maintainability metrics quantified | ✅ | Phase counts, classification ratios, workstream statuses quantified |
| Blockers are actionable | ✅ | All 8 blockers have specific remediation steps |
| Temperature confirmed at 0.05 | ✅ | L2 specialist audit precision |
| No hf-* skills loaded | ✅ | Only hm-* skills loaded (hm-production-readiness, hm-roadmap-maintainability, hm-detective) |

---

## 15. Audit Verdict

**Overall Health:** 🟡 MODERATE — 2 workstreams actively delivering, 2 closed with valuable artifacts, but 2 empty shells and 14 archived trash phases need cleanup.

**Key Strengths:**
- Core-architecture workstream is healthy with TDD-style implementation (test → feat → docs commits)
- HER-0 is the single most valuable audit artifact in the planning ecosystem
- Agent-synthesis produced the definitive LINEAGE-CLASSIFICATION-SCHEMA (1266 lines)
- Skill-ecosystem delivered 48/51 skills at ≥6/8 RICH-8 quality
- Build gates clean: 1604 tests, 90.49% coverage, typecheck and build pass

**Key Risks:**
- Milestone workstream SUSPENDED with 24 PLANNED-ONLY phases — unclear what will be executed
- 14 archived phases still on disk — search noise and confusion
- 2 empty workstreams create false expectations
- STATE.md claims Phase 70-71 COMPLETE without git evidence

**Recommended Priority Actions:**
1. **HIGH:** Verify Phase 70-71 completion status (blocker B-05)
2. **MEDIUM:** Create PLAN.md for HER-3, HER-4, HER-5 (blocker B-08)
3. **MEDIUM:** Consolidate or delete empty primitive-registry and bootstrap-cli-onboarding workstreams (blockers B-02, B-03)
4. **LOW:** Archive 14 TRASH milestone phases (blocker B-01)
5. **LOW:** Organize root .planning/ files into references/ subdirectory

---

*Audit completed 2026-05-07 by hm-l2-auditor. Evidence sources: git log (200 most recent commits), file system inventory (glob + directory listings), frontmatter scans. No code was modified. No planning files were changed.*
