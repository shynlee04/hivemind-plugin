# Reference — Harness Coordination Contracts

This reference outlines the coordination contracts between commands, agents, and tools within the Hivemind composition engine.

## Naming Taxonomy & Scopes
All meta-concept names are strictly governed to avoid conflicts:

| Lineage / Namespace | Target Location | Description |
|---------------------|-----------------|-------------|
| `hm-*` | `.opencode/command/` or `agents/` | Hivemind-native product primitives |
| `hf-*` | `.opencode/command/` or `agents/` | Meta-authoring framework tools |
| `gsd-*` | `.opencode/command/` or `agents/` | GSD framework development tools |
| `gate-*` | `.opencode/skills/` | Project quality gates (lifecycle, spec, evidence) |
| `stack-*` | `.opencode/skills/` | Tech-stack API references (nextjs, zod, vitest) |

## Tool Dispatch Matrix

When an agent needs to invoke another workflow or subagent, it must select the correct coordination tool:

| Tool | Purpose | Characteristics |
|------|---------|-----------------|
| `task` | Standard synchronous subagent call | Blocks execution until subagent completes. Preserves parent-child context lineage. |
| `delegate-task` | Asynchronous background delegation | Launches a child session that runs in the background. Tracks status via `delegation-status`. |
| `execute-slash-command` | Execute an OpenCode slash command | Resolves commands across namespaces (`gsd`, `hm`, `hf`) and handles agent overrides. |

## Event Logging & Trajectory

- Every command execution is tracked with a UUID, start/end timestamps, and duration.
- The `session-tracker` records session logs and metadata under `.hivemind/state/session-continuity.json`.
- State is preserved inside durable journals, enabling safe restart and resumption of pending tasks.
