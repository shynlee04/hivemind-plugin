# Workstream: Skill Ecosystem Gap Closure

**Created:** 2026-04-27
**Updated:** 2026-04-29 (audit findings integrated: SE-8, SE-9 added)
**Status:** IN PROGRESS (1/17 forward phases + 14 historical COMPLETE; 8 of 21 target skills already exist on disk)
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

## Phase Status Table

| Phase | Name | Status | Dependencies |
|-------|------|--------|--------------|
| SE-1 | Skill Reclassification & Cleanup | ✅ COMPLETE | — |
| SE-2 | Planning Pipeline Backbone | ⚠️ PARTIALLY COMPLETE | SE-1 |
| SE-3 | Pre-Gate Skills Hardening | 📋 PLANNED | SE-2 |
| SE-3.5 | Feature Ecosystem & Production Skills | 📋 PLANNED | SE-2 |
| SE-3.6 | Product Validation Skill Hardening | 📋 PLANNED | SE-3 |
| SE-4 | Research Pipeline Enhancement | 📋 PLANNED | SE-2 |
| SE-5 | Gate Orchestration & Lineage Routing | 🔲 NOT STARTED | SE-3 + SE-4 |
| SE-5.5 | Internal Gate Skills Hardening | 🔲 NOT STARTED | SE-5 |
| SE-6 | Meta-Builder Skills Enhancement | 🔲 NOT STARTED | SE-5 |
| SE-7 | Integration Verification | 🔲 NOT STARTED (blocked) | SE-5 + SE-6 |
| SE-8 | Orphan Skill Hardening | 🔲 NOT STARTED | SE-2 |
| SE-9 | Final Integrity Verification | 🔲 NOT STARTED (blocked) | SE-7 + SE-8 |
| SE-10 | Skill Routing & Agent Dispatch Bindings | 🔲 NOT STARTED | SE-9 |
| SE-11 | Naming Syndicate Formalization | 🔲 NOT STARTED | SE-10 |
| SE-12 | Tool Capability Matrix (Skill Side) | 🔲 NOT STARTED | SE-9 |
| SE-13 | Hivemind Engine Contracts | 🔲 NOT STARTED | SE-12 |
| SE-14 | Skill-Agent Integration Contracts | 🔲 NOT STARTED | SE-13 + SE-11 |
| SE-H1→SE-H14 | Historical Phases | ✅ COMPLETE | — |

**Total forward phases: 17** (SE-1 through SE-14, including SE-2, SE-3, SE-3.5, SE-3.6, SE-4, SE-5, SE-5.5, SE-6, SE-7, SE-8, SE-9, SE-10, SE-11, SE-12, SE-13, SE-14)

## Thin-Frame Phases

Each phase defines SCOPE only. Actual design decisions, research, and implementation plans are produced within each phase's discuss → research → plan → execute cycle.

---

### Phase SE-1: Skill Reclassification & Cleanup ✅ COMPLETE

**Result:** 10 renames, 1 removal, all cross-references fixed, AGENTS.md updated, gate permissions added.
**Commits:** e114cdb8, f0c785db, 01f1ccd1, 2f8111e8

---

### Phase SE-2: Planning Pipeline Backbone ⚠️ PARTIALLY COMPLETE

**Goal:** Replace disabled `hm-planning-with-files` with `hm-planning-persistence` using `.hivemind/state/planning/` as canonical path. Fix 11 broken references across all dependent skills. Remove hard dependency from hm-coordinating-loop. Archive disabled skill.

**As-Is (Broken):** `hm-planning-with-files` is DISABLED (`donotusethis-*`). 11 skills reference it. `hm-coordinating-loop` has HARD prerequisite (verify-hierarchy.sh exits 1).

**To-Be:** `hm-planning-persistence` → `.hivemind/state/planning/<session-id>/`. All 11 references updated. Coordinator uses soft boundary (graceful fallback to in-memory state).

**Status:** PARTIALLY COMPLETE — `hm-planning-persistence` SKILL.md exists on disk. 4 plan files were NOT executed. 11 broken references to `donotusethis-hm-planning-with-files` remain unverified. Remaining work: execute SE-2-02 through SE-2-04 plans (reference fixes, archive, integration verification).
**Plans:** 4 plans (1 of 4 executed)

Plans:
- [x] SE-2-01-PLAN.md — Research + Create hm-planning-persistence (Wave 1) ✅ SKILL.md on disk
- [ ] SE-2-02-PLAN.md — Fix CRITICAL hm-coordinating-loop + 5 references (Wave 2)
- [ ] SE-2-03-PLAN.md — Fix 5 remaining references + hm-meta-builder (Wave 2)
- [ ] SE-2-04-PLAN.md — Archive disabled skill + Integration verification (Wave 3)

