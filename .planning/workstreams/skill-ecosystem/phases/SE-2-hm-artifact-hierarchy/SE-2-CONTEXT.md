# Phase SE-2: hm-artifact-hierarchy — Planning Pipeline Foundation — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-2
**Depends on:** SE-1 (skill renames complete, references clean)
**Created:** 2026-04-28
**Status:** AUTHORIZED

## Domain

SE-2 is the **FOUNDATION phase** for the entire 8-skill planning pipeline (N1-N8). It creates the persistence backbone, defines the artifact hierarchy, establishes the `.hivemind/` state architecture, and provides the state management layer that ALL downstream skills (SE-3 through SE-7) build on.

This is NOT a "fix broken references" phase. It is the architectural foundation for replacing GSD's entire planning flow with Hivemind-native hm-* skills.

## Authorized Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| **State root** | `.hivemind/` (Q6) | Hivemind-native. Clean separation from `.opencode/` primitives and `.planning/` (GSD compat). |
| **Coordinating loop** | Soft boundary — remove hard `verify-hierarchy.sh` dependency | Unblocks hm-coordinating-loop. Graceful fallback to in-memory state if persistence not loaded. |
| **Skill prefix** | All new pipeline skills are `hm-*` | Product/runtime lineage per playbook. Ship with Hivemind harness. |
| **Internal vs Shipped** | gate-* skills remain INTERNAL-USE only. hm-* skills SHIP with harness. | Gate skills serve THIS project's quality gatekeeping. |
| **Artifact promotion** | .scratch → .research → .planning → .verified with promotion gates | Modeled on GSD's proven artifact pipeline, adapted for .hivemind/ |

## Problem

The existing hm-* planning pipeline is broken in three ways:

1. **Persistence broken:** `hm-planning-with-files` is disabled. 9 SHIP (hm-*) skills reference it as their state backbone. Without replacement, ALL multi-session capability is broken.

2. **No pipeline exists:** GSD commands (discuss-phase, plan-phase, execute-phase, code-review, verify-work, ship, autonomous) handle the planning flow that hm-* skills should handle. The hm-* skills cover research and execution but no complete planning pipeline exists.

3. **No routing hierarchy:** There's no structure for how skills route to each other — brainstorm → requirements → spec → research → plan → execute → verify → ship. Skills are flat, not hierarchical.

## The Complete Pipeline (SE-2 through SE-7)

This phase (SE-2) establishes the foundation. The full pipeline spans 9 phases:

```
SE-2 (FOUNDATION)
  hm-artifact-hierarchy (persistence backbone)
  |
  ├── SE-3 (INPUT — Pre-Gate Skills)
  │   hm-brainstorm → hm-requirements-analysis
  │   hm-cross-cutting-change → hm-tech-context-compliance
  │
  ├── SE-3.5 (FEATURE ECOSYSTEM — Product & Production)
  │   hm-feature-ecosystem → hm-production-readiness
  │   hm-roadmap-maintainability
  │
  └── SE-4 (RESEARCH)
      hm-tech-stack-ingest + research chain fixes
  |
  SE-5 (ROUTING)
  hm-gate-orchestrator + hm-lineage-router
  |
  SE-5.5 (INTERNAL GATE HARDENING)
  gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance
  |
  SE-6 (META-BUILDER)
  hf-config-workflow + hf-agent-synthesizer
  |
  SE-7 (VERIFICATION)
  Full ecosystem integration test
```

SE-3, SE-3.5, and SE-4 can run in PARALLEL after SE-2 foundation is laid. All converge at SE-5.

## Scope (WHAT — locked for SE-2)

### Artifact Hierarchy Design
Define the complete artifact model for `.hivemind/`:
- **Artifact types:** session-journal, execution-lineage, task-plan, findings, progress, state-continuity, decisions, deferred-ideas
- **Promotion gates:** `.scratch/` → `.research/` → `.planning/` → `.verified/`
- **Naming conventions:** kebab-case, date-stamped, bounded-size
- **State format:** JSON for machine readability, Markdown for human audit
- **Session recovery protocol:** checkpoint → resume → replay

### Persistence Layer
Create the skill that provides:
- Task plan persistence (structured tasks with dependencies, waves, status)
- Findings/evidence storage (research outputs, decisions)
- Progress tracking (phase completion, plan completion, verification state)
- Session continuity (what was running, where to resume)
- Execution lineage (what happened, in what order, with what results)

