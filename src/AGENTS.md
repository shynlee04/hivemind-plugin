# src/ — Plugin Source Code

Source root for the OpenCode plugin. TypeScript, compiled to `dist/`.

## Boundary

Everything under `src/` ships as the npm package `hivemind-context-governance`.
The plugin entry is `plugin/opencode-plugin.ts` → registers hooks, tools, and event handlers.

## Architecture

```
src/
├── plugin/          Assembly — hooks + tools composition (NO business logic)
├── hooks/           Read-side — 7 sub-modules injecting context via Parts
├── tools/           Write-side — 3 structured tools (⚠️ 2 more inline in plugin)
├── plugin-handlers/ Decision routing — command, tool, session resolution
├── core/            State — trajectory, workflow, ⚠️ session (deprecated)
├── commands/        Slash-command bundle registry and execution
├── context/         Prompt packet compilation and rendering
├── control-plane/   Gate/intake system for CLI commands
├── delegation/      Handoff packet creation and store
├── recovery/        State assessment, checkpoint, repair
├── governance/      Planning projection (minimal)
├── intelligence/    Doc surface routing (⚠️ implementation gutted)
├── shared/          Utilities — paths, logging, ⚠️ event-bus (deprecated)
├── cli/             CLI entrypoint and command routing
└── cli.ts           CLI binary entrypoint
```

## SDK Usage Rules

All code in `src/` must use OpenCode SDK primitives:
- `tool.schema` (Zod) for tool argument validation — never raw interfaces
- `ToolContext` properties for session/agent/directory context — never custom session models
- `client.app.log()` for server logging — `shared/logging.ts` is supplementary only
- Plugin hooks for event handling — never `shared/event-bus.ts`

## Deprecated Modules (Audit 2026-03-15)

| Module | Issue | Action |
|--------|-------|--------|
| `core/session/` | Orphaned — zero consumers, parallel to `hooks/start-work/` | Remove |
| `shared/event-bus.ts` | Reimplements SDK events | Replace with `event` hook |
| `hooks/soft-governance.ts` | Empty placeholder | Wire to `client.tui.showToast()` |