**Depends on:** SE-1 (renames done, references clean)

---

### Phase SE-3: Pre-Gate Skills — Brainstorming, Requirements, Cross-Cutting

**Goal:** Harden already-created skills that fill the workflow gap BEFORE quality gates engage. These 4 skills exist on disk (15-20KB each) and need RICH audit, trigger tuning, and quality gate alignment.

**Scope (what, not how):**
- Harden existing `hm-brainstorm` — RICH audit, trigger tuning, ideation → requirements → spec-driven-authoring handoff verification
- Harden existing `hm-requirements-analysis` — RICH audit, gap detection verification, constraint discovery routing
- Harden existing `hm-cross-cutting-change` — RICH audit, cross-pane modification governance, red-first verification, lifecycle impact checking
- Harden existing `hm-tech-context-compliance` — RICH audit, tech stack validation against project constraints
- All skills must pass RICH-1 through RICH-8
- All skills must route output to hm-gate-orchestrator → triad gates

**Depends on:** SE-2 (artifact hierarchy for planning artifacts)

---

### Phase SE-3.5: Feature Ecosystem & Production Skills

**Goal:** Harden already-created skills for features designed as an interdependent ecosystem, production deployment readiness, and product roadmap maintainability.

**Scope (what, not how):**
- Harden existing `hm-feature-ecosystem` — RICH audit, cross-dependency design, impact analysis, dependency graph validation, ordered feature delivery
- Harden existing `hm-production-readiness` — RICH audit, deployment verification, changelog/migration validation, evidence collection for gate-evidence-truth
- Harden existing `hm-roadmap-maintainability` — RICH audit, product roadmap, feature ordering by dependency, maintainability scoring, extensibility checks
- All 3 must pass RICH-1 through RICH-8

**Depends on:** SE-2 (can run parallel with SE-3)

---

### Phase SE-3.6: Product Validation Skill Hardening

**Goal:** Harden the already-created `hm-product-validation` skill (20KB on disk) — RICH audit, trigger tuning, and quality gate alignment.

**Scope (what, not how):**
- RICH-1 through RICH-8 audit of hm-product-validation
- Verify product-lens methodology integration with hm-brainstorm and hm-requirements-analysis
- Align with hm-production-readiness for deployment-readiness handoff
- Ensure description mentions RICE score, product validation, anti-solution-check triggers
- Route output to hm-gate-orchestrator → triad gates

**Depends on:** SE-3 (pre-gate skills hardened, which hm-product-validation routes to)

---

### Phase SE-4: Research Pipeline Enhancement

**Goal:** Harden existing tech stack ingestion skill and fix the research chain's broken bidirectional references.

**Scope (what, not how):**
- Harden existing `hm-tech-stack-ingest` — RICH audit, download repos via repomix/deepwiki as bundled assets, progressive disclosure, version tracking, TOC/metadata
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

**⚠️ Dead References:** `hm-gate-orchestrator` is referenced by 3 existing skills (`hm-production-readiness`, `hm-requirements-analysis`, `hm-roadmap-maintainability`) but does NOT exist yet. These references are dead until SE-5 delivers. SE-5 must either create the orchestrator or update these 3 skills to remove/bypass the dependency.

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

---

### Phase SE-8: Orphan Skill Hardening

**Goal:** Harden the 25 skills not covered by any forward SE phase (SE-1 through SE-7). These skills exist on disk but have never been through a dedicated RICH audit or cross-reference integrity pass.

**Scope — hm-* operational skills (15):**
- `hm-completion-looping` — completion detection, regression guardrails
- `hm-coordinating-loop` — multi-agent dispatch with validation gates
- `hm-debug` — systematic debugging with persistent state
- `hm-omo-reference` — oh-my-openagent architecture reference
- `hm-opencode-non-interactive-shell` — shell safety for headless agents
- `hm-opencode-platform-reference` — OpenCode platform docs
- `hm-opencode-project-audit` — project ecosystem audit
- `hm-phase-execution` — wave-based phase execution with checkpoint recovery
- `hm-phase-loop` — iterative phase loop management
- `hm-planning-persistence` — cross-session state persistence (verify SE-2 fixes)
- `hm-refactor` — surgical vs structural refactoring decision framework
- `hm-spec-driven-authoring` — spec-locking and requirement extraction
- `hm-subagent-delegation-patterns` — subagent dispatch and checkpoint protocols
- `hm-test-driven-execution` — TDD RED/GREEN/REFACTOR cycles
- `hm-user-intent-interactive-loop` — interactive intent probing

