# /commands — OpenCode Command Contracts

## Responsibilities
- Store shipped slash-command projections as markdown files with frontmatter and structured sections.
- Represent command intent, routing context, process, and output contract in a form that mirrors OpenCode command concepts.
- Stay thin: the executable install/runtime logic belongs to `src/`, not to root markdown content.
- Reserve root `commands/` for bundle-backed or control-plane-adapter command assets that are actually mirrored by runtime sync.

Root `commands/` is reserved for bundle-backed or control-plane-adapter command assets that are actually mirrored by runtime sync.

## Rules
- Commands are thin OpenCode-facing projections, not runtime authority.
- Every command file must declare frontmatter at minimum: `description`, `agent`, and `subtask`.
- Keep command content focused on orchestration behavior, not implementation details of runtime modules.
- User-facing command assets must reference active governance artifacts such as `MASTER.active.md`, `task_plan.active.md`, and `progress.active.md` instead of legacy root planning files.
- Stable governance and SOT references inside command assets should use non-date-stamped authority paths.
- If a command file is not referenced by `src/commands/slash-command/command-bundles.ts`, it does not belong in `commands/` as a live surface.
- Command markdown may not rely on `.opencode/skills/**` shell pipelines or direct `.hivemind/**` mutation as hidden runtime engines.
