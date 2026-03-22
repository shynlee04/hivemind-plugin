# Batch: HiveMind Context

**Purpose**: Orchestrates delegation, codebase mapping, debugging, detox routing, and requirements distillation for framework recovery work.
**Governance**: All skills in this batch share the principle that the orchestrator routes and synthesizes — deep work is always delegated to subagents with bounded scope and return contracts.

## Skills

| Skill | Entry Point | Purpose | Dependencies |
|-------|------------|---------|--------------|
| use-hivemind-delegation | SKILL.md | Core delegation: decision rules, packets, role boundaries, basic failure recovery, codescan delegation, session resume | context-intelligence-entry (stale session probe) |
| hivemind-gatekeeping-delegation | SKILL.md | Iterative loop control, synthesis gates, carry-forward compression, integration verification, cascading failure | use-hivemind-delegation |
| tdd-delegation | SKILL.md | TDD loop delegation, test gate enforcement, build-verify cycles, test-first packet design | use-hivemind-delegation |
| course-correction-delegation | SKILL.md | Debug/refactor/audit delegation patterns, domain-specific escalation, course correction | use-hivemind-delegation |
| research-delegation | SKILL.md | Evidence collection delegation, source validation, multi-source synthesis, research thread management | use-hivemind-delegation, hivemind-research-framework |
| hivemind-codemap | SKILL.md | Whole-codebase structural mapping via quick/deep/exhaustive scan levels with seam discovery, hotspot detection, and batch-audit loops | use-hivemind-delegation (for handoff discipline) |
| hivemind-system-debug | SKILL.md | Failure reproduction, systematic narrowing, containment posture, evidence classification, and debug-to-refactor transition rules | hivemind-codemap (for scope bounding), use-hivemind-delegation (for dispatch) |
| hivemind-atomic-commit | SKILL.md | File CRUD entry point with git integration — currently being refactored (no SKILL.md yet, directory contains references/scripts/templates stubs) | git-continuity-memory (commit anchors) |
| use-hivemind-detox-refactor | SKILL.md | Thin orchestrating router for 11-stage detox/refactor workflow — owns stage selection, branch-family routing, context budget enforcement, and synthesis checkpoints | All other skills in this batch |
| spec-distillation | SKILL.md | Transforms noisy/contradictory/incomplete requirements into structured spec candidates via extraction, ambiguity mapping, clarification loop, and candidate generation | hivemind-research (for evidence resolution) |

## Cross-Cutting Concerns

- **Delegation ecosystem**: 6 skills form the delegation surface — use-hivemind-delegation (core), hivemind-gatekeeping-delegation (loop control), tdd-delegation (test gates), course-correction-delegation (debug/audit), research-delegation (evidence). The core skill owns decision rules and packets; the 4 domain skills extend it with specialized dispatch patterns. All depend on use-hivemind-delegation as the shared base.
- **Delegation-first mandate**: use-hivemind-detox-refactor, hivemind-codemap, and hivemind-system-debug all enforce that the orchestrator never does deep reads or scans inline — all deep work is delegated through the delegation ecosystem.
- **Shared contract keys**: All skills share identity fields (`ses_id`, `task_id`, `pass_id`, `batch_id`, `packet_id`), routing fields (`activity_type`, `phase_type`, `mode`), evidence fields (`confirmed`, `inferred`, `unverified`, `confidence`), and cleanup gate fields (`surface_class`, `cleanup_allowed`).
- **Activity folder convergence**: All skills write to `{project}/.hivemind/activity/` — delegation outputs go to `delegation/`, codemap scans to `codescan/`, debug artifacts to `agents/{name}/{pass_id}/`, and session state to `sessions/`.
- **Sequential delegation default**: use-hivemind-detox-refactor and use-hivemind-delegation both enforce sequential delegation as the default; parallel delegation is gated and only authorized after Stage 4 partitioning produces isolated slices.
- **Pollution posture**: use-hivemind-detox-refactor carries the workspace-pollution warning that governs all skills in this batch — documents are advisory, code is truth, context rot is assumed until proven otherwise.
- **Phase ladder discipline**: hivemind-codemap's multi-pass scanning (high-level-map → pipeline-map → journey-map → low-level-proof → cross-pass-synthesis) must run phases in order — each deeper pass reads the previous phase synthesis first.

## Integration Points

- **Connects to batch-context-integrity** via use-hivemind-detox-refactor's Bundle A routing: context-intelligence-entry and context-entry-verify (from batch-context-integrity) are invoked at Stage 1, 2, 8, and 9 of the 11-stage workflow.
- **Git continuity bridges batches**: git-continuity-memory (batch-context-integrity) owns `sessions/continuity.json` that use-hivemind-detox-refactor reads at turn start to resume state. use-hivemind-delegation resumes prior subagent sessions via `task_id` from the same continuity checkpoint.
- **Research feeds distillation**: spec-distillation uses hivemind-research (batch-context-integrity) to resolve ambiguous requirements with graded evidence.
- **Debug consumes codemap output**: hivemind-system-debug receives bounded slices from hivemind-codemap's seam inventory before starting reproduction and narrowing.
- **Router delegates to all**: use-hivemind-detox-refactor is the single entry point that selects the correct branch family (context, delegation, git-memory, codemap, system-debug) based on stage and concern classification. The router dispatches through the delegation ecosystem — gatekeeping-delegation for iterative loops, tdd-delegation for build-verify cycles, course-correction-delegation for debug/audit, and research-delegation for evidence gathering.
- **hivemind-atomic-commit dependency**: Currently under refactoring — once complete, it will provide the file-level CRUD surface that Stage 8 (staged restoration) uses for bounded restorative changes, with git-continuity-memory providing commit anchors.
