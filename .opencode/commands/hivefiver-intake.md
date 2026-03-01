---
name: hivefiver-intake
description: "Gather structured requirements for a framework asset build request."
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh intake .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — what comes after intake):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

User profile (auto-executed — adapts question delivery):
!`bash .opencode/skills/hivefiver-mode/scripts/guided-discovery.sh "$ARGUMENTS"`

Deterministic journey QA pack (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh auto L1 medium`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh intake "$ARGUMENTS" .`

⛔ IF the gate check above shows "allowed": false — STOP. Report the reason to the user. DO NOT proceed.
</enforcement>

<objective>
Collect structured, QA-ready inputs that define what framework asset(s) the user needs built and why.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Read STATE.md to understand what was classified in the start stage.
Step 2: Use the deterministic journey QA pack from the enforcement block to seed questions.
Step 3: Ask structured questions using the question tool. Required inputs:

1. **Asset type**: agent | command | skill | workflow | template (or combination)
2. **Asset purpose**: What does this asset DO? (1-2 sentences)
3. **Target users**: Who will use this asset? (agents, humans, both)
4. **Scope boundaries**: What is IN scope and OUT of scope?
5. **Dependencies**: What existing assets does this depend on?
6. **Constraints**: Any permission, performance, or compatibility constraints?
7. **Success criteria**: How do we know this asset is working correctly?
8. **Failure modes**: What should never happen after implementation?
9. **Verification evidence**: What proof is required before claiming done?

Step 4: Validate each answer — reject vague/ambiguous inputs, ask for clarification.
Step 5: Enforce ambiguity gate:
  - unresolved_critical must be 0
  - unresolved_minor must be <= 1
  - if gate fails, recommend /hivefiver-discovery --continue

Step 6: Produce a structured intake summary.
Step 7: Update STATE.md Pipeline State:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed intake .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage spec .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
  ```
Step 8: Recommend /hivefiver-spec as next command.

Step 9: Run runtime enforcement post-turn (MANDATORY):
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
  ```
  Include the output as evidence in your completion claim.
</process>

<output_contract>
Return:
- intake_summary: structured JSON with all 9 inputs
- ambiguity_count: number of unresolved ambiguities (must be 0 to proceed)
- promotion_allowed: boolean
- next_command: /hivefiver-spec
</output_contract>

<guided_interaction>
At every step of the intake stage, the agent MUST announce:

1. **What I'm doing**: "I'm gathering structured requirements — question [N] of [total]..."
2. **Why this matters**: "This question defines [aspect] which determines [downstream impact]..."
3. **Progress update**: "We've completed [N]/9 required inputs. [remaining] more to go."
4. **Answer quality**: "Your answer is [clear/vague]. [If vague: I need more specifics about X because...]"
5. **What comes next**: "Once all 9 inputs are clear, I'll distill them into a formal spec in the next stage."

Adapt delivery to user profile: L0 users get examples with each question; L3 users get gaps-only.
The agent leads — the user provides information. Never dump all 9 questions at once for beginners.
</guided_interaction>