**Scope — hf-* meta-builder skills (10):**
- `hf-agent-composition` — agent XML markup and composition
- `hf-agents-and-subagents-dev` — agent architecture and dispatch
- `hf-agents-md-sync` — AGENTS.md drift detection and repair
- `hf-command-dev` — command structure and shell safety
- `hf-command-parser` — propositional command argument parsing
- `hf-context-absorb` — multi-wave context absorption protocol
- `hf-custom-tools-dev` — plugin SDK and custom tool architecture
- `hf-delegation-gates` — pre-delegation authorization gates
- `hf-skill-synthesis` — skill pattern classification and scaffolding
- `hf-use-authoring-skills` — skill authoring quality and TDD

**Scope — stack-* reference skills (6):**
- `stack-bun-pty` — bun-pty pseudo-terminal integration
- `stack-json-render` — @json-render/react generative UI
- `stack-nextjs` — Next.js 16.x App Router patterns
- `stack-opencode` — OpenCode SDK and plugin internals
- `stack-vitest` — Vitest testing framework reference
- `stack-zod` — Zod v4 schema validation

**Scope — unprefixed skills (1):**
- `opencode-config-workflow` — will be replaced by SE-6 (`hf-config-workflow`)

**Total: 25 skills** (15 hm-* + 10 hf-* + 6 stack-* + 1 unprefixed; note: opencode-config-workflow counted once in unprefixed)

**Scope (what, not how):**
- RICH-1 through RICH-8 audit for all 25 skills
- Cross-reference integrity verification
- Trigger description tuning
- Dead reference cleanup (especially `donotusethis-hm-planning-with-files` remnants)
- Verify `opencode-config-workflow` is superseded by SE-6 deliverable

**Depends on:** SE-2 (planning-persistence reference fixes must be complete before this phase can verify them)
**Wave:** Same wave as SE-3 / SE-3.5 (parallel hardening track)

---

### Phase SE-9: Final Integrity Verification

**Goal:** Prove the entire skill ecosystem is coherent, complete, and production-ready. This is the terminal verification phase.

**Scope (what, not how):**
- Full RICH gate audit on ALL 49 active skills (target: 100% PASS)
- Cross-reference integrity verification across all skills (target: 0 broken references)
- End-to-end workflow test: brainstorm → requirements → spec → TDD → artifacts → gate orchestration → triad → production readiness
- Lineage routing test: product task → hm-* chain, meta task → hf-* chain, stack reference → correct SDK docs
- Verify all 3 `hm-gate-orchestrator` references in `hm-production-readiness`, `hm-requirements-analysis`, `hm-roadmap-maintainability` resolve correctly
- Verify `donotusethis-hm-planning-with-files` is fully archived with zero remaining references
- Verify `hf-meta-builder` frontmatter name is `hf-meta-builder` (not `hr-meta-builder`)
- Produce final ecosystem coherence report

**Depends on:** SE-7 (integration verification complete) + SE-8 (orphan skills hardened)

---

### Phase SE-10: Skill Routing & Agent Dispatch Bindings

**Goal:** Create router skills that map task intent to agent dispatch. Bridge the hm/hf lineage gap so agents can discover cross-lineage skills without manual wiring.

**Context:** Agents currently don't know which skills to load for a given task — there is no routing mechanism. hf-agents lack hm-skill awareness for cross-lineage work. All 49 skills have trigger conditions, but nothing aggregates and classifies them for agent consumption.

**Scope (what, not how):**
- Create `hm-skill-router` — maps task classification → skill loading list for product-dev tasks
- Create `hf-skill-router` — maps meta-concept intent → skill + hm-fallback for meta-builder tasks
- Update AGENTS.md skill router section with dispatcher binding rules
- Ensure all 49 skills have clear trigger conditions that routers can parse
- Verify cross-lineage bridge: hf-agent → hf-skill-router → hm-skill (fallback path works)
- Router skills must pass RICH-8 scorecard

**Deliverables:** `hm-skill-router`, `hf-skill-router`, updated AGENTS.md skill-router section

**Depends on:** SE-9 (final integrity verification — all skills must be stable before routing is built)
**Blocks:** AS-3 (agents need routing for skill discovery), AS-7 (capability matrix wiring needs routing)

---

### Phase SE-11: Naming Syndicate Formalization

**Goal:** Formalize a naming taxonomy across ALL skills following `[lineage]-[domain]-[function]` pattern. Enforce consistency so every skill name is predictable and parsable.

