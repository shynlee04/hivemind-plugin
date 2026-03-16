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
├── tools/           Write-side — 6 structured agent-callable tools
├── plugin-handlers/ Decision routing — command, tool, session resolution
├── core/            State — trajectory and workflow authority
├── commands/        Slash-command bundle registry and execution
├── context/         Prompt packet compilation and rendering
├── control-plane/   Gate/intake system for CLI commands
├── delegation/      Handoff packet creation and store
├── recovery/        State assessment, checkpoint, repair
├── governance/      Planning projection (minimal)
├── intelligence/    Doc surface routing + markdown-first read foundation
├── shared/          Utilities — paths, logging, runtime helpers
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
| `core/session/` | Removed in L1 cutover; do not recreate | Keep session lifecycle in `hooks/start-work/` |
| `shared/event-bus.ts` | Removed in L1 cutover; do not recreate | Use SDK `event` hook |
| `hooks/soft-governance.ts` | Live toast-throttling helper | Keep using `client.tui.showToast()` |
