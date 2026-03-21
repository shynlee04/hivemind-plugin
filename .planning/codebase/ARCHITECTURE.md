# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** OpenCode Plugin with CQRS-Layer Separation

This is an OpenCode plugin that implements governance and session management for AI coding agents. It follows a strict **Dual-Plane SDK Architecture**:

- **Control Plane** (`@opencode-ai/sdk`): CLI commands, session management, server orchestration — operates *outside* the agent loop
- **Execution Plane** (`@opencode-ai/plugin`): Hooks, tools, event handling — operates *inside* the agent loop

**Key Architectural Principles:**
1. **CQRS Hard Boundary**: Tools own writes. Hooks are read-only context injection. Plugin assembles only.
2. **SDK-First**: Use native SDK primitives before custom abstractions (`tool.schema`, `permission.ask`, `client.app.log()`)
3. **Interface Decomposition**: Types stay under 10 fields at core level; extensions compose via intersections
4. **Authority Principle**: Each concern has ONE owner — no duplicate implementations

## Layers

### Layer 1: Plugin Assembly (`src/plugin/`)

**Purpose:** Compose hooks and tools, bind to OpenCode surfaces

**Location:** `src/plugin/opencode-plugin.ts`

**Contains:**
- Plugin factory (`HiveMindPlugin`) that registers all hooks and tools
- Hook event bindings for: `event`, `chat.message`, `permission.ask`, `tool.execute.before/after`, `command.execute.before`, `shell.env`, `messages.transform`, `session.compacting`
- Tool registration for 8 tools

**Depends on:** `src/hooks/`, `src/tools/`

**Rule:** Assembly-only — no business logic, no tool implementations

---

### Layer 2: Tools — Write-Side (`src/tools/`)

**Purpose:** Agent-callable structured tools for session operations

**Location:** `src/tools/` with subdirectories: `task/`, `trajectory/`, `handoff/`, `runtime/`, `doc/`

**Contains:** 6 extracted tool implementations using `tool.schema` (Zod)

**Tool Inventory:**
| Tool | File | State Authority |
|------|------|-----------------|
| `hivemind_task` | `src/tools/task/tools.ts` | workflow |
| `hivemind_trajectory` | `src/tools/trajectory/tools.ts` | trajectory |
| `hivemind_handoff` | `src/tools/handoff/tools.ts` | delegation |
| `hivemind_doc` | `src/tools/doc/tools.ts` | plugin-control-plane |
| `hivemind_runtime_status` | `src/tools/runtime/tools.ts` | plugin-control-plane |
| `hivemind_runtime_command` | `src/tools/runtime/tools.ts` | plugin-control-plane |

**Depends on:** `src/core/`, `src/shared/`, `src/features/`

**Pattern:**
```typescript
import { tool } from '@opencode-ai/plugin/tool'
const s = tool.schema  // IS zod

export function createHivemindXxxTool(projectRoot: string) {
  return tool({
    description: '...',
    args: {
      action: s.enum(['create', 'list']).describe('...'),
    },
    async execute(args, context) {
      // Use context.sessionID, context.agent, context.directory
      return JSON.stringify({ status: 'success', data: result })
    },
  })
}
```

---

### Layer 3: Hooks — Read-Side (`src/hooks/`)

**Purpose:** Context injection, interception, observation — never durable writes

**Location:** `src/hooks/` with submodules: `start-work/`, `runtime-loader/`, `workflow-integration/`, `auto-slash-command/`, `sdk-context.ts`, `event-handler.ts`, `soft-governance.ts`

**Hook Adoption:**
| Hook | Module | Purpose |
|------|--------|---------|
| `event` | `hooks/event-handler.ts` | All lifecycle events |
| `chat.message` | `plugin/opencode-plugin.ts` | Session context injection |
| `permission.ask` | `plugin/opencode-plugin.ts` | Auto-allow HiveMind tools, surface mutation toasts |
| `tool.execute.before` | `hooks/runtime-loader/` | Record managed-tool execution intent |
| `tool.execute.after` | `hooks/runtime-loader/` | Post-tool state capture |
| `command.execute.before` | `plugin/opencode-plugin.ts` | Pre-command context injection |
| `shell.env` | `plugin/opencode-plugin.ts` | Env variable injection |
| `messages.transform` | `plugin/opencode-plugin.ts` | Message history injection |
| `session.compacting` | `hooks/workflow-integration/` | Compaction context |

