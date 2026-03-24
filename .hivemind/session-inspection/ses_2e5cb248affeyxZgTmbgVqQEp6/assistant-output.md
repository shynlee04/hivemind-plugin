# Session Inspection Export

- ses_id: `ses_2e5cb248affeyxZgTmbgVqQEp6`
- prepared_at: `2026-03-23T10:21:21.261Z`

## Assistant Output

Now I have a comprehensive view. Let me compile the final classification report.

---

## Status: `completed`

## Evidence: SDK Dependency Boundary Classification

### Summary Table

| Module | File |SDK Import | Plugin Import | Client API | Plane | Notes |
|--------|------|-----------|---------------|------------|-------|-------|
| **Control Plane** | `control-plane/sdk-runtime.ts` | `createOpencode`, `createOpencodeClient`, `OpencodeClient`, `ServerOptions` | - | - | **Control Plane** | Creates/manages OpenCode server instances |
| **Control Plane** | `control-plane/*.ts` (other) | - | - | - | Pure Plugin | No SDK imports, pure business logic |
| **CLI Entry** | `cli.ts` | - | - | - | Pure Plugin | NoSDK imports, routes to control-plane |
| **CLI** | `cli/init.ts`, `cli/harness.ts`, etc. | - | - | - | Pure Plugin | Re-exports from features/runtime-entry |
| **Plugin Entry** | `plugin/opencode-plugin.ts` | - | `Plugin` | - | **Execution Plane** | Main plugin factory, registers hooks/tools |
| **Plugin** | `plugin/synthetic-parts.ts` | `Part` | - | - | **Hybrid** | UsesSDK `Part` type for message injection |
| **Plugin** | `plugin/messages-transform-adapter.ts` | - | - | - | Pure Plugin | No directSDK imports, uses local types |
| **Plugin** | `plugin/compaction-adapter.ts` | - | - | - | Pure Plugin | No SDK imports |
| **Plugin** | `plugin/context-renderer.ts`, etc. | - | - | - | Pure Plugin | No SDK imports |
| **Hooks Index** | `hooks/index.ts` | - | - | - | Pure Plugin | Barrel export |
| **SDK Context** | `hooks/sdk-context.ts` | - | `PluginInput` | Cached | **Execution Plane** | Caches `client` from plugin input for hooks |
| **Event Handler** | `hooks/event-handler.ts` | `Event` | - | - | **Hybrid** | UsesSDK `Event` type for event hook |
| **Soft Governance** | `hooks/soft-governance.ts` | - | - | `client.tui.showToast()` | **Execution Plane** | Uses cached client via `withClient()` |
| **Start-Work Router** | `hooks/start-work/start-work-router.ts` | - | - | - | Pure Plugin | No SDK/Plugin imports, pure business logic |
| **Runtime Loader** | `hooks/runtime-loader/runtime-stage.ts` | - | - | - | Pure Plugin | NoSDK/Plugin imports |
| **Runtime Loader** | `hooks/runtime-loader/tool-governance.ts` | - | - | - | Pure Plugin | Uses core/trajectory, no SDK |
| **Workflow Integration** | `hooks/workflow-integration/workflow-continuity.ts` | - | - | - | Pure Plugin | NoSDK/Plugin imports |
| **Auto-Slash-Command** | `hooks/auto-slash-command/auto-slash-command.ts` | - | - | - | Pure Plugin | No SDK/Plugin imports |
| **Tools** | `tools/runtime/tools.ts` | - | `tool` from `plugin/tool` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **Tools** | `tools/task/tools.ts` | - | `tool` from `plugin/tool` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **Tools** | `tools/doc/tools.ts` | - | `tool` from `plugin/tool` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **Tools** | `tools/handoff/tools.ts` | - | `tool` from `plugin/tool` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **Tools** | `tools/trajectory/tools.ts` | - | `tool` from `plugin/tool` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **Agent Work Contract** | `features/agent-work-contract/tools/create-contract-tool.ts` | - | `tool` from `plugin/tool` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **Agent Work Contract** | `features/agent-work-contract/tools/export-contract-tool.ts` | - | `tool`, `ToolContext` | `context.*` | **Execution Plane** | Uses plugin `tool()` factory |
| **SDK Supervisor** | `sdk-supervisor/*.ts` | - | - | - | Pure Plugin | No SDK/Plugin imports |
| **Features** | `features/runtime-entry/init.handler.ts` | Via `createManagedRuntime` | - | - | **Control Plane** | Calls `createManagedRuntime` from sdk-runtime |
| **Features** | `features/runtime-entry/attachment.ts` | - | - | - | Pure Plugin | Re-exports types/logic |
| **Features** | `features/**/*` (other) | - | - | - | Pure Plugin | No SDK imports |

---

### Plane Classification

#### 1. **Control Plane (`@opencode-ai/sdk`)**

Files that MUST ONLY import from `@opencode-ai/sdk`:

| File | SDK Imports | Purpose |
|------|-------------|---------|
| `control-plane/sdk-runtime.ts` | `createOpencode`, `createOpencodeClient`, `OpencodeClient`, `ServerOptions` | Creates/manages OpenCode server and client instances |
| `features/runtime-entry/init.handler.ts` | Via `createManagedRuntime` | Bootstrap managed runtime during init |

