# Batch: Skill Judge

**Purpose**: TDD enforcement, test gatekeeping, role boundary verification, and quality judgment for implementation workflows.
**Governance**: All skills in this batch share the principle that no implementation proceeds without tests, no phase transition without gate verification, no role boundary without enforcement.

## Skills

| Skill | Entry Point | Purpose | Dependencies |
|-------|------------|---------|--------------|
| tdd-delegation | SKILL.md | TDD loop delegation, test gate enforcement, build-verify cycles, test-first packet design | use-hivemind-delegation |
| hivemind-gatekeeping-delegation | SKILL.md | Iterative loop control, synthesis gates, carry-forward compression, integration verification, cascading failure | use-hivemind-delegation |
| agent-role-boundary | SKILL.md | Diamond role separation enforcement: orchestrator, executor, verifier, researcher, planner, and meta-builder boundaries with violation detection | use-hivemind-delegation (for boundary dispatch) |
| tdd-phase-execution | SKILL.md | Granular TDD per-phase execution: manages red→green→refactor cycles at the phase level with per-gate verification evidence and phase-specific test selection | tdd-delegation (for loop structure), hivemind-gatekeeping-delegation (for gate transitions) |
| test-gatekeeping-flow | SKILL.md | Test-first enforcement across workflows: ensures test existence before implementation, validates test quality (non-trivial, non-stubbed), and blocks phase progression without passing tests | tdd-delegation (for TDD contract), hivemind-gatekeeping-delegation (for gate verdicts) |

## Cross-Cutting Concerns

- **TDD at two levels**: tdd-delegation operates at the delegation level (designing TDD-aware packets, dispatching red-green-refactor loops to subagents) while tdd-phase-execution operates at the phase level (managing granular test selection, gate evidence, and per-phase verification). Together they enforce TDD from packet design through phase execution.
- **Test-first enforcement**: test-gatekeeping-flow is the cross-workflow gatekeeper — it intercepts any implementation attempt and verifies that tests exist, are non-trivial (no `assert(true)`), use real SDK surfaces (no stubs), and pass before implementation proceeds.
- **Gate synchronization**: hivemind-gatekeeping-delegation provides the generic gate mechanism (synthesis gates, integration verification, cascading failure recovery); tdd-phase-execution and test-gatekeeping-flow plug into it as TDD-specific gate providers.
- **Role boundary enforcement**: agent-role-boundary ensures that TDD execution stays within executor boundaries, gatekeeping stays within verifier boundaries, and no agent violates the Diamond role contract during multi-agent TDD workflows.
- **Shared contract keys**: All skills share identity fields (`ses_id`, `task_id`, `pass_id`, `batch_id`, `packet_id`), TDD fields (`tdd_phase`, `gate_status`, `test_count`, `pass_count`, `fail_count`), and role fields (`agent_role`, `boundary_violations`).
- **Evidence before verdict**: Every gate transition produces machine-parseable evidence — test output, type-check results, build logs — not free-form assessments. No gate passes without evidence.

## Integration Points

- **Connects to batch-writing-skill** via plan validation: tdd-phase-execution reads `gate_status` from plan-engineering before starting any TDD cycle. If the plan gate is not `approved`, TDD phases are blocked with a `plan_gate_pending` verdict.
- **Connects to batch-skill-review** via git commit gates: hivemind-atomic-commit (in batch-skill-review) requires test-gatekeeping-flow's `all_tests_pass` verdict before allowing a commit. git-continuity-memory records TDD phase metadata in commit messages.
- **Delegation base**: All 5 skills extend use-hivemind-delegation — tdd-delegation and hivemind-gatekeeping-delegation are direct domain extensions; agent-role-boundary, tdd-phase-execution, and test-gatekeeping-flow compose on top of them.
- **Gatekeeping feeds review**: hivemind-gatekeeping-delegation's integration verification outputs are consumed by batch-skill-review's hierarchy-retrace to reconstruct the decision tree that led to a commit.
- **Role boundaries cross batches**: agent-role-boundary validates that batch-writing-skill's plan-breakdown stays in planner scope, batch-skill-review's hivemind-atomic-commit stays in executor scope, and no orchestration agent performs implementation.
- **Test evidence chain**: tdd-phase-execution produces per-phase test evidence (`red_evidence`, `green_evidence`, `refactor_evidence`) that test-gatekeeping-flow aggregates into a final shipping verdict — this evidence chain is the quality contract for the entire implementation pipeline.
