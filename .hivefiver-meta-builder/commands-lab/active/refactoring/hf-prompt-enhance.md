---
description: "Enhance, audit, or repack a prompt through skim, investigation lanes, clarification gating, and structured final assembly. Triggers: 'enhance this prompt', 'audit this prompt', 'repack this prompt'."
agent: hivefiver-orchestrator
subtask: true
---

Execute the prompt-enhance workflow using `delegate-task` for all tool invocations.

Variable mapping: `$ARGUMENTS` (from the command) becomes `$USER_PROMPT` throughout the workflow.

The orchestrator must:
1. Read `.hivemind/state/session-context-prompt.md` at the start of each phase (create with default content if missing)
2. Pass session content as a constraint to every `task` call
3. Use `task` (not direct tool calls) for prompt-skim, session-patch, prompt-analyze, and context-budget
4. Use builder agents for session-patch calls, researcher agents for analysis calls

Control rules:
- All tool calls go through `task`
- Session context flows to every subagent via constraints
- Use absolute path: `.hivemind/state/session-context-prompt.md` (not relative)

User prompt:
$ARGUMENTS
