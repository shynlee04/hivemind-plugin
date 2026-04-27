<!-- generated-by: gsd-doc-writer -->

# Phase SE-2: Complete Planning Pipeline Replacement — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-2
**Depends on:** SE-1 (renames complete, references clean)
**Status:** AUTHORIZED — ready for planning
**Created:** 2026-04-28
**Replaces:** Previous SE-2-CONTEXT.md (scoped too narrowly — single skill replacement)

<domain>
## Phase Boundary

SE-2 creates a **complete self-contained planning pipeline** that replaces GSD's entire discuss → research → plan → execute → verify → review → ship flow with 8+ new `hm-*` skills. This is NOT a single skill replacement — it is the construction of an entire pipeline from project initialization through PR shipping.

The pipeline is **fully self-contained within hm-* skills** using OpenCode's native capabilities. It produces structured artifacts consumed skill-to-skill in a chain pattern. No GSD skills, commands, agents, or artifacts are involved. No external framework dependencies.

All planning artifacts are stored in `.hivemind/` at project root per the Q6 decision (`.opencode/` is ONLY for OpenCode primitives — agents, commands, skills).

Additionally, SE-2 fixes all 9 existing skills that have broken references to the disabled `hm-planning-with-files`, unblocking coordination, debugging, phase execution, and refactoring workflows that have been hard-blocked since the skill was disabled.

### Scope IN
1. Create 8+ new hm-* pipeline skills (D-01, D-06)
2. Fix 9 existing skills' broken references to `hm-planning-with-files` (D-05)
3. Archive `donotusethis-hm-planning-with-files` directory
4. All artifacts stored in `.hivemind/` per Q6 (D-03)
5. Structured directory tree persistence model (D-04)
6. Code review + ship as pipeline stages (D-07)
7. Pipeline chain integration model (D-08)

### Scope OUT
- Gate-* skills (internal to this project, not shipped)
- Research chain modifications (already works)
- Spec-driven-authoring / TDD body modifications (reference fixes only)
- hf-* lineage skills (separate concern)
- Agent synthesis (separate workstream)

</domain>

<decisions>
## Implementation Decisions

### D-01: Scope = Full Pipeline Replacement

SE-2 creates 8+ new hm-* skills that replace GSD's entire planning flow (discuss → research → plan → execute → verify → review → ship). This is NOT a single `hm-artifact-hierarchy` skill replacement — that was the original narrow scope which has been expanded after user discussion.

**Rationale:** A single skill cannot express the full lifecycle. Each pipeline stage has distinct inputs, outputs, and failure modes. The chain model (D-08) keeps each skill focused and testable.

### D-02: Self-Contained Pipeline

The pipeline works ENTIRELY within hm-* skills using OpenCode's native capabilities. No GSD skills, commands, agents, or artifacts are used or referenced. The pipeline does not depend on gate-* skills (those are internal-only to this project).

**Rationale:** Users should be able to run the full planning lifecycle with only the hm-* skills installed. No external framework coupling.

### D-03: Artifact Storage = .hivemind/ (Q6 Native)

All planning artifacts are stored in `.hivemind/` at project root. This is a clean break from GSD's `.planning/` structure. Per Q6 decision locked 2026-04-25: `.opencode/` is ONLY for OpenCode primitives (agents, commands, skills). All internal deep module state writes to `.hivemind/`.

