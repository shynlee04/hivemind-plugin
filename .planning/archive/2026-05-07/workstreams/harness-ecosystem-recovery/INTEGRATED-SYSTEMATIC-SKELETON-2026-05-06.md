# Integrated Systematic Skeleton: Harness Ecosystem Recovery
**Date:** 2026-05-06
**Source:** Transformation of `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md`
**Reference:** `.planning/SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md`
**Status:** SKELETON FRAMEWORK — NOT implementation

---

## Executive Summary

This skeleton transforms the disorganized poor prompt into a structured, hierarchical framework that maps all identified issues to the 4 paths × 2 lineages model, cross-references existing workstream phases, and proposes dependency-ordered workstreams for uncovered gaps.

**Key Insight:** The poor prompt identifies 9 major feature groups (f-03a through f-09+) that map to the reference skeleton's 8 workstreams (WS-0 through WS-8). The current `harness-ecosystem-recovery` workstream covers HER-0 through HER-5, which addresses approximately 60% of the identified issues. The remaining 40% require new workstreams or phases.

---

## Issue Classification Matrix

### From Poor Prompt → 4 Paths × 2 Lineages

| Feature ID | Description | Path | Lineage | Current Coverage |
|------------|-------------|------|---------|------------------|
| **f-03a** | Agent registry, configs, routing | Path 3 (Governance) | Both | HER-0 (partial), HER-5 (agent rationalization) |
| **f-03b** | Skill registry, configs, routing | Path 3 (Governance) | Both | HER-0 (partial), skill-ecosystem workstream |
| **f-03c** | Tool registry, stacking, chaining | Path 3 (Governance) | Both | HER-0 (partial) |
| **f-03d** | MCP tool registry | Path 3 (Governance) | Both | HER-0 (Lane D) |
| **f-03e** | Custom tool registry | Path 3 (Governance) | Both | HER-0 (partial) |
| **f-03f** | Hook registry | Path 3 (Governance) | Both | HER-0 (Lane D) |
| **f-04** | Auto-commands, workflow router | Path 1 (Agent-Callable) | Both | NOT COVERED |
| **f-04a** | Intent analyzer, classification | Path 2 (Runtime) | Both | NOT COVERED |
| **f-05** | CLI install, configs.json, onboarding | Path 4 (Sidecar) | hf | NOT COVERED |
| **f-06** | Delegation revamp, background, async | Path 1 (Agent-Callable) | hm | HER-2 (partial), HER-4 (SDK depth) |
| **f-07** | Trajectory, task-plus, agent-work-contract | Path 1 + Path 2 | hm | HER-0 (partial), HER-3 (context) |
| **f-08** | Context, event-tracker, compaction | Path 2 (Runtime) | hm | HER-3 (context & compaction) |
| **f-09+** | Long-haul sessions, SDK hooks, tools | Path 2 (Runtime) | hm | HER-4 (SDK integration depth) |

---

## Mapping to Existing Workstreams

### HER-0: Ecosystem Re-map & Reality Audit ✅ COMPLETE

**Covers:**
- All features classified by 4 paths × 2 lineages (HER-0-A)
- Module ownership matrix (HER-0-C)
- SDK integration verification (HER-0-D)
- Legacy pattern validation (HER-0-E)

**Gaps:**
- Does NOT design new features
- Does NOT propose implementation order
- Does NOT address f-04, f-05, f-06 specifics

**Artifacts:**
- `phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md`
- `phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-reconciliation-matrix-2026-05-05.md`
- `phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md`

---

### HER-1: Documentation & Configuration Recovery ✅ COMPLETE

**Covers:**
- Governance document alignment (AGENTS.md, ARCHITECTURE.md)
- Broken command references fixed
- validate-restart errors resolved

**Gaps:**
- Does NOT address f-05 (CLI install, configs.json)
- Does NOT design onboarding flows

**Artifacts:**
- `phases/HER-1-doc-config-recovery/HER-1-CONTEXT.md`
- `phases/HER-1-doc-config-recovery/HER-1-PLAN.md`