**Context:** Skills have inconsistent naming — some `hm-*`, some `hf-*`, some unprefixed (`opencode-config-workflow`). There is no documented naming convention. `hf-meta-builder` frontmatter was fixed (was `hr-meta-builder`), but other inconsistencies may remain.

**Scope (what, not how):**
- Document naming rules in `NAMING-SYNDICATE.md` — define `[lineage]-[domain]-[function]` pattern
- Fix all naming inconsistencies across 49 skills (ensure frontmatter `name:` matches directory name)
- Ensure `opencode-config-workflow` is renamed to `hf-config-workflow` (SE-6 deliverable prerequisites verified)
- Create syndicate validation script at `.planning/workstreams/skill-ecosystem/scripts/validate-naming.sh`
- Verify no unprefixed skills remain after SE-6 execution
- NAMING-SYNDICATE.md must document: prefix rules, domain category taxonomy, function naming patterns, conflict resolution rules

**Deliverables:** `NAMING-SYNDICATE.md`, validated naming for all 49 skills, `scripts/validate-naming.sh`

**Depends on:** SE-10 (routers need stable, predictable naming to parse skill names)
**Blocks:** AS-11 (agent naming syndicate depends on skill naming syndicate)

---

### Phase SE-12: Tool Capability Matrix (Skill Side)

**Goal:** Create a formal tool capability matrix mapping every skill to the tools it requires. Every agent can determine its tool permissions from the skills it loads.

**Context:** No formal mapping exists of which tools map to which skills/agents. Tools are categorized into: OpenCode native tools, Hivemind custom tools, and MCP/external tools. Without a matrix, agents either over-provision or under-provision tool access.

**Scope (what, not how):**
- Create `TOOL-CAPABILITY-MATRIX.md` documenting all tool categories:
  - **OpenCode native:** read, write, edit, bash, glob, grep, task, skill, todowrite
  - **Hivemind custom:** delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, configure-primitive, validate-restart
  - **MCP/external:** tavily-*, brave-*, deepwiki-*, github-*, repomix-*
- Each of the 49 skills must declare its tool requirements in SKILL.md frontmatter or a dedicated tool-requirements section
- Matrix must be verifiable: running a scan script confirms every tool referenced in a skill is declared

**Deliverables:** `TOOL-CAPABILITY-MATRIX.md`, tool requirement declarations in all 49 SKILL.md files

**Depends on:** SE-9 (all skills hardened — their tool usage patterns are known and stable)
**Blocks:** AS-9 (agent tool integration needs the matrix to configure tool permission sets)

---

### Phase SE-13: Hivemind Engine Contracts

**Goal:** Create skills that document how to interact with Hivemind custom engines and state. Agents loading these skills can navigate `.hivemind/` state, understand delegation protocols, and use custom engines correctly.

**Context:** Skills currently know nothing about `.hivemind/` state, task queues, delegation styles, or custom engines. Agents operating in the Hivemind runtime need to understand:
- `.hivemind/state/` persistence (continuity, delegations, session-continuity)
- `.hivemind/event-tracker/` session journals
- `.hivemind/state/planning/` task persistence
- Task management: queue-key validation, concurrency
- Delegation styles: WaiterModel, background agents, auto-loop/ralph-loop
- Custom engines: completion-detector, lifecycle-manager, runtime-policy

**Scope (what, not how):**
- Create `hm-hivemind-state-reference` — product-dev lineage engine contract
- Create `hf-hivemind-state-reference` — cross-lineage variant for meta-builder agents
- Document `.hivemind/` directory structure and all engine APIs
- Include delegation protocol reference (WaiterModel, dual-signal completion)
- Include task queue reference (concurrency, queue-key validation)
- Both skills must pass RICH-8 scorecard

**Deliverables:** `hm-hivemind-state-reference`, `hf-hivemind-state-reference`

**Depends on:** SE-12 (tool matrix needed to know which tools agents use for engine interaction)
**Blocks:** AS-10 (agent workflow awareness needs engine contract knowledge)

---

### Phase SE-14: Skill-Agent Integration Contracts

**Goal:** Create formal bidirectional contracts between skills and agents. Every skill declares which agent types should load it; every agent declares which skills it loads per task category. No orphan skills, no unnecessary loads.

**Context:** There is no bidirectional binding between skills and agents. Skills don't declare their intended agent audience. Agents' skill-loading behavior is undocumented. This phase closes the loop between SE-10 (routing), SE-11 (naming), and SE-13 (engine contracts) by formalizing the binding rules.

