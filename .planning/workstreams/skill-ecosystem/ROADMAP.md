# Workstream: Skill Ecosystem Gap Closure

**Created:** 2026-04-27
**Updated:** 2026-04-28
**Status:** IN PROGRESS (1/9 phases complete)
**Workstream:** skill-ecosystem (independent from milestone/main phases)
**Context:** `.planning/research/SKILL-ECOSYSTEM-GAP-ANALYSIS-2026-04-27.md`

## Key Architecture Decisions (Locked from SE-2 discuss)

| ID | Decision | Scope |
|----|----------|-------|
| D-01 | `.hivemind/` is canonical state root for planning artifacts | All phases |
| D-02 | `gate-*` skills are THIS PROJECT ONLY — not shipped | SE-5.5 |
| D-03 | All shipped planning skills use `hm-*` prefix | SE-2 through SE-7 |
| D-04 | Coordinating-loop uses soft boundary (no prerequisite check) | SE-2 |
| D-05 | Internal (gate-*) vs shipped (hm-*) must be clearly differentiated | All phases |
| D-06 | Complex cross-cutting concerns broken into downstream phases | SE-3 through SE-7 |

## Thin-Frame Phases

Each phase defines SCOPE only. Actual design decisions, research, and implementation plans are produced within each phase's discuss → research → plan → execute cycle.

---

### Phase SE-1: Skill Reclassification & Cleanup ✅ COMPLETE

**Result:** 10 renames, 1 removal, all cross-references fixed, AGENTS.md updated, gate permissions added.
**Commits:** e114cdb8, f0c785db, 01f1ccd1, 2f8111e8

---

### Phase SE-2: Planning Pipeline Backbone

**Goal:** Replace disabled `hm-planning-with-files` with `hm-planning-persistence` using `.hivemind/state/planning/` as canonical path. Fix 11 broken references across all dependent skills. Remove hard dependency from hm-coordinating-loop. Archive disabled skill.

**As-Is (Broken):** `hm-planning-with-files` is DISABLED (`donotusethis-*`). 11 skills reference it. `hm-coordinating-loop` has HARD prerequisite (verify-hierarchy.sh exits 1).

**To-Be:** `hm-planning-persistence` → `.hivemind/state/planning/<session-id>/`. All 11 references updated. Coordinator uses soft boundary (graceful fallback to in-memory state).

**Scope (what, not how):**
- Create `hm-planning-persistence` SKILL.md (RICH-1 through RICH-8, language-agnostic, framework-independent)
- Write to `.hivemind/state/planning/` — task_plan.md, findings.md, progress.md
- Fallback: `.session/` if `.hivemind/` not available (non-Hivemind projects)
- Update 11 skills: hm-coordinating-loop, hm-user-intent-interactive-loop, hm-spec-driven-authoring, hm-test-driven-execution, hm-completion-looping, hm-subagent-delegation-patterns, hm-phase-execution, hm-phase-loop, hm-debug, hm-refactor, hm-meta-builder
- Remove hard dependency from hm-coordinating-loop (replace verify-hierarchy.sh with graceful fallback)
- Archive `donotusethis-hm-planning-with-files` → `.opencode/retired/`

**Depends on:** SE-1 (renames done, references clean)

---

### Phase SE-3: Pre-Gate Skills — Brainstorming, Requirements, Cross-Cutting

**Goal:** Create skills that fill the workflow gap BEFORE quality gates engage. Currently no hm-* skills cover ideation, requirements surfacing, or cross-pane change governance.

**Scope (what, not how):**
- Create `hm-brainstorm` — ideation → requirements surfacing → handoff to spec-driven-authoring
- Create `hm-requirements-analysis` — formal requirements diagnosis, constraint discovery
- Create `hm-cross-cutting-change` — cross-pane modification governance, red-first verification, lifecycle impact checking
- Create `hm-tech-context-compliance` — tech stack validation against project constraints
- All skills must pass RICH-1 through RICH-8
- All skills must route output to hm-gate-orchestrator → triad gates