---

### HER-2: Dead Code Cleanup ✅ COMPLETE

**Covers:**
- Orphan modules removed or wired
- session-entry/ wired (partial f-04c coverage)
- prompt-packet/ wired (partial f-08 coverage)

**Gaps:**
- Does NOT address delegation revamp (f-06)
- Does NOT address auto-commands (f-04)

**Artifacts:**
- `phases/HER-2-dead-code-cleanup/HER-2-01-PLAN.md`
- `phases/HER-2-dead-code-cleanup/HER-2-02-PLAN.md`
- `phases/HER-2-dead-code-cleanup/HER-2-03-PLAN.md`

---

### HER-3: Context & Compaction (BLOCKED)

**Covers:**
- Context budget management (f-08)
- Cognitive Packer re-implementation
- Injection Orchestrator re-implementation

**Gaps:**
- Does NOT address trajectory/task-plus (f-07)
- Does NOT address long-haul session survival (f-09+)

**Dependencies:** HER-2 (prompt-packet/ wiring) — COMPLETE

---

### HER-4: SDK Integration Depth (READY)

**Covers:**
- Hook write-safety (f-09b)
- L2→L3 delegation depth (f-06)
- Quality gates (f-08d)

**Gaps:**
- Does NOT address auto-commands (f-04)
- Does NOT address CLI/onboarding (f-05)

**Dependencies:** HER-1 — COMPLETE

---

### HER-5: Agent Rationalization (READY)

**Covers:**
- Agent overlap reduction (f-03a)
- Agent count reconciliation

**Gaps:**
- Does NOT address skill registry (f-03b)
- Does NOT address tool/MCP/hook registry (f-03c-f-03f)

**Dependencies:** HER-1 — COMPLETE

---

## Gap Analysis: Uncovered Issues

### Critical Gaps (NOT COVERED by existing workstreams)

| Gap | Feature Ref | Path | Lineage | Priority | Proposed Workstream |
|-----|-------------|------|---------|----------|---------------------|
| **Auto-commands & workflow router** | f-04, f-04a | Path 1 + Path 2 + Path 3 | Both | HIGH | WS-4 |
| **CLI install, configs.json, onboarding** | f-05 | Path 4 | hf | HIGH | WS-2 |
| **Primitive registry & control pane** | f-03a-f-03f | Path 3 | Both | HIGH | WS-3 |
| **Delegation revamp (full)** | f-06 | Path 1 + Path 2 | hm | MEDIUM | WS-5 |
| **Trajectory/task-plus (full)** | f-07 | Path 1 + Path 2 | hm | MEDIUM | WS-6 |
| **Sidecar & user configuration UI** | Path 4 | Path 4 | hf | LOW | WS-8 |

### Partial Gaps (PARTIALLY COVERED)

| Gap | Feature Ref | Current Coverage | Missing | Proposed Action |
|-----|-------------|------------------|---------|-----------------|
| **Context/event-tracker** | f-08 | HER-3 (blocked) | Full implementation | Unblock HER-3 |
| **SDK hooks integration** | f-09+ | HER-4 (ready) | Full implementation | Execute HER-4 |
| **Agent registry** | f-03a | HER-0 (audit only) | Design & implementation | Extend WS-3 |
| **Skill registry** | f-03b | skill-ecosystem workstream | Integration with WS-3 | Cross-workstream dependency |

---

## Proposed New Workstreams

Based on the reference skeleton and gap analysis, the following workstreams are needed:

### WS-0: Ecosystem Re-map & Reality Audit → **COVERED BY HER-0** ✅

**Status:** COMPLETE
**Artifacts:** See HER-0 section above

---

### WS-1: `.hivemind/**` State + Planning Architecture

**Purpose:** Design the canonical `.hivemind` structure before tools write more state.