**Source:** `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Q6 decision

**Storage layout:**
```
.hivemind/
├── project/           ← hm-project-init creates this
│   ├── PROJECT.md
│   └── REQUIREMENTS.md
├── roadmap/           ← hm-roadmap-manager creates this
│   ├── ROADMAP.md
│   └── phases/
├── tasks/             ← hm-planning-persistence creates this
│   └── {task-id}/
│       ├── metadata.json
│       ├── state.md
│       └── artifacts/
│           └── plan.md
├── state/             ← existing (continuity, delegations)
├── journal/           ← existing (session journal)
├── research/          ← existing (research artifacts)
└── event-tracker/     ← existing (session events)
```

### D-04: Persistence Model = Structured Directory Tree

Each task gets its own directory with `metadata.json`, `state.md`, `artifacts/`. This is more filesystem-heavy than GSD's flat-file approach but provides:
- Clear navigation (each task is self-contained)
- Atomic state (metadata + state + artifacts co-located)
- Easy cleanup (remove directory = remove task)
- Git-friendly (each task is a coherent commit unit)

**Convention:** Task IDs are human-readable slugs: `{phase-slug}-{sequence}` (e.g., `SE-2-001`).

### D-05: Fix Broken References Too

SE-2 also fixes all 9 existing skills that have broken references to the disabled `hm-planning-with-files`. Without this fix, the following skills are hard-blocked or degraded:

| Skill | Severity | Reference Type |
|-------|----------|----------------|
| hm-coordinating-loop | HARD-BLOCKED | 5 references — requires planning-with-files loaded, reads task_plan.md |
| hm-user-intent-interactive-loop | DEGRADED | 3 references — routes to planning-with-files after probe |
| hm-spec-driven-authoring | DEGRADED | 2 references — multi-session plan state |
| hm-test-driven-execution | DEGRADED | 3 references — RED/GREEN/REFACTOR status persistence |
| hm-completion-looping | DEGRADED | 1 reference — verification status updates |
| hm-subagent-delegation-patterns | DEGRADED | 1 reference — task scope convention |
| hm-phase-execution | DEGRADED | 1 reference — phase plan tracking |
| hm-debug | DEGRADED | 1 reference — debug session state |
| hm-refactor | DEGRADED | 1 reference — refactor step tracking |

**Fix approach:** Replace `hm-planning-with-files` references with `hm-planning-persistence` (the new persistence skill). For hm-coordinating-loop, the hard-block is removed because the new pipeline provides equivalent functionality.

**Also:** `hm-meta-builder` has 1 reference to `planning-with-files` in its routing table — update to new pipeline entry point.

### D-06: Naming Convention = Verbose Descriptive

Skills use descriptive names that clearly communicate their pipeline role:

| Pipeline Stage | Skill Name | Purpose |
|----------------|------------|---------|
| Init | `hm-project-init` | Creates `.hivemind/project/` with PROJECT.md, REQUIREMENTS.md |
| Roadmap | `hm-roadmap-manager` | Creates `.hivemind/roadmap/` with ROADMAP.md, phases/ |
| Task Persistence | `hm-planning-persistence` | Creates `.hivemind/tasks/{id}/` with metadata, state, artifacts |
| Plan Generation | `hm-plan-generator` | Produces structured plan.md (tasks, waves, dependencies) |
| Execution | `hm-phase-orchestrator` | Dispatches plan tasks to subagents, manages waves |
| Code Review | `hm-code-review` | Reviews changed files, produces review findings |
| UAT Verification | `hm-uat-verify` | User-facing acceptance testing |
| Shipping | `hm-ship` | Creates PR from verified changes |

### D-07: Code Review + Ship = Included in Pipeline

Code review and PR shipping are part of the core pipeline, not optional extras. Every plan that modifies code goes through review → verify → ship in sequence.

**Rationale:** Quality is not optional. If review or verification fails, the pipeline stops and routes to hm-debug or hm-refactor for remediation.

### D-08: Integration Model = Pipeline Chain

Each skill produces structured artifacts the next skill consumes. No hub-and-spoke monolith. The integration pattern is:

```
Skill A produces artifact X at known path
    → Skill B reads artifact X from known path
    → Skill B produces artifact Y at known path
    → Skill C reads artifact Y...
```

**Contract:** Each skill declares its inputs (what it reads) and outputs (what it writes) in SKILL.md frontmatter. Skills do NOT call other skills directly — they produce artifacts that downstream skills consume.

</decisions>

<specifics>
## Pipeline Flow (Locked)

```
USER INTENT
    │
    ▼
hm-user-intent-interactive-loop ──→ (EXISTING) Clarifies intent via interactive QA
    │
    ▼
hm-project-init ──→ Creates .hivemind/project/ (PROJECT.md, REQUIREMENTS.md)
    │
    ▼
hm-roadmap-manager ──→ Creates .hivemind/roadmap/ (ROADMAP.md, phases/)
    │
    ▼
