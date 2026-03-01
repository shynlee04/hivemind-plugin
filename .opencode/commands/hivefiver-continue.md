---
name: hivefiver-continue
description: "Spawn a deterministic new HiveFiver session that auto-continues from current pipeline state. The ONLY way to create fresh context without losing work."
agent: hivefiver
---

<enforcement>
Pipeline state (auto-executed — LLM receives this before processing):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Session continuation command (auto-executed — outputs the opencode run command):
!`bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh .`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh continue "$ARGUMENTS" .`
</enforcement>

<objective>
Create a fresh HiveFiver session that deterministically continues from the current
pipeline state. No context is lost — STATE.md is the cross-session state bus.
</objective>

<context>
Arguments (optional): $ARGUMENTS
  - `--exec`   → Execute the continuation immediately (spawn session now)
  - `--prompt` → Show the composed handoff prompt before launching
  - `--json`   → Output machine-parseable JSON instead of shell command
  - (empty)    → Output the opencode run command for user to review/run
</context>

<process>
Step 1: Read the pipeline state from the enforcement block above.

Step 2: If pipeline_active is false:
  - Report: "No active pipeline. Run /hivefiver start to begin."
  - Offer to start a new pipeline.
  - STOP.

Step 3: If pipeline_active is true:
  - The enforcement block has already generated the continuation command.
  - Present the command to the user.
  - Explain what the new session will do (stage, target, what's been completed).

Step 4: If $ARGUMENTS contains --exec:
  - Run: bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh --exec .
  - Stream the output to the user.
  - The new session launches immediately.

Step 5: If $ARGUMENTS is empty:
  - Present the generated command from the enforcement block.
  - User can copy-paste to run, or run /hivefiver-continue --exec to auto-launch.

Step 6: After new session spawns:
  - Confirm handoff was written to .hivemind/hive-modules/hivefiver-v2/handoffs/
  - Report: session title, stage, timestamp

Step 7: Run runtime enforcement post-turn (MANDATORY):
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```
Include the output as evidence in your completion claim.
</process>

<what_the_new_session_receives>
The new session gets a self-contained prompt containing:

1. Skills to load first (hivefiver-mode, hivefiver-coordination)
2. Current stage from STATE.md
3. Completed stages (what is done)
4. Pipeline target (what we're building)
5. Phase-specific continuation instructions
6. Prior handoff context (if any)
7. Scope boundaries (what is/isn't allowed)
8. Quality gate requirements before claiming done

This means the new session needs ZERO prior conversation history to work correctly.
STATE.md + the handoff prompt = full context.
</what_the_new_session_receives>

<output_contract>
Return:
- pipeline_state: current active/inactive status
- continuation_command: the opencode run command (or confirmation it was executed)
- handoff_file: path to the written handoff record
- new_session_will_do: summary of what the new session picks up
- must_pack: unified MUST obligations payload from hivefiver-must-pack.sh
- runtime_gate_post_turn: evidence output from runtime-gate.sh post-turn
</output_contract>