**Boundary Rule**: Code in `src/cli/` and `src/control-plane/` operates outside the agent loop. It can spawn servers, create sessions, and manage high-level state.

#### 2. **Execution Plane (`@opencode-ai/plugin`)**

Files thatMUST ONLY import from `@opencode-ai/plugin`:

| File | Plugin Imports | Hook/Tool Type |
|------|----------------|----------------|
| `plugin/opencode-plugin.ts` | `Plugin` | Plugin factory |
| `hooks/sdk-context.ts` | `PluginInput` | Context caching |
| `tools/runtime/tools.ts` | `tool` | Tool factory |
| `tools/task/tools.ts` | `tool` | Tool factory |
| `tools/doc/tools.ts` | `tool` | Tool factory |
| `tools/handoff/tools.ts` | `tool` | Tool factory |
| `tools/trajectory/tools.ts` | `tool` | Tool factory |
| `features/agent-work-contract/tools/*.ts` | `tool`, `ToolContext` | Tool factories |

**Boundary Rule**: Code in `src/plugin/`, `src/hooks/`, and `src/tools/` operates inside the agent loop. It CAN use `context.*` APIs and cached `client` from sdk-context.

#### 3. **Hybrid (Uses both SDK types and Plugin context)**

| File | SDK Import | Plugin Import | Reason |
|------|------------|---------------|--------|
| `hooks/event-handler.ts` | `Event` type | - | UsesSDK `Event` type for event hook signature |
| `plugin/synthetic-parts.ts` | `Part` type | - | Uses SDK `Part` type for message part structure |
| `hooks/soft-governance.ts` | - | Via sdk-context | Uses cached `client.tui.showToast()` |

**Note**: These files useSDK *types* (`Event`, `Part`) but execute in the Plugin hook context. The types are shared between SDK and Plugin packages.

#### 4. **Pure Plugin (No SDK/Plugin imports)**

Files that work withoutSDK package imports:

| Category | Files | Purpose |
|----------|-------|---------|
| Business Logic | `hooks/start-work/*.ts` | Purpose classification, lineage routing |
| Business Logic | `hooks/runtime-loader/runtime-stage.ts` | Runtime stage resolution |
| Business Logic | `hooks/workflow-integration/*.ts` | Workflow continuity logic |
| Business Logic | `hooks/auto-slash-command/*.ts` | Command bundle routing |
| Business Logic | `features/session-entry/*.ts` | Session state, readiness gates |
| Business Logic | `features/workflow/*.ts` | Task/workflow management |
| Business Logic | `core/**/*.ts` | Trajectory, recovery, state authority |
| Business Logic | `shared/**/*.ts` | Paths, logging, utilities |
| Business Logic | `sdk-supervisor/**/*.ts` | Instance registry, health, diagnostics |

---

### Artifact: Boundary Classification Summary

```
src/
├── cli/                          # Control Plane (CLI entry)
│   └── *.ts                      # Pure routing, no SDK imports
├── control-plane/
│   ├── sdk-runtime.ts            # SDK PLANE: createOpencode, createOpencodeClient
│   └── *.ts (other)              # Pure business logic
├── plugin/
│   ├── opencode-plugin.ts        # EXECUTION PLANE: Plugin factory
│   ├── synthetic-parts.ts        # HYBRID: SDK Part type + Plugin context
│   └── *.ts (other)              # Pure rendering/formatting
├── hooks/
│   ├── sdk-context.ts            # EXECUTION PLANE: Caches PluginInput client
│   ├── event-handler.ts          # HYBRID: SDK Event type
│   ├── soft-governance.ts       # EXECUTION PLANE: client.tui.showToast()
│   └── */ (start-work, runtime-loader, workflow-integration, auto-slash-command)
│                                  # Pure business logic, no SDK imports
├── tools/
│   └── */ (all tools)            # EXECUTION PLANE: Plugin tool() factory
├── features/
│   ├── runtime-entry/
│   │   └── init.handler.ts       # SDK PLANE: createManagedRuntime
│   └── agent-work-contract/
│       └── tools/                # EXECUTION PLANE: Plugin tool() factory
├── sdk-supervisor/               # Pure business logic
├── core/                         # Pure business logic
└── shared/                       # Pure utilities
```

---

### Key Findings

1. **Clean dual-plane separation exists**: The codebase correctly separates SDK-dependent code (control-plane, init handlers) from Plugin-dependent code (hooks, tools).

2. **Type sharing is acceptable**: SDK types like `Event` and `Part` are used in hybrid files because they're shared between packages and don't create runtime dependencies.

3. **Client API access pattern**: Hooks access `client.*` APIs through the cached `sdk-context.ts` which receives `PluginInput['client']` at plugin initialization.

4. **No violations found**: No hooks import `@opencode-ai/sdk` client-creation functions, and no control-plane code imports `@opencode-ai/plugin` hook types.

5. **Pure plugin modules**: Significant portions of `hooks/`, `features/`, `core/`, and `shared/` are pure business logic with noSDK/Plugin package dependencies.