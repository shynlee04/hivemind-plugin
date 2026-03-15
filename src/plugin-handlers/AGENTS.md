# src/plugin-handlers/ — Decision Routing Layer

Resolves command bindings, tool grants, session inheritance, and category routing for the plugin context.

## Boundary

| File | Purpose |
|------|---------|
| `plugin-context.ts` | `buildPluginContext()` — assembles full context from StartWorkDecision |
| `command-resolution.ts` | Maps StartWorkDecision → CommandBinding (control-plane or workflow) |
| `tool-resolution.ts` | Resolves which tools should be granted to the agent |
| `session-inheritance.ts` | Determines session scope, prompt mode, todo authority |
| `category-routing.ts` | Maps purpose class → routing category |
| `handler-types.ts` | `PluginContext`, `CommandBinding`, `ToolGrant`, `SessionInheritance` types |

## Design

- All resolution is **pure functions** with `StartWorkDecision` as input
- `PluginContext` aggregates all decisions into a single object for hook consumption
- This layer is the bridge between `hooks/start-work/` (read-side) and `plugin/` (assembly)
