---
name: hivefiver
description: "HiveFiver meta-builder root router. Resolves /hivefiver <action> to the correct stage command. Supports both explicit stage keywords AND free-form intent classification."
agent: hivefiver
---

<enforcement>
Pipeline state (auto-executed — LLM receives this before processing):
!`bash .opencode/skills/hivefiver-mode/scripts/route-stage.sh .`

Pipeline orchestrator (auto-executed — full pipeline health + next stage):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

Intent classifier (auto-executed — classifies $ARGUMENTS if not an explicit stage keyword):
!`bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "$ARGUMENTS"`

User profile (auto-executed — detects language, maturity, guidance needs):
!`bash .opencode/skills/hivefiver-mode/scripts/guided-discovery.sh "$ARGUMENTS"`

Auto-continue command (auto-executed — ready to spawn a fresh session if needed):
!`bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh --json .`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh router "$ARGUMENTS" .`
</enforcement>

<objective>
Route the user's action to the correct HiveFiver stage. Supports TWO modes:
1. **Explicit action** — user provides a stage keyword (start, intake, spec, etc.)
2. **Free-form intent** — user describes what they want in natural language; classifier determines the right stage

If no action given, use the pipeline state to recommend the next action.
The agent LEADS — tell the user what's happening, why, and what comes next.
</objective>

<context>
Action: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<routing>
## Step 1: Check for explicit stage keywords

Parse $ARGUMENTS against this table. If exact match → route directly:

| Action | Command | Description |
|--------|---------|-------------|
| `start` | `/hivefiver-start` | Classify intent, bootstrap context |
| `discovery` | `/hivefiver-discovery` | Run brainstorming + QA discovery to clarify pain/requirements |
| `intake` | `/hivefiver-intake` | Gather requirements via structured questions |
| `spec` | `/hivefiver-spec` | Distill unambiguous specification |
| `architect` | `/hivefiver-architect` | Design asset topology + delegation policy |
| `build` | `/hivefiver-build` | Create/modify framework assets |
| `audit` | `/hivefiver-audit` | System-wide health check |
| `doctor` | `/hivefiver-doctor` | Diagnose + repair broken chains |
| `continue` | `/hivefiver-continue` | Spawn fresh session that auto-continues pipeline |
| `recover` | `/hivefiver-doctor` | Recover from pipeline error (clears error, re-enters doctor) |

## Step 2: If no exact keyword match → use intent classifier

Read the intent classifier output from the enforcement block above. It provides:
- `intent`: one of [build_new, fix_broken, audit_health, extend, improve, learn, unknown]
- `confidence`: [high, medium, low, none]
- `next_command`: the recommended command

Read the pipeline orchestrator output for pipeline sequence:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh sequence [intent] .
```
Show the FULL pipeline sequence to the user: "Your request will follow these stages: [sequence]"

**If confidence is HIGH** → announce the classification, show full pipeline, explain WHY, and execute the command.
**If confidence is MEDIUM** → announce the classification, show full pipeline, ask user to confirm before executing.
**If confidence is LOW or NONE** → present all options and ask user to choose.

## Step 3: If action is empty

1. Read the pipeline state from the enforcement block above
2. Read the pipeline orchestrator status from the enforcement block
3. If `pipeline_active` is true AND `pipeline_error` is empty → recommend the next stage command
4. If `pipeline_active` is true AND `pipeline_error` is NOT empty → announce error and recommend `/hivefiver recover`
5. Announce: "You have an active pipeline at stage X. Here's what comes next and why."
6. Also show the auto-continue command from the enforcement block
7. If `pipeline_active` is false → present all 10 options with descriptions and suggest starting

## Step 4: Context limits or session transfer

If context is approaching limits OR user mentions "new session", "fresh context",
"continue", "auto" → ALWAYS offer `/hivefiver-continue --exec` as the top option.

## Step 5: Recover action

If action is "recover" OR pipeline state has `pipeline_error` set:
1. Announce: "Pipeline has an error: [error]. I'll run doctor to diagnose and fix."
2. Execute: `bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-recovery retry .`
3. Route to `/hivefiver-doctor`

## Step 6: Never drop silently

NEVER silently ignore unknown actions. If nothing matches:
1. Show the classifier output (intent=unknown)
2. List all valid actions
3. Recommend `/hivefiver-start` for guided onboarding

## Step 7: Post-Turn Enforcement (MANDATORY)

Run after routing decision is made:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```
Include the output as evidence before dispatching.
</routing>

<guided_interaction>
At every routing decision, the agent MUST announce:

1. **What I detected**: "Your request matches the [intent] pattern..."
2. **What I'm doing**: "Routing you to [stage] because..."
3. **What comes next**: "After this stage, the pipeline flows to..."
4. **What I need**: "Please confirm / provide / approve..."

This is agent-guided interaction — the agent leads, the user follows.
</guided_interaction>

<output_contract>
Return:
- resolved_action: the matched stage (from keyword OR intent classification)
- resolved_command: the command to execute
- classification_method: "keyword" | "intent_classifier" | "pipeline_resume"
- confidence: high | medium | low | none
- pipeline_state: current pipeline status from enforcement block
- must_pack: unified MUST obligations payload from hivefiver-must-pack.sh
- runtime_gate_post_turn: evidence output from runtime-gate.sh post-turn
</output_contract>
