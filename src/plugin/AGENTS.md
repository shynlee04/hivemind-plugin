# src/plugin/ — Plugin Assembly Layer

Entry: `opencode-plugin.ts` — the sole file that registers hooks, tools, and the event handler with OpenCode.

## Boundary

This directory is **assembly only**. It composes hooks and tools — it must not contain business logic, state management, or tool implementations.

## Audit Findings (2026-03-15)

> [!WARNING]
> Two tools (`hivemind_runtime_status`, `hivemind_runtime_command`) are defined **inline** in `opencode-plugin.ts`. This violates the extraction pattern used by the other 3 tools.

### Required Corrections

1. **Extract inline tools** to `src/tools/runtime/tools.ts` + `src/tools/runtime/types.ts`
2. **Plugin entry must only**: import and register hooks, import and register tools, export the `Plugin`
3. **No tool logic** in this directory — all tool execute functions belong in `src/tools/`

## Files

| File | Purpose |
|------|---------|
| `opencode-plugin.ts` | Plugin factory — hook registration + tool assembly |
| `sdk-context.ts` | Caches `PluginInput` (client, shell, directory, worktree) |
| `event-handler.ts` | Maps SDK `Event` to hook dispatchers |

## SDK Surface Used

- `Plugin` type, `PluginInput` type, `tool()` function
- `Part` type for synthetic message injection
- `Event` type for lifecycle event handling
- 7 of 17 available hooks registered
