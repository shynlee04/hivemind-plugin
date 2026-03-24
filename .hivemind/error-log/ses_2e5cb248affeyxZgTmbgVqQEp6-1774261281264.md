---
session_id: ses_2e5cb248affeyxZgTmbgVqQEp6
timestamp: 2026-03-23T10:21:21.261Z
purpose: planning
session_state: ready
trajectory: none
workflow: none
agent: unset
---

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
| `ho