[per phase loop:]
    │
    ├─→ hm-planning-persistence ──→ .hivemind/tasks/{id}/ (metadata.json, state.md, artifacts/)
    │                                    ↑ Consumed by all downstream skills
    │
    ├─→ hm-plan-generator ──→ .hivemind/tasks/{id}/artifacts/plan.md
    │        │                     ↑ Consumes: hm-deep-research, hm-spec-driven-authoring
    │        │
    │        │  (research phase: hm-research-chain → hm-deep-research → hm-synthesis)
    │        │  (spec phase: hm-spec-driven-authoring locks requirements)
    │        │
    ├─→ hm-phase-orchestrator ──→ Dispatches plan tasks to subagents, manages waves
    │        │                        ↑ Consumes: plan.md tasks/waves
    │        │                        ↑ Links to: hm-subagent-delegation-patterns, hm-completion-looping
    │        │
    │        │  (per-task execution: hm-test-driven-execution, hm-refactor as needed)
    │        │  (error recovery: hm-debug for investigation)
    │        │
    ├─→ hm-code-review ──→ Reviews changed files, produces review findings
    │        │                  ↑ Consumes: list of changed files from orchestrator
    │        │
    ├─→ hm-uat-verify ──→ User-facing acceptance testing
    │        │              ↑ Consumes: review findings (must pass), plan.md (acceptance criteria)
    │        │
    └─→ hm-ship ──→ Creates PR from verified changes
                     ↑ Consumes: UAT pass result, changed files
```

## Existing Skills That Integrate (Carry Forward)

These skills are already functional and participate in the pipeline as linked capabilities:

| Skill | Pipeline Link | Integration Point |
|-------|--------------|-------------------|
| hm-user-intent-interactive-loop | Upstream of project-init | Routes clarified intent to pipeline entry |
| hm-spec-driven-authoring | Links to plan-generator | Spec-locking from requirements before plan generation |
| hm-test-driven-execution | Links to phase-orchestrator | RED/GREEN/REFACTOR for individual plan tasks |
| hm-debug | Links to phase-orchestrator | Error recovery when task execution fails |
| hm-refactor | Links to phase-orchestrator | Surgical/structural refactoring for plan tasks |
| hm-deep-research | Links to plan-generator | Version-matched research for plan context |
| hm-detective | Utility for research | Codebase investigation (used by research chain) |
| hm-synthesis | Utility for research | Research compression (used by research chain) |
| hm-research-chain | Links to plan-generator | Orchestrates research pipeline before plan generation |
| hm-completion-looping | Links to phase-orchestrator | Guardrail against premature completion claims |
| hm-subagent-delegation-patterns | Links to phase-orchestrator | Delegation dispatch patterns for wave execution |
| hm-phase-loop | Links to phase-orchestrator | Iterative loop guard for multi-plan phases |

## Artifact Contracts

Each pipeline skill must declare its I/O contract in SKILL.md:

| Skill | Reads | Writes |
|-------|-------|--------|
| hm-project-init | User intent (from conversation) | `.hivemind/project/PROJECT.md`, `.hivemind/project/REQUIREMENTS.md` |
| hm-roadmap-manager | `.hivemind/project/PROJECT.md` | `.hivemind/roadmap/ROADMAP.md`, `.hivemind/roadmap/phases/` |
| hm-planning-persistence | Task description (from conversation) | `.hivemind/tasks/{id}/metadata.json`, `.hivemind/tasks/{id}/state.md` |
| hm-plan-generator | `.hivemind/tasks/{id}/`, research artifacts | `.hivemind/tasks/{id}/artifacts/plan.md` |
| hm-phase-orchestrator | `.hivemind/tasks/{id}/artifacts/plan.md` | Updated `state.md`, execution results |
| hm-code-review | Changed file list | `.hivemind/tasks/{id}/artifacts/review.md` |
| hm-uat-verify | `.hivemind/tasks/{id}/artifacts/review.md`, plan.md | `.hivemind/tasks/{id}/artifacts/uat-result.md` |
| hm-ship | UAT pass result, changed files | PR URL, commit SHA |

</specifics>

<canonical_refs>
## Canonical References

- **Q6 Decision (storage root):** `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — lines 230-260
- **Architecture Proposal:** `docs/draft/architecture-proposal-hivemind-v3.md` — full harness architecture
- **Skills Playbook:** `.hivefiver-meta-builder/skills-lab/active/refactoring/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` — lineage model, RICH gates
- **SE-1 CONTEXT (predecessor):** `.planning/workstreams/skill-ecosystem/phases/SE-1-skill-reclassification-cleanup/SE-1-CONTEXT.md` — skill classification decisions
- **Workstream ROADMAP:** `.planning/workstreams/skill-ecosystem/ROADMAP.md` — phase dependencies
- **Workstream STATE:** `.planning/workstreams/skill-ecosystem/STATE.md` — current progress
- **AGENTS.md:** Root `AGENTS.md` — project structure, dependency rules, canonical skill location
- **Existing .hivemind/ structure:** `.hivemind/` — event-tracker/, state/, journal/, research/, lineage/
- **Disabled skill:** `.opencode/skills/donotusethis-hm-planning-with-files/` — reference for persistence patterns to improve upon
- **Broken reference grep evidence:** 20 references across 9 skills + hm-meta-builder (see code_context)

