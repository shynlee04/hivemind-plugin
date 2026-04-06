---
description: "Enhance, audit, or repack a prompt through skim, investigation lanes, clarification gating, and structured final assembly. Triggers: 'enhance this prompt', 'audit this prompt', 'repack this prompt'."
agent: hivefiver-orchestrator
subtask: true
---

<objective>
Run the prompt-enhancement workflow without embedding business logic in the command body.
</objective>

<execution_context>
@.opencode/hivefiver/workflows/prompt-enhance.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the prompt-enhance workflow end-to-end.
Keep the command thin.
Initialize `.hivemind/state/session-context-prompt.md` and `.hivemind/state/.patches/` if missing.
Do not use unsupported `@if` syntax.
</process>
