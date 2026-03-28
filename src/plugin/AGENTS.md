# src/plugin/ — Plugin Assembly (Entry Point)

The OpenCode plugin entry point. Assembly-only — no business logic, no inline tools.

## Boundary

- `opencode-plugin.ts` assembles hooks, tools, and configuration
- Hooks are imported from `src/hooks/`
- Tools are imported from `src/tools/`
- **No inline tool definitions** — all tools extracted to `src/tools/`

## Assembly Pattern

```typescript
return {
  event: async (eventInput) => { await eventHandler(eventInput) },
  'chat.message': async (input, output) => { await handleChatMessage(...) },
  'tool.execute.after': async (toolInput) => { await handleToolExecution(...) },
  tool: { hivemind_runtime_status: ..., hivemind_task: ..., ... },
  // ... other hooks
}
```

## Rules

- Plugin file stays under 300 LOC
- No imports from `sdk-supervisor` deprecated modules
- All hook error handling uses `.catch(() => undefined)`
- Tools registered via `createHivemindXxxTool(directory)` factory pattern