**Scope:**
- Define required bootstrap tree (configs.json, manifests, hm-brain, hf-brain, delegation-managements, task-managements, plannings, journal, lineage, event-tracker, sidecar, onboarding, registries, runtime, artifacts, logs)
- Design strict schemas for JSON, YAML, Markdown frontmatter, XML-tagged body sections
- Define relationship metadata, line/index metadata, machine query fields
- Establish `.gitkeep` bootstrap policy

**Dependencies:** HER-0 (COMPLETE)

**Proposed Phase:** HER-6 or new workstream

**Artifacts to Produce:**
- `.hivemind/plannings/codebase/STRUCTURE.md`
- `.hivemind/plannings/codebase/CONVENTIONS.md`
- `.hivemind/plannings/codebase/INTEGRATIONS.md`
- `.hivemind/plannings/codebase/ARCHITECTURE.md`
- Schema specs for state roots

---

### WS-2: Bootstrap / CLI / Init / Onboarding Foundation

**Feature refs:** f-05, Path 4

**Purpose:** Make the harness installable and usable in a real user project.

**Scope:**
- npm package install model
- `npx` init (interactive and flags-based)
- greenfield vs brownfield setup
- `.hivemind/configs.json` with all configuration values
- default language/profile/mode config
- required folder bootstrap
- primitive installation/checkup
- required MCP/server/hook checks
- sidecar-readiness hooks
- doctor mode

**Key configs from poor prompt:**
- conversation language (vi, en, zh, fr, ja, ko, de, es, th, id)
- document/artifact language
- mode: expert-advisor / hivemind-powered / free-style
- user expert level: clumsy-vibecoder / beginner-friendly / intermediate-high-level / architecture-driven / absolute-expert
- delegation system toggles
- parallelization, atomic commit, commit docs
- workflow toggles (research, cross-session-tasks-dependencies-validation, trajectory-control, advanced-continuity-validation, task-plus-enabled, plan_check, verifier, ui_phase, ui_safety_gate, ai_integration_phase, research_before_questions, discuss_mode, use_worktrees)

**Dependencies:** WS-1

**Proposed Phase:** HER-7 or new workstream

---

### WS-3: Primitive Registry / Control Pane / Permission Compiler

**Feature refs:** f-03a to f-03f, Path 3, both lineages

**Purpose:** Make agents, skills, commands, tools, MCP tools, custom tools, hooks, and stack refs discoverable, configurable, and safely chainable.

**Scope:**
- registry schema
- global vs project primitive loading
- shipped vs user primitives
- allowed fields
- frontmatter parsing
- primitive validation
- permission matrix
- primitive relation graph
- stack/chaining/ordering contracts
- restart validation
- drift detection
- OpenCode primitive compatibility

**Subsystems:**
- agent registry (f-03a)
- skill registry (f-03b)
- command registry (f-04)
- tool registry (f-03c)
- MCP tool registry (f-03d)
- custom tool registry (f-03e)
- hook registry (f-03f)
- stack reference registry

**Dependencies:** HER-0, WS-1

**Proposed Phase:** HER-8 or new workstream

---

### WS-4: `hm/hf-auto-commands` and Workflow Router

**Feature refs:** f-04, Path 1 + Path 2 + Path 3, both lineages

**Purpose:** Turn slash commands and natural user prompts into routed, lifecycle-aware workflows.

**Scope:**
- `hm/hf-workflow-router`
- intent analyzer (f-04a)
- intent classification
- intent reconstruction
- intent-to-prompt
- prompt packet compiler
- command stacking
- command → agent → skill → tool chain selection
- propositional `$ARGUMENTS` parsing
- workflow templates
- command bundle registry
- session chat integration
- automatic command suggestion
- manual `/command` support
- lifecycle tracking
- hierarchy-aware workflow dispatch

**Required distinction:**
- `hm-auto-commands` → product-development workflows
- `hf-auto-commands` → meta-builder/configuration workflows

**Dependencies:** WS-3

**Proposed Phase:** HER-9 or new workstream

---

### WS-5: Delegation / Background / Async / Graph Execution Revamp

**Feature refs:** f-06, Path 1 + Path 2

**Purpose:** Rebuild delegation as a practical ecosystem, not just a thin SDK wrapper.