**Scope (what, not how):**
- Create `INTEGRATION-CONTRACTS.md` documenting binding rules:
  - Skill→Agent: each SKILL.md declares target agent lineage (hm/hf/both) and agent level (L0/L1/L2)
  - Agent→Skill: each agent .md file declares skill loading list per task category
  - Cross-lineage bridging rules: when hm-agents may load hf-skills (and vice versa)
  - Orphan detection: skills with zero agent bindings → flagged
- Update all 49 SKILL.md files with agent-binding declarations
- Update all hm-* and hf-* agent .md files with skill-loading declarations
- Verify: no orphan skills, no agent loads a skill it doesn't need

**Deliverables:** `INTEGRATION-CONTRACTS.md`, contract declarations in all SKILL.md and agent .md files

**Depends on:** SE-13 (Hivemind contracts must be bound), SE-11 (naming must be stable for contracts)
**Blocks:** AS-7 (capability matrix wiring — bidirectional contracts enable verifiable bindings)

---

## Historical Phases (Completed Before Workstream Creation)

These phases were executed under the milestone workstream between 2026-04-22 and 2026-04-25. They are now part of the skill-ecosystem scope. **All are COMPLETE.** Their artifacts remain in `.planning/workstreams/milestone/phases/` for audit trail.

| Phase | Name | What It Delivered | Date |
|-------|------|-------------------|------|
| SE-H1 (was 17) | Critical Skill Fixes | C1-C5 resolved (dead refs, phantom files, duplicates) | 2026-04-22 |
| SE-H2 (was 18) | Context & Research — Playbook Phase CR | CR-01 through CR-08 evidence documents | 2026-04-23 |
| SE-H3 (was 19) | Rename Sprint — Playbook Phase 1 | 21 skills renamed, 368 files changed | 2026-04-23 |
| SE-H4 (was 20) | Structural Changes — Playbook Phase 2 | 1 merge, 1 split, 7 new skills created | 2026-04-23 |
| SE-H5 (was 21) | Description Rewrite — Playbook Phase 3 | 7 descriptions rewritten per V.7 template | 2026-04-24 |
| SE-H6 (was 22) | Script Hardening + 6-NON — Playbook Phase 4 | 6-NON defence tables added (later removed by SE-H8) | 2026-04-24 |
| SE-H7 (was 23) | Body Quality + Eval — Playbook Phase 5 | Trigger queries for 6 new skills | 2026-04-24 |
| SE-H8 (was 24) | Fix 22 Failed hm-* Skills | Onboarding headings, self-correction blocks, 6-NON removed | 2026-04-24 |
| SE-H9 (was 26) | Quality Synthesis | HMQUAL D1-D8 contract, G-B SPECs, archive report | 2026-04-25 |
| SE-H10 (was 27) | G-B Quality Assurance Demonstration | hm-spec-driven-authoring + hm-test-driven-execution D1-D8 + RICH | 2026-04-25 |
| SE-H11 (was 28) | G-C Research Lineage | 4 research/synthesis skills RICH-validated | 2026-04-25 |
| SE-H12 (was 29) | G-D Execution Lineage | 15 execution/debug/refactor skills validated | 2026-04-25 |
| SE-H13 (was 30) | G-A Guardrail Lineage | 5 guardrail/completion/loop skills hardened | 2026-04-25 |
| SE-H14 (was 51) | Stack Skill Grounding | Grounding map for stack/research/synthesis skills | 2026-04-28 |

### Mapping to Current SE Phases

- **SE-1** (Reclassification & Cleanup) absorbs SE-H1 through SE-H8 (all skill quality fixes and renames are done)
- **SE-4** (Research Pipeline Enhancement) overlaps SE-H14 (stack grounding)
- SE-2 through SE-9 represent forward-looking work (SE-2 partially complete; SE-3 through SE-9 not started)

---

## Known Issues (2026-04-29 Audit)

1. **AGENTS.md is 18 skills behind** — claims 33 skills, reality is 49 active + 1 disabled
2. **hm-gate-orchestrator does not exist** — referenced by 3 skills (hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability) but no SKILL.md. Tracked in SE-5.
3. **hm-lineage-router does not exist** — needed for SE-5
4. **SE-2 partially executed** — hm-planning-persistence SKILL.md created but 11 reference fixes may not be complete. Tracked in SE-2 remaining plans.
5. **hf-meta-builder name mismatch** — frontmatter says `name: hr-meta-builder` (wrong prefix). Tracked in SE-9.
6. **Disabled hm-planning-with-files** still referenced by 9 active skills. Tracked in SE-2 remaining plans + SE-8 orphan audit.
7. **25 orphan skills** have never been through a dedicated RICH audit. Tracked in SE-8.
8. **No terminal verification** of full ecosystem coherence exists yet. Tracked in SE-9.