**Rule:** Non-durable — never write to `.hivemind/` directly

---

### Layer 4: Core State (`src/core/`)

**Purpose:** State management for trajectory, workflow, tasks

**Location:** `src/core/trajectory/`, `src/core/workflow-management/`

**Contains:**
- `trajectory/trajectory-store.ts` — Ledger CRUD, event recording, checkpointing
- `trajectory/trajectory-assessment.ts` — Entry assessment (attach/resume/create/defer/refuse)
- `workflow-management/workflow-authority.ts` — Workflow state management
- `workflow-management/task-lifecycle.ts` — Task creation, activation, rotation, verification

**State Files:** `.hivemind/state/trajectory-ledger.json`, `.hivemind/state/tasks.json`

---

### Layer 5: Features (`src/features/`)

**Purpose:** Feature-specific tool implementations and operations

**Location:** `src/features/` with subdirectories: `runtime-entry/`, `runtime-observability/`, `session-entry/`, `agent-work-contract/`, `doc-intelligence/`, `handoff/`, `trajectory/`, `workflow/`

**Key Files:**
- `runtime-observability/status.ts` — `buildHivemindRuntimeStatus()`, `executeHivemindRuntimeCommand()`
- `runtime-entry/` — Init, doctor, harness, settings command handlers
- `session-entry/` — Session lifecycle handling
- `agent-work-contract/` — Agent work contract tools

---

### Layer 6: Control Plane (`src/control-plane/`)

**Purpose:** CLI command gate, intake, and routing

**Location:** `src/control-plane/`

**Files:**
- `control-plane-registry.ts` — Primitive registration, gate decisions
- `control-plane-intake.ts` — Profile field resolution, missing field detection
- `control-plane-handler.ts` — Command routing to init/doctor/harness/settings handlers

**CLI Primitives:** `hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`

---

### Layer 7: CLI Entry (`src/cli.ts`, `src/cli/`)

**Purpose:** Binary entrypoint and command routing

**Location:** `src/cli.ts` (main entry), `src/cli/` (subcommands)

**CLI Commands:**
| Command | Handler | Purpose |
|---------|---------|---------|
| `hm-init` | `features/runtime-entry/` | Bootstrap runtime entry surfaces |
| `hm-doctor` | `cli/doctor.ts` | Repair runtime entry and recovery spine |
| `hm-settings` | `cli/settings.ts` | Persist runtime attachment defaults |
| `hm-harness` | `cli/harness.ts` | Validate runtime attachment and server health |

---

### Layer 8: Shared Utilities (`src/shared/`)

**Purpose:** Cross-cutting helpers used by all layers

**Location:** `src/shared/`

**Key Modules:**
- `paths.ts` — Centralized path builders (`getHivemindPath()`, `getStatePath()`, `getEffectivePaths()`)
- `tool-response.ts` — Standard `{status, message, data}` response format
- `tool-helpers.ts` — Shared JSON/list helpers for tools
- `logging.ts` — Custom logger (augmented with `client.app.log()`)
- `runtime-attachment.ts` — Settings load/save + runtime bindings
- `entry-kernel-state.ts` — Entry lifecycle state management
- `lifecycle-spine.ts` — Shared lifecycle identities

---

### Layer 9: Schema Kernel (`src/schema-kernel/`)

**Purpose:** Machine-authoritative contracts for persisted and cross-session records

**Location:** `src/schema-kernel/` (archived to `src/archive/schema-kernel/`)

**Contains:**
- `lifecycle-records.ts` — Entry, runtime invocation, turn output contracts
- `orchestration-records.ts` — Supervisor, session, workflow graph, wave, guard contracts
- `evidence-records.ts` — Freshness, deadlock, replay contracts

**Status:** Archived — re-exports from `src/archive/schema-kernel/` for backward compatibility

---

## Data Flow

### Agent Session Flow

```
1. User sends message
   ↓
2. OpenCode receives message → chat.message hook fires
   ↓
3. Turn snapshot loaded (runtime-snapshot.ts)
   ↓
4. messages.transform hook:
   - Resolve start work (hooks/start-work/start-work-router.ts)
   - Inject HiveMind context packet (plugin/context-renderer.ts)
   - NL-first dispatch check (features/runtime-entry/nl-first-dispatch.ts)
   ↓
5. Agent processes with injected context
   ↓
6. Agent calls tool (e.g., hivemind_task)
   ↓
7. tool.execute.before hook → record tool event
   ↓
8. Tool executes → core/workflow-management/task-lifecycle.ts
   ↓
9. tool.execute.after hook → record completion
   ↓
10. Session continues or compacts
    ↓
11. session.compacting hook → inject workflow context
```