**Scope:**
- OpenCode native task integration
- custom `delegate-task`
- background delegation
- PTY/tmux/swarm lanes
- async result harvesting
- queue keys
- polling
- graph-based task dependencies
- delegation records
- L0→L1→L2→L3 hierarchy
- same-level delegation rules
- write-to-disk reports
- resumable child sessions
- task/subtask hierarchy
- role-aware tool access
- workflow-aware agent selection
- delegate with commands/skills/tools configured

**Suggested lanes:**
1. Native OpenCode Task Lane
2. SDK Child Session Lane
3. PTY / Background Command Lane
4. Graph Delegation Lane
5. Swarm Lane (optional)

**Dependencies:** WS-3, integrates with WS-6

**Proposed Phase:** HER-10 or new workstream

---

### WS-6: Trajectory / Task-Plus / Agent Work Contract / Continuity

**Feature refs:** f-07, Path 1 + Path 2

**Purpose:** Make task lifecycle persistent, queryable, graph-based, resumable, and dependency-aware.

**Scope:**
- task-plus
- advanced todo/task schema
- trajectory ledger
- graph-state
- agent-work-contract
- cross-session dependencies
- checkpoint graph
- abandoned/active/blocked task validation
- state continuation
- dependency validation before new sessions
- task-to-artifact relationships
- task-to-delegation relationships
- task-to-roadmap relationships
- task-to-implementation relationships

**Dependencies:** WS-1, WS-5

**Proposed Phase:** HER-11 or new workstream

---

### WS-7: Context / Event Tracker / Compaction / Time Machine Revamp

**Feature refs:** f-08, f-09+, Path 2

**Purpose:** Replace noisy context/event capture with useful, queryable, hierarchical session memory.

**Scope:**
- event-tracker audit
- event classification redesign
- structured append-only journal
- execution lineage
- context purification
- compact hook augmentation
- OpenCode compaction hook integration
- selected-context graph
- user-prompt/latest-response emphasis
- artifact relationship extraction
- retrieval profiles
- time-machine replay
- long-haul session survival
- stale context detection
- hallucination prevention

**Key rule:** Event tracker must not just record events. It must produce **usable context slices**.

**Dependencies:** WS-1, WS-6

**Proposed Phase:** HER-3 (existing, blocked) + HER-12 or new workstream

---

### WS-8: Sidecar + User Configuration UI Runway

**Feature refs:** Path 4

**Purpose:** Prepare the GUI/sidecar and user-facing configuration layer.

**Scope:**
- sidecar read-only state model
- allowed setting modifications
- hf-assisted configuration flow
- project/global config display
- onboarding UI
- primitive health dashboard
- lineage status
- workstream/phase/task graph visualization
- safety guards for user edits
- compile/validate before save
- artifact explorer

**Dependencies:** WS-1, WS-2, WS-3, partially WS-6

**Proposed Phase:** HER-13 or new workstream

---

## Dependency Order

```text
HER-0 (COMPLETE) ─────────────────────────────────────────┐
  ↓                                                        │
HER-1 (COMPLETE) ─────────────────────────────────────────┤
  ↓                                                        │
HER-2 (COMPLETE) ─────────────────────────────────────────┤
  ↓                                                        │
WS-1: .hivemind State Architecture ◄──────────────────────┤
  ↓                                                        │
WS-3: Primitive Registry / Control Pane ◄─────────────────┤
  ↓                                                        │
WS-2: Bootstrap / CLI / Init / Onboarding ◄───────────────┤
  ↓                                                        │
WS-4: Auto-Commands / Workflow Router ◄───────────────────┤
  ↓                                                        │
WS-5: Delegation Revamp ◄─────────────────────────────────┤
  ↓                                                        │
WS-6: Trajectory / Task-Plus / Continuity ◄───────────────┤
  ↓                                                        │
WS-7: Context / Event Tracker / Compaction ◄──────────────┤
  ↓                                                        │
WS-8: Sidecar + User Configuration UI ◄───────────────────┘
```