</canonical_refs>

<code_context>
## Existing Code Insights

### What Already Works
The following hm-* skills are functional and integrate with the pipeline:
- **Research chain** (hm-research-chain → hm-deep-research → hm-synthesis → hm-detective) — complete and working
- **Spec-driven-authoring** — spec-locking from requirements, working
- **TDD execution** — RED/GREEN/REFACTOR, working
- **Completion looping** — guardrail against premature claims, working
- **Phase loop** — iterative loop guard, working
- **Subagent delegation patterns** — dispatch patterns, working

### What's Broken
`hm-planning-with-files` is disabled (directory renamed to `donotusethis-hm-planning-with-files`). 20 references across 9 skills + hm-meta-builder point to it:

**Hard-blocked (cannot function without replacement):**
- `hm-coordinating-loop` — 5 references, requires planning-with-files loaded as prerequisite

**Degraded (work but lose persistence/continuity):**
- `hm-user-intent-interactive-loop` — 3 references
- `hm-test-driven-execution` — 3 references
- `hm-spec-driven-authoring` — 2 references
- `hm-completion-looping` — 1 reference
- `hm-subagent-delegation-patterns` — 1 reference
- `hm-phase-execution` — 1 reference
- `hm-debug` — 1 reference
- `hm-refactor` — 1 reference
- `hm-meta-builder` — 1 reference (routing table)

### Integration Points
The new pipeline skills must integrate with existing hm-* skills through artifact contracts (not direct skill calls). Each new skill declares what it reads and writes in its SKILL.md, and existing skills are updated to reference the new persistence skill instead of the disabled one.

### .hivemind/ Existing Structure
The `.hivemind/` directory already exists with:
- `state/` — session-continuity.json, delegations.json, task_plan.md, progress.md, findings.md
- `journal/` — session journal (append-only event timeline)
- `research/` — research artifacts from skills-audit
- `event-tracker/` — session events
- `lineage/` — lineage tracking
- `daily-notes/` — daily developer notes

The new pipeline adds `project/`, `roadmap/`, and `tasks/` directories under `.hivemind/`.

</code_context>

<deferred>
## Deferred Ideas

The following are explicitly OUT OF SCOPE for SE-2 and belong to later phases:

| Idea | Destination | Reason |
|------|-------------|--------|
| Gate-* skills creation | SE-5.5 | Internal to this project, not shipped to users |
| Research chain modifications | SE-4 | Already works, enhancement is separate |
| Spec-driven-authoring body changes | Reference fix only (SE-2) | Working skill, only references need updating |
| TDD execution body changes | Reference fix only (SE-2) | Working skill, only references need updating |
| hf-* lineage skills | SE-6 | Separate concern (meta-builder lineage) |
| Agent synthesis | Separate workstream | Independent research track |
| Pre-gate skills (brainstorm, requirements) | SE-3 | Different pipeline stage concerns |
| Feature ecosystem skills | SE-3.5 | Different concern (cross-dependency design) |
| Tech stack ingestion | SE-4 | Research pipeline concern |
| Gate orchestration + lineage routing | SE-5 | After all pipeline skills exist |
| RICH gate reauthorization of all skills | SE-7 | Verification after all changes complete |

</deferred>
