---
name: hivefiver-architect
description: "Design asset topology, delegation policy, and dependency graph for framework assets."
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh architect .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — what comes after architect):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh architect "$ARGUMENTS" .`

⛔ IF the gate check above shows "allowed": false — STOP. Report the reason to the user. DO NOT proceed.
</enforcement>

<objective>
Transform a formal specification into an architecture: asset topology, file locations, delegation paths, dependency ordering, and permission constraints.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Read STATE.md to locate the approved specification from the spec stage.
Step 2: For each asset in the specification, determine:

- **File path**: exact location under `.opencode/` (agent, command, skill, or workflow)
- **Asset type**: agent | command | skill | workflow | template | reference
- **Dependencies**: which other assets must exist first (topological ordering)
- **Delegation policy**: who can invoke this asset, and with what permission constraints
- **Permission rules**: explicit allow/deny paths per the agent profile schema

Step 3: Produce a dependency graph showing build order:
- Assets with zero dependencies build first
- Parallel-eligible assets identified (zero file overlap + zero ordering dependency)
- Sequential constraints documented

Step 4: For each delegation path, verify:
- No recursive delegation (G-01)
- No wildcard permissions (G-02)
- No orphan aliases (G-03)
- Explicit error routing for failed steps

Step 5: Present architecture to user for review.
Step 6: On approval, update STATE.md Pipeline State:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed architect .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage build .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
  ```
Step 7: Recommend /hivefiver-build.

Step 8: Run runtime enforcement post-turn (MANDATORY):
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
  ```
  Include the output as evidence in your completion claim.
</process>

<quality_gate>
Gate 2 (Orchestration Integrity):
- [ ] Every asset has an explicit file path under `.opencode/`
- [ ] Dependency ordering is acyclic (no circular references)
- [ ] Parallel build candidates identified with isolation proof
- [ ] Delegation paths have explicit permission constraints
- [ ] No blocked anti-patterns (G-01 through G-10) in the design
</quality_gate>

<output_contract>
Return:
- architecture_document: topology map with file paths and dependency graph
- build_order: ordered list of assets to create
- delegation_policy: permission constraints per asset
- gate_2_passed: boolean
- next_command: /hivefiver-build (if gate passed)
- must_pack: unified MUST obligations payload from hivefiver-must-pack.sh
- runtime_gate_post_turn: evidence output from runtime-gate.sh post-turn
</output_contract>

<guided_interaction>
At every step of the architect stage, the agent MUST announce:

1. **What I'm doing**: "I'm designing the asset topology — where each file goes, what depends on what..."
2. **Architecture overview**: "This build requires [N] assets: [list]. Here's the dependency graph:"
3. **Build strategy**: "Build order: [ordered list]. [N] assets can be built in parallel, [M] must be sequential."
4. **Permission design**: "Each asset will have these permission constraints: [summary]. No wildcard permissions."
5. **What comes next**: "Once you approve this architecture, I'll create all [N] assets in the build stage."

Show the dependency graph visually (ASCII or table). Highlight any design decisions that need user input.
</guided_interaction>
