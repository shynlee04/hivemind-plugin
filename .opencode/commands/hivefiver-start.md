---
name: hivefiver-start
description: "Classify user intent and bootstrap HiveFiver context. Entry point for new interactions."
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh start .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Intent classifier (auto-executed):
!`bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "$ARGUMENTS"`

User profile (auto-executed):
!`bash .opencode/skills/hivefiver-mode/scripts/guided-discovery.sh "$ARGUMENTS"`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh start "$ARGUMENTS" .`

⛔ IF the gate check above shows "allowed": false — STOP. Report the reason to the user. DO NOT proceed.
</enforcement>

<objective>
Classify the user's intent and bootstrap the correct HiveFiver stage.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Read STATE.md to determine if this is a fresh start or a resume.
Step 2: If resuming — pick up from the Pipeline State section and continue.
Step 3: If fresh — read the intent classifier output from enforcement block.
  Use the classifier result to determine intent and confidence:

  | Intent | Pipeline | Next Stage |
  |--------|----------|------------|
  | build_new | full_build | discovery |
  | extend | full_build | discovery |
  | fix_broken | doctor_fix | doctor |
  | audit_health | audit_only | audit |
  | improve | audit_then_build | audit |
  | learn | guided_onboard | discovery |
  | custom/unknown | adaptive | discovery |

Step 4: Show the full pipeline sequence for the classified intent:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh sequence [intent] .
  ```
  Announce: "Your request matches [intent]. Here's the full pipeline: [stages]. Total [N] stages, [M] need your approval."

Step 5: Confidence-based confirmation:
  - HIGH confidence → Announce classification and auto-proceed
  - MEDIUM confidence → Announce classification, ask user to confirm
  - LOW/NONE confidence → Present all options, ask user to choose

Step 6: Handle special intents:

  ### learn (Guided Onboarding)
  Explain HiveFiver's capabilities with the user's detected language + maturity level:
  - L0: "HiveFiver builds the tools that AI agents use. Think of it like a factory that makes robots."
  - L1: "HiveFiver manages framework assets: agents, commands, skills, and workflows."
  - L2/L3: "HiveFiver is a meta-builder. Run /hivefiver audit to see your framework health."
  Route to discovery for interactive exploration.

  ### custom/unknown (Adaptive)
  "I couldn't classify your request with high confidence. Let me guide you through some questions."
  Route to discovery for clarification.

Step 7: Update STATE.md Pipeline State:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-active true .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage [next_stage] .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "[user's goal]" .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed start .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
  ```

Step 8: Recommend the next command based on the pipeline sequence.

Step 9: Run runtime enforcement post-turn (MANDATORY):
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
  ```
  Include the output as evidence in your completion claim.
</process>

<output_contract>
Return:
- classified_intent: one of [build_new, fix_broken, audit_health, extend, improve, learn, custom]
- confidence: high | medium | low | none
- pipeline_id: full_build | doctor_fix | audit_only | audit_then_build | guided_onboard | adaptive
- pipeline_sequence: ordered list of stages
- next_command: the command to run next (e.g., /hivefiver-discovery)
- pipeline_state_updated: confirmation that STATE.md was modified
</output_contract>

<guided_interaction>
At every step of the start stage, the agent MUST announce:

1. **What I'm doing**: "I'm classifying your request to determine the best workflow..."
2. **What I detected**: "Your input matches the [intent] pattern because [reasoning]..."
3. **What comes next**: "This means we'll follow the [stage] pipeline: [brief description of stages ahead]"
4. **What I need from you**: "Please confirm this classification is correct, or tell me more about what you need."
5. **Pipeline context**: "This will set pipeline_target to '[target]' and begin tracking progress in STATE.md."

The agent leads — the user confirms. Never wait silently for user direction.
</guided_interaction>