**Note:** HER-3 (Context & Compaction) maps to WS-7 and is currently BLOCKED. HER-4 (SDK Integration Depth) and HER-5 (Agent Rationalization) are READY and can proceed in parallel with WS-1.

---

## Cross-Workstream Dependencies

| Workstream | Depends On | Blocks | Integrates With |
|------------|------------|--------|-----------------|
| WS-1 | HER-0 | WS-2, WS-3, WS-6, WS-7, WS-8 | — |
| WS-2 | WS-1 | WS-8 | WS-3 (partial) |
| WS-3 | HER-0, WS-1 | WS-4, WS-5, WS-8 | WS-2 (partial) |
| WS-4 | WS-3 | — | WS-5, WS-6 |
| WS-5 | WS-3 | WS-6 | WS-4, WS-7 |
| WS-6 | WS-1, WS-5 | WS-7 | WS-4, WS-8 |
| WS-7 | WS-1, WS-6 | — | WS-5, WS-8 |
| WS-8 | WS-1, WS-2, WS-3 | — | WS-6, WS-7 |

---

## Governance Document Audit Plan

Before creating final phases, audit these governance documents:

| Document | Path | Audit Focus |
|----------|------|-------------|
| PROJECT.md | `.planning/PROJECT.md` | Alignment with 4 paths × 2 lineages model |
| STATE.md | `.planning/STATE.md` | Current phase status, blockers, dependencies |
| ROADMAP.md | `.planning/ROADMAP.md` | Workstream ordering, phase dependencies |
| REQUIREMENTS.md | `.planning/REQUIREMENTS.md` | Coverage of f-03a through f-09+ |
| ARCHITECTURE.md | `.planning/codebase/ARCHITECTURE.md` | Module ownership, lifecycle responsibilities |
| STACK.md | `.planning/codebase/STACK.md` | Dependency versions, compatibility |
| TESTING.md | `.planning/codebase/TESTING.md` | Test coverage, integration test gaps |
| CONCERNS.md | `.planning/codebase/CONCERNS.md` | Known issues, technical debt |
| INTEGRATIONS.md | `.planning/codebase/INTEGRATIONS.md` | Cross-module integration points |
| CONVENTIONS.md | `.planning/codebase/CONVENTIONS.md` | Naming, structure, format standards |
| STRUCTURE.md | `.planning/codebase/STRUCTURE.md` | Directory layout, file organization |

**Per-Workstream Governance:**
Each workstream has its own STATE.md, ROADMAP.md, REQUIREMENTS.md that must be checked against the parent root documents.

---

## Research Lanes (Pre-Implementation)

Before writing new ROADMAP/STATE updates, dispatch these research lanes:

### Lane A — Existing UAT + Feature Path Reclassification
**Inputs:** `.hivemind/uat/team-b/**`, previous final audit, all batch result files
**Outputs:** map each tested item to 4 paths, identify untested Path 4 surface, identify shallow tests

### Lane B — `.planning/**` Governance Audit
**Inputs:** `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/workstreams/**`
**Outputs:** stale/contradictory artifact report, current workstream dependency map, proposed new workstreams

### Lane C — Codebase Feature Ownership Audit
**Inputs:** `src/lib/**`, `src/tools/**`, `src/hooks/**`, `src/plugin.ts`
**Outputs:** module ownership matrix, dead/overlapping/conflicting libs, lifecycle ownership map

### Lane D — OpenCode Runtime Integration Research
**Inputs:** OpenCode docs (commands, plugins, hooks, compaction hooks, events, SDK, server API)
**Outputs:** verified API patterns, hook/event integration opportunities, limitations, runtime lifecycle map

### Lane E — Product Detox Concept Extraction
**Inputs:** `product-detox/.archive/**` (concepts only, not code)
**Outputs:** concept inventory, reusable patterns, rejected patterns, stale/outdated stack warnings

---

## What NOT To Do Yet