**Depends on:** SE-2 (artifact hierarchy for planning artifacts)

---

### Phase SE-3.5: Feature Ecosystem & Production Skills

**Goal:** Create skills for features designed as an interdependent ecosystem, production deployment readiness, and product roadmap maintainability.

**Scope (what, not how):**
- Create `hm-feature-ecosystem` — cross-dependency design, impact analysis, dependency graph validation, ordered feature delivery
- Create `hm-production-readiness` — deployment verification, changelog/migration validation, evidence collection for gate-evidence-truth
- Create `hm-roadmap-maintainability` — product roadmap, feature ordering by dependency, maintainability scoring, extensibility checks
- All 3 must pass RICH-1 through RICH-8

**Depends on:** SE-2 (can run parallel with SE-3)

---

### Phase SE-4: Research Pipeline Enhancement

**Goal:** Create tech stack ingestion skill and fix the research chain's broken bidirectional references.

**Scope (what, not how):**
- Create `hm-tech-stack-ingest` — download repos via repomix/deepwiki as bundled assets, progressive disclosure, version tracking, TOC/metadata
- Fix hm-research-chain ↔ hm-detective bidirectional reference
- Fix hm-research-chain ↔ hm-deep-research bidirectional reference
- Fix hm-research-chain ↔ hm-synthesis bidirectional reference
- Add cross-architecture research routing to hm-deep-research (tech → features bridge)

**Depends on:** SE-2 (artifact hierarchy for research artifacts)

---

### Phase SE-5: Gate Orchestration & Lineage Routing

**Goal:** Create unified entry point for quality gate triad and lineage classification routing.

**Scope (what, not how):**
- Create `hm-gate-orchestrator` — single entry for triad: lifecycle → spec → evidence, unified PASS/FAIL/REMEDIATE verdict
- Create `hm-lineage-router` — classifies task intent (product dev vs meta builder), routes to correct lineage
- Wire both into hm-meta-builder routing
- Ensure all shipped hm-* and hf-* skills declare lineage in YAML frontmatter

**Depends on:** SE-3 + SE-4 (pre-gate and research skills exist to route through gates)

---

### Phase SE-5.5: Internal Gate Skills — Hardening & Integration

**Goal:** Harden the 3 harness-internal gate skills (`gate-*` prefix). **THESE ARE THIS PROJECT ONLY — NOT SHIPPED.** Fix RICH audit failures.

**Scope (what, not how):**
- gate-lifecycle-integration: add hm-* operational skill routing, remediation paths, gap documentation
- gate-spec-compliance: add RICH-8 scorecard, fix project-local paths
- gate-evidence-truth: add RICH-8 scorecard, fix project-local paths, add backward triad reference
- Triad bidirectional cross-references
- Route FAIL findings to hm-debug/hm-refactor/hm-coordinating-loop

**Depends on:** SE-5 (gate-orchestrator exists to consume these hardened gates)

---

### Phase SE-6: Meta-Builder Skills Enhancement

**Goal:** Replace faulty `opencode-config-workflow` and create agent synthesizer skill. Complete the hivefiver (hf-*) lineage.

**Scope (what, not how):**
- Replace `opencode-config-workflow` with `hf-config-workflow` — full 8-turn workflow with bundled resources
- Create `hf-agent-synthesizer` — GSD+OMO agent synthesis with YAML config, hierarchical classification
- Add bidirectional references between all hf-* skills

**Depends on:** SE-5 (lineage routing), agent-synthesis workstream

---

### Phase SE-7: Integration Verification

**Goal:** Prove all shipped skills pass RICH gates, cross-references resolve, end-to-end workflow from brainstorm → spec → TDD → artifacts → gate orchestration → triad works.

**Scope (what, not how):**
- Run full RICH gate audit on all shipped skills (target: 100% PASS)
- Cross-reference integrity verification (target: 100% bidirectional)
- End-to-end workflow test across full pipeline
- Lineage routing test: product task → hm-* chain, meta task → hf-* chain
- Produce final ecosystem coherence report

**Depends on:** SE-6 (all skills created)
