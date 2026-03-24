# Batch: Writing Skill

**Purpose**: Plan engineering, spec creation, task breakdown, and universal skill design for structured execution pipelines.
**Governance**: All skills in this batch share the principle that structured output before execution — no plan proceeds without validation, no spec proceeds without ambiguity resolution, no skill ships without universal applicability proof.

## Skills

| Skill | Entry Point | Purpose | Dependencies |
|-------|------------|---------|--------------|
| spec-distillation | SKILL.md | Transforms noisy/contradictory/incomplete requirements into structured spec candidates via extraction, ambiguity mapping, clarification loop, and candidate generation | hivemind-research (for evidence resolution) |
| hivemind-codemap | SKILL.md | Whole-codebase structural mapping via quick/deep/exhaustive scan levels with seam discovery, hotspot detection, and batch-audit loops | use-hivemind-delegation (for handoff discipline) |
| plan-engineering | SKILL.md | Plan lifecycle management: create, validate, version, and retire plans with structured metadata, phase gates, and approval checkpoints | spec-distillation (for validated inputs), use-hivemind-delegation (for execution dispatch) |
| plan-breakdown | SKILL.md | Task decomposition from validated plans: split epics into features, features into stories, stories into testable tasks with dependency ordering | plan-engineering (for plan contracts), hivemind-codemap (for scope bounding) |
| skill-universal-design | SKILL.md | Cross-platform skill pattern authoring: ensures skills work across Claude Code, Cursor, Gemini CLI, and OpenCode via abstraction layers and adapter patterns | use-hivemind-delegation (for validation dispatch) |

## Cross-Cutting Concerns

- **Planning lifecycle**: spec-distillation produces validated specs → plan-engineering turns specs into versioned plans → plan-breakdown decomposes plans into ordered tasks. Each stage has a validation gate; no stage proceeds without the prior stage's gate passing.
- **Universal design enforcement**: skill-universal-design validates that every skill authored through this pipeline produces a SKILL.md that works across target platforms — cross-platform proof is a shipping requirement, not an afterthought.
- **Shared contract keys**: All skills share identity fields (`ses_id`, `task_id`, `pass_id`, `batch_id`, `packet_id`), routing fields (`activity_type`, `phase_type`, `mode`), evidence fields (`confirmed`, `inferred`, `unverified`, `confidence`), and plan fields (`plan_id`, `plan_version`, `gate_status`).
- **Activity folder convergence**: All skills write to `{project}/.hivemind/activity/` — plan artifacts go to `plans/`, breakdown outputs to `delegation/`, codemap scans to `codescan/`, and skill design artifacts to `agents/{name}/{pass_id}/`.
- **No execution without plan**: plan-engineering enforces that no task from plan-breakdown enters the execution queue without a validated plan_id — orphan tasks are rejected at the delegation boundary.
- **Codebase grounding**: hivemind-codemap provides structural context that both plan-engineering and plan-breakdown consume to ensure plans reference real codebase seams, not hypothetical architecture.

## Integration Points

- **Connects to batch-skill-judge** via plan validation gates: plan-engineering emits `gate_status` that tdd-phase-execution reads before starting any TDD cycle. If plan gate is `pending` or `rejected`, TDD phases are blocked.
- **Connects to batch-skill-review** via git memory anchors: plan-engineering records `plan_id` in commit metadata (via hivemind-atomic-commit), and git-continuity-memory retrieves plan lineage when resuming across sessions.
- **Spec distillation feeds planning**: spec-distillation outputs (`spec_candidates` with ambiguity grades) are the input contract for plan-engineering — plans that reference specs without passing ambiguity resolution are flagged as `unverified`.
- **Codemap grounds breakdown**: plan-breakdown queries hivemind-codemap's seam inventory to ensure task decomposition targets real code surfaces rather than hypothetical module boundaries.
- **Universal design gates skill shipping**: skill-universal-design's cross-platform proof is the final gate before any skill leaves this pipeline — it connects to use-hivemind-skill-writer (in batch-context-integrity lineage) for SKILL.md template validation.
- **Delegation ecosystem integration**: all skills in this batch dispatch through use-hivemind-delegation — plan-engineering delegates validation probes, plan-breakdown delegates task enumeration, and skill-universal-design delegates platform compatibility checks.
