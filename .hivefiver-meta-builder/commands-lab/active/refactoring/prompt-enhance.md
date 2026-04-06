---
description: "Enhance, audit, or repack a prompt through skim, investigation lanes, clarification gating, and structured final assembly. Triggers: 'enhance this prompt', 'audit this prompt', 'repack this prompt'."
agent: hivefiver-orchestrator
subtask: true
---

Read the prompt-enhance workflow and execute it end-to-end with the user's prompt text.

Keep the command thin — delegate all computation to tools and lane agents. The workflow specifies the full orchestration flow.

Control rules:
- Avoid conditional template syntax (use workflow logic, not command-level conditionals)
- Initialize `.hivemind/state/session-context-prompt.md` and `.hivemind/state/.patches/` if missing (the prompt-enhance plugin handles this)
- Route all session-state writes through `session-patch` tool with absolute path

User prompt:
$ARGUMENTS
