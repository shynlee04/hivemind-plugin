# /commands — OpenCode Command Contracts

## Responsibilities
- Store slash-command assets as markdown files with frontmatter and structured sections.
- Represent command intent, routing context, process, and output contract in a form that mirrors OpenCode command concepts.

## Rules
- Commands are markdown-first, not `.txt` stubs.
- Every command file must declare frontmatter at minimum: `description`, `agent`, and `subtask`.
- Keep command content focused on orchestration behavior, not implementation details of runtime modules.