### .hivemind/ State Structure
```
.hivemind/
  state/
    session-continuity.json    # Cross-session state (active phase, resume points)
    task-plan.json              # Active task plan (waves, tasks, dependencies, status)
    findings.json               # Research findings and evidence
    progress.json               # Phase/plan/task completion tracking
    decisions.json              # Locked user decisions
    delegations.json            # Active delegation records
    lineage/                    # Execution lineage (append-only event log)
      latest.json               # Current lineage cursor
      archive/                  # Completed lineage segments
    journals/                   # Session journals (append-only)
      <session-id>.jsonl        # Per-session events
  memory/                       # Advanced memory (post-MVP)
    vector/                     # Vector embeddings (post-MVP)
    graph/                      # Knowledge graph (post-MVP)
```

### 9 REPLACED Skill References
The following existing hm-* skills reference the disabled `hm-planning-with-files`. SE-2 replaces those references to use `hm-artifact-hierarchy` instead. These skills are then candidates for RICH-gate reauthorization in SE-7:

| Skill | Nature of Replacement |
|-------|-----------------------|
| **hm-coordinating-loop** | HARD dependency → soft boundary (remove verify-hierarchy.sh, add graceful fallback to in-memory) |
| **hm-user-intent-interactive-loop** | planning-with-files → hm-artifact-hierarchy for multi-session intent state |
| **hm-spec-driven-authoring** | planning-with-files → hm-artifact-hierarchy for spec persistence |
| **hm-test-driven-execution** | planning-with-files → hm-artifact-hierarchy for test state |
| **hm-completion-looping** | planning-with-files → hm-artifact-hierarchy for plan tracking |
| **hm-subagent-delegation-patterns** | task_plan.md → hm-artifact-hierarchy task-plan |
| **hm-phase-execution** | planning-with-files → hm-artifact-hierarchy for phase state |
| **hm-debug** | planning-with-files → hm-artifact-hierarchy for session state |
| **hm-refactor** | planning-with-files → hm-artifact-hierarchy for task planning |

### Archive
- `donotusethis-hm-planning-with-files`: Add deprecation note pointing to `hm-artifact-hierarchy`

### RICH Compliance
- `hm-artifact-hierarchy` SKILL.md must pass RICH-1 through RICH-8
- Must include: frontmatter (name, description, triggers), boundary rules table, files_to_read with full paths, schematic/example/best-practice sections, bundled scripts if applicable, evals.json with test scenarios, skill-judge scorecard

## Constraints
- Language-agnostic, framework-independent
- Must not hardcode paths — use environment variable overrides (OPENCODE_HARNESS_STATE_DIR)
- Must work with both GSD `.planning/` and Hivemind `.hivemind/` state roots
- hm-* prefix: shared/cross-lineage per playbook

## Cross-Phase Impact (SE-3 through SE-7)

| Phase | Impact of SE-2 |
|-------|----------------|
| **SE-3** (Pre-Gate Skills) | 4 new skills use hm-artifact-hierarchy for artifact persistence. Must follow the artifact model defined here. |
| **SE-4** (Research Pipeline) | hm-tech-stack-ingest stores bundled repos in `.hivemind/memory/`. Research findings use hm-artifact-hierarchy format. |
| **SE-5** (Gate Orchestration) | hm-gate-orchestrator reads/writes verdicts to `.hivemind/state/`. Lineage router uses `.hivemind/state/` for routing decisions. |
| **SE-5.5** (Gate Hardening) | Gate skills must accept `.hivemind/` paths as evidence sources. Must not hardcode project-local paths. |
| **SE-6** (Meta-Builder) | hf-config-workflow uses `.hivemind/` for session/task state during configuration. |
| **SE-7** (Verification) | Integrates all SE-2 through SE-6 skills into full pipeline test. |

## Canonical References

- `AGENTS.md` — Project rules, dependency constraints, skill classification
- `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Q6 (.hivemind/ state root)
- `.opencode/skills/donotusethis-hm-planning-with-files/SKILL-DISABLED.md` — The disabled skill being replaced
- `.planning/research/SKILL-ECOSYSTEM-GAP-ANALYSIS-2026-04-27.md` — Complete gap analysis (Part 3: N1-N8)
- `.planning/RICH-AUDIT-HM-SKILLS-REPORT.md` — RICH audit results for all skills
- `.planning/workstreams/skill-ecosystem/ROADMAP.md` — Phase breakdown

## Deferred Ideas

- RICH gate reauthorization of existing SHIP (hm-*) skills → SE-7
- Vector memory / knowledge graph → post-MVP (Q4)
- Full automated skill-judge integration → post-MVP