### CLI Command Flow

```
1. User runs: hm-init --name "Dev" --governance strict
   ↓
2. CLI entry (cli.ts) parses args, routes to init handler
   ↓
3. Control plane gate check (control-plane-registry.ts)
   ↓
4. Intake resolution (control-plane-intake.ts)
   ↓
5. Handler execution (features/runtime-entry/)
   ↓
6. Runtime surface sync (.opencode/agents/**, .opencode/commands/**)
   ↓
7. Entry kernel state update (entry-kernel-state.ts)
```

### Tool Execution Pattern

```
1. Plugin registers tool via tool definition
2. Agent calls tool with args
3. Context provides: sessionID, agent, directory, abort, metadata(), ask()
4. Tool implementation:
   - Validates args using tool.schema (Zod)
   - Delegates to core module for state operations
   - Returns JSON.stringify({status, message, data})
```

## Key Abstractions

### Trajectory Ledger (`src/core/trajectory/`)

**Purpose:** Persistent record of session trajectories, events, checkpoints

**Examples:** `src/core/trajectory/trajectory-store.ts`, `src/core/trajectory/trajectory-assessment.ts`

**Pattern:** Ledger with CRUD operations — `bootstrapTrajectoryLedger()`, `recordTrajectoryEvent()`, `closeTrajectory()`, `checkpointTrajectory()`

---

### Workflow Authority (`src/core/workflow-management/`)

**Purpose:** Workflow state, task lifecycle, routing, continuity

**Examples:** `src/core/workflow-management/workflow-authority.ts`, `src/core/workflow-management/task-lifecycle.ts`

**Pattern:** Task state machine — create → activate → rotate → verify → complete

---

### Delegation Packet (`src/delegation/`)

**Purpose:** Handoff context packaging for sub-session workflows

**Examples:** `src/delegation/delegation-packet.ts`, `src/delegation/delegation-store.ts`

**Pattern:** Structured handoff context — source/target sessions, evidence requirements, return contracts

---

### Entry Kernel State (`src/shared/entry-kernel-state.ts`)

**Purpose:** Entry lifecycle state management (uninitialized → repair-required → qa-pending → ready)

**Pattern:** State machine with persisted JSON file under `.hivemind/config/`

---

### Runtime Attachment (`src/shared/runtime-attachment.ts`)

**Purpose:** Settings load/save and runtime bindings snapshot

**Pattern:** JSON config under `.hivemind/config/runtime-attachment.json`

---

## Entry Points

**CLI Binary:** `dist/cli.js` (compiled from `src/cli.ts`)
- Entry: `runCli(argv, executablePath)`
- Registers commands: init, doctor, settings, harness
- Binaries: `hivemind-context-governance`, `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`

**Plugin Entry:** `dist/plugin/opencode-plugin.js` (compiled from `src/plugin/opencode-plugin.ts`)
- Entry: `HiveMindPlugin` factory function
- Registers hooks and tools on OpenCode plugin surfaces

**NPM Package Entry:** `dist/index.js` (compiled from `src/index.ts`)
- Exports: `HiveMindPlugin`, all module barrels

---

## Error Handling

**Strategy:** Result types with discriminated unions

**Pattern:**
```typescript
type Result<T> = { kind: 'success'; data: T } | { kind: 'error'; message: string; details?: unknown }

function executeToolAction(args): Result<T> {
  if (!valid) return { kind: 'error', message: 'Invalid args' }
  return { kind: 'success', data: computedValue }
}
```

**Tool Response:** Standard `{status: 'success' | 'error', message: string, data?: T}` via `src/shared/tool-response.ts`

---

## Cross-Cutting Concerns

**Logging:** Custom logger in `src/shared/logging.ts` + `client.app.log()` for structured server-side logging

**Path Resolution:** `src/shared/paths.ts` — all paths derived from `getEffectivePaths(projectRoot)` which resolves from single project root

**Context Injection:** Hooks inject via `Part` objects (synthetic parts), never via return values

**SDK Context:** `src/hooks/sdk-context.ts` — cached client/shell references for hook-local use

---

*Architecture analysis: 2026-03-21*
