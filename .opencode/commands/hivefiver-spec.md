---
description: Distill intake results into an unambiguous specification with acceptance criteria.
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh spec .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — what comes after spec):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh spec "$ARGUMENTS" .`

⛔ IF the gate check above shows "allowed": false — STOP. Report the reason to the user. DO NOT proceed.
</enforcement>

<objective>
Transform structured intake into a formal specification with measurable acceptance criteria.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Read STATE.md to find the intake summary from the intake stage.
Step 2: For each asset in the intake, produce:

- **Asset ID**: Unique identifier (e.g., `agent:code-reviewer`)
- **Description**: What it does (will become the `description` field)
- **Contract**: Required frontmatter fields, permission rules, scope paths
- **Acceptance criteria**: 3-5 measurable conditions that prove the asset works
- **Dependencies**: List of assets this depends on, with existence verification
- **Anti-patterns**: What this asset must NOT do (from blocked patterns G-01 through G-10)

Step 3: Run ambiguity check — any field marked "unclear" or "TBD" blocks this gate.
Step 4: Present spec to user for approval.
Step 5: On approval, update STATE.md Pipeline State:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed spec .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage architect .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
  ```
Step 6: Recommend /hivefiver-architect.

Step 7: Run runtime enforcement post-turn (MANDATORY):
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
  ```
  Include the output as evidence in your completion claim.
</process>

<quality_gate>
Gate 1 (Specification Integrity):
- [ ] All fields populated (no TBD)
- [ ] Acceptance criteria are measurable (not "should work well")
- [ ] Dependencies reference assets that exist on disk
- [ ] Anti-patterns from G-01 through G-10 addressed
</quality_gate>

<output_contract>
Return:
- spec_document: the formal specification
- acceptance_criteria: list of measurable conditions
- gate_1_passed: boolean
- next_command: /hivefiver-architect (if gate passed)
- must_pack: unified MUST obligations payload from hivefiver-must-pack.sh
- runtime_gate_post_turn: evidence output from runtime-gate.sh post-turn
</output_contract>

<guided_interaction>
At every step of the spec stage, the agent MUST announce:

1. **What I'm doing**: "I'm transforming your intake answers into a formal specification..."
2. **Spec preview**: "Here's the specification for [Asset ID]. Review each section:"
3. **Quality check**: "Gate 1 requires: no TBD fields, measurable criteria, valid dependencies. Current status: [pass/fail per criterion]"
4. **Ambiguity detection**: "I found [N] ambiguous fields: [list]. These must be resolved before proceeding."
5. **What comes next**: "Once you approve this spec, I'll design the architecture — file locations, dependencies, and permissions."

Present the spec as a structured document, not a wall of text. Highlight fields that need user attention.
</guided_interaction>
