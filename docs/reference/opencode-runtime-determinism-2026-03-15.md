# OpenCode Runtime Determinism

Date: 2026-03-15
Scope: `s/ecosystem-revamp`

## Core Knowledge

- `opencode-commands-are-prompts`
  Commands in `.opencode/commands/` are prompt contracts and operator affordances. They are not deterministic workflow control planes.
- `opencode-plugins-are-runtime`
  Deterministic routing, event handling, shell policy, and context transformation belong in plugin/tool/runtime code.
- `opencode-non-interactive-shell`
  Shell execution must assume a non-interactive OpenCode environment with no prompt waiting, no editor/pager dependence, and explicit non-interactive flags.
- `opencode-project-or-global-surfaces`
  Community delivery should target downstream project or global OpenCode surfaces. Repo-root self-host mirrors are test harnesses, not the delivery model.

## Design Consequences

- Keep `hm-*` command files single-purpose and contract-oriented.
- Move cross-command sequencing, recovery gates, and continuity enforcement into plugin/runtime code.
- Inject OpenCode knowledge before command routing so early intent detection already knows the runtime rules.
- Treat shell knowledge as project knowledge, not optional agent folklore.

## Current Application

- `start-work` now emits OpenCode runtime knowledge alongside lineage, purpose, and readiness decisions.
- `plugin runtime` now injects OpenCode determinism knowledge before routing the transformed user message.
- `.opencode/plugins/` remains a self-host harness for this repo, while downstream sync remains the real delivery path.