Do **not** immediately:
- implement `.hivemind/configs.json`
- rewrite delegation
- create sidecar settings
- migrate `.planning` into `.hivemind/plannings`
- copy code from `product-detox`
- add more agents/skills/commands
- patch only the 6 UAT findings
- build auto-commands before primitive registry is fixed

All of those are dependent work.

---

## Recommended Next Actions

### Immediate (No Dependencies)
1. **Unblock HER-3** — Context & Compaction is blocked on HER-2 (COMPLETE). Investigate blocker.
2. **Execute HER-4** — SDK Integration Depth is READY. Proceed with hook write-safety and delegation depth.
3. **Execute HER-5** — Agent Rationalization is READY. Proceed with agent overlap reduction.

### Short-Term (After HER-3/4/5)
4. **Create WS-1** — `.hivemind` State + Planning Architecture. Design canonical structure before tools write more state.
5. **Audit Governance Documents** — Run Lane B to identify stale/contradictory artifacts.

### Medium-Term (After WS-1)
6. **Create WS-3** — Primitive Registry / Control Pane. All later work depends on this.
7. **Create WS-2** — Bootstrap / CLI / Init / Onboarding. Make the harness installable.

### Long-Term (After WS-3)
8. **Create WS-4** — Auto-Commands / Workflow Router. Turn prompts into routed workflows.
9. **Create WS-5** — Delegation Revamp. Rebuild delegation as practical ecosystem.
10. **Create WS-6** — Trajectory / Task-Plus / Continuity. Make task lifecycle persistent.
11. **Create WS-7** — Context / Event Tracker / Compaction. Replace noisy capture with useful memory.
12. **Create WS-8** — Sidecar + User Configuration UI. Prepare GUI/sidecar layer.

---

## References to On-Disk Artifacts

### Primary Governance Documents
- `.planning/PROJECT.md` — Project definition
- `.planning/STATE.md` — Current state
- `.planning/ROADMAP.md` — Roadmap
- `.planning/codebase/ARCHITECTURE.md` — Architecture
- `.planning/codebase/STACK.md` — Tech stack
- `.planning/codebase/TESTING.md` — Testing strategy
- `.planning/codebase/CONCERNS.md` — Known concerns
- `.planning/codebase/INTEGRATIONS.md` — Integration points
- `.planning/codebase/CONVENTIONS.md` — Naming conventions
- `.planning/codebase/STRUCTURE.md` — Directory structure

### Workstream-Specific Documents
- `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md` — HER workstream roadmap
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md` — HER-0 summary
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-1-doc-config-recovery/HER-1-CONTEXT.md` — HER-1 context
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-CONTEXT.md` — HER-2 context

### Reference Skeleton
- `.planning/SKELETON-F0R-INTEGRATED-SYSTEMATIC-APPROACH.md` — Original skeleton (70% correct)

### Poor Prompt (Source)
- `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md` — Original disorganized prompt

### UAT Evidence
- `.hivemind/uat/team-b/results/` — All batch result files
- `.hivemind/uat/team-b/UAT-MASTER-PLAN-2026-05-05.md` — Master UAT plan

### Legacy Concepts
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.archive/` — Legacy code (concepts only)

### OpenCode Ecosystem
- `.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md` — Curated ecosystem projects

---

## Self-Check: SKELETON FRAMEWORK

✅ All issues from poor prompt classified by 4 paths × 2 lineages
✅ Mapped to existing HER-0 through HER-5 phases
✅ Identified gaps not covered by existing workstreams
✅ Proposed 8 new workstreams (WS-1 through WS-8) with dependency order
✅ Referenced on-disk artifacts and governance documents
✅ Created research lanes for pre-implementation validation
✅ Established what NOT to do yet (prevents premature implementation)
✅ Recommended next actions with dependency ordering

**Status:** SKELETON FRAMEWORK COMPLETE. Ready for user review and authorization before creating detailed phase plans.

---

*This skeleton transforms the disorganized poor prompt into a structured, hierarchical framework. It does NOT implement anything — it only maps, classifies, and proposes. All implementation requires user authorization and detailed phase planning.*
