# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
hivemind-plugin/
├── src/                          # Plugin source code (TypeScript)
│   ├── plugin/                    # Plugin assembly layer
│   ├── hooks/                     # Read-side context injection
│   ├── tools/                     # Agent-callable tools (write-side)
│   ├── core/                     # State management (trajectory, workflow)
│   ├── features/                 # Feature-specific implementations
│   ├── control-plane/            # CLI command gate & intake
│   ├── cli/                      # CLI subcommand handlers
│   ├── commands/                 # Slash-command registry
│   ├── context/                  # Prompt packet compilation
│   ├── delegation/               # Handoff context packaging
│   ├── governance/               # Planning projection
│   ├── schema-kernel/            # Contract authority (archived)
│   ├── sdk-supervisor/           # Orchestration control
│   ├── shared/                   # Cross-cutting utilities
│   ├── intelligence/              # Doc surface routing
│   ├── recovery/                 # State assessment & repair
│   ├── tui/                      # Terminal UI components
│   ├── cli.ts                    # CLI binary entrypoint
│   ├── index.ts                  # Main barrel export
│   └── AGENTS.md                 # Source governance
├── dist/                         # Compiled output
├── agents/                       # Agent markdown definitions (shipped)
├── commands/                     # Slash command projections (shipped)
├── workflows/                    # Workflow YAML definitions (shipped)
├── skills/                       # Skill packages (shipped)
├── tests/                        # Test suite
├── docs/                         # Documentation
├── scripts/                       # Build/dev scripts
├── bin/                          # Binary stubs
├── package.json                  # Package manifest
├── tsconfig.json                 # TypeScript config
└── opencode.json                 # OpenCode configuration

.archive/                         # Archived modules
├── schema-kernel/                 # Archived schema-kernel
└── ...
```

## Directory Purposes

### `src/` — Plugin Source Code

**Purpose:** TypeScript source for the `hivemind-context-governance` npm package

**Contains:** All TypeScript modules that compile to `dist/`

**Key Constraint:** Ships as npm package; all code must be ESM with `.js` extensions in imports

---

### `src/plugin/` — Plugin Assembly Layer

**Purpose:** Compose hooks and tools, bind to OpenCode surfaces

**Location:** `src/plugin/`

**Files:**
- `opencode-plugin.ts` — Plugin factory (HiveMindPlugin), hook/tool registration
- `context-renderer.ts` — HiveMind context packet assembly
- `route-hint.ts` — Route reminder rendering
- `runtime-snapshot.ts` — Per-turn runtime snapshot caching
- `synthetic-parts.ts` — Part object creation for message injection
- `input-helpers.ts` — Input builders for hooks
- `context-renderer.constants.ts` — Constants for context rendering

**Key File:** `opencode-plugin.ts`

---

### `src/hooks/` — Read-Side Context Injection

**Purpose:** Context injection, interception, observation — never durable writes

**Location:** `src/hooks/`

**Subdirectories:**
| Directory | Purpose |
|-----------|---------|
| `start-work/` | Purpose classification, lineage, readiness gates |
| `runtime-loader/` | Post-tool state observation, tool event recording |
| `workflow-integration/` | Session compaction context injection |
| `auto-slash-command/` | Auto-detect and route slash commands |

**Files:**
- `sdk-context.ts` — Cached SDK client/shell references
- `event-handler.ts` — All lifecycle events handler
- `soft-governance.ts` — Lightweight toast notifications

---

### `src/tools/` — Agent-Callable Tools (Write-Side)

**Purpose:** Agent-callable structured tools for session operations

**Location:** `src/tools/`

**Subdirectories:**
| Directory | Tool | State Authority |
|----------|------|-----------------|
| `task/` | `hivemind_task` | workflow |
| `trajectory/` | `hivemind_trajectory` | trajectory |
| `handoff/` | `hivemind_handoff` | delegation |
| `runtime/` | `hivemind_runtime_status`, `hivemind_runtime_command` | plugin-control-plane |
| `doc/` | `hivemind_doc` | plugin-control-plane |

**Pattern:** Each tool has `tools.ts` (implementation), `types.ts` (args + contracts), `index.ts` (barrel)

---

### `src/core/` — State Management

**Purpose:** Trajectory ledger, workflow authority, task lifecycle state

**Location:** `src/core/`

**Subdirectories:**
| Directory | Purpose |
|-----------|---------|
| `trajectory/` | Trajectory ledger, events, checkpoints, assessment |
| `workflow-management/` | Workflow authority, task lifecycle, routing, continuity |

**Files:**
- `trajectory/trajectory-store.ts` — Ledger CRUD
- `trajectory/trajectory-assessment.ts` — Entry assessment
- `workflow-management/workflow-authority.ts` — Workflow state
- `workflow-management/task-lifecycle.ts` — Task state machine

---

### `src/features/` — Feature Implementations

**Purpose:** Feature-specific tool implementations and operations

**Location:** `src/features/`

**Subdirectories:**
| Directory | Purpose |
|-----------|---------|
| `runtime-entry/` | Init, doctor, harness, settings command handlers |
| `runtime-observability/` | Status building and command execution |
| `session-entry/` | Session lifecycle handling |
| `agent-work-contract/` | Agent work contract tools |
| `doc-intelligence/` | Doc surface routing |
| `handoff/` | Handoff feature |
| `trajectory/` | Trajectory feature |
| `workflow/` | Workflow feature |

---

### `src/control-plane/` — CLI Command Gate & Intake

**Purpose:** CLI primitive gate, intake, and routing

**Location:** `src/control-plane/`

**Files:**
- `control-plane-registry.ts` — Primitive registration, gate decisions
- `control-plane-intake.ts` — Profile field resolution
- `control-plane-handler.ts` — Command routing
- `control-plane-types.ts` — Type definitions

---

### `src/cli/` — CLI Subcommand Handlers

**Purpose:** Individual CLI command implementations

**Location:** `src/cli/`

**Files:**
- `command-routing.ts` — Command resolution
- `init.ts` — Init command handler
- `doctor.ts` — Doctor command handler
- `settings.ts` — Settings command handler
- `harness.ts` — Harness command handler
- `runtime-assets.ts` — Runtime asset loading
- `doctor.ts` — Repair and recovery

---

### `src/commands/` — Slash-Command Registry

**Purpose:** Slash-command bundle registry, discovery, execution

**Location:** `src/commands/slash-command/`

**Files:**
- `command-bundles.ts` — Static registry of all SlashCommandBundle
- `command-discovery.ts` — Bundle discovery and lookup
- `command-runner.ts` — Bundle execution
- `command-types.ts` — Type definitions

---

### `src/shared/` — Cross-Cutting Utilities

**Purpose:** Common modules used across all layers

**Location:** `src/shared/`

**Key Files:**
| File | Purpose |
|------|---------|
| `paths.ts` | Centralized path builders |
| `tool-response.ts` | Standard response format |
| `tool-helpers.ts` | Shared JSON/list helpers |
| `logging.ts` | Custom logger |
| `runtime-attachment.ts` | Settings load/save |
| `entry-kernel-state.ts` | Entry lifecycle state |
| `lifecycle-spine.ts` | Lifecycle identities |
| `pressure-contract.ts` | Pressure contract registry |
| `opencode-knowledge.ts` | OpenCode knowledge surfaces |
| `opencode-agent-registry.ts` | Agent parsing and projection |
| `opencode-skill-registry.ts` | Skill registry |
| `intake-record.ts` | Intake record handling |

---

### `src/sdk-supervisor/` — Orchestration Control

**Purpose:** Additive Phase 1 orchestration control (instances, sessions, workflows, health)

**Location:** `src/sdk-supervisor/`

**Files:**
- `health.ts` — Health checking
- `instance-registry.ts` — Instance management
- `runtime-status.ts` — Runtime status building

---

### Shipped Assets (Root Level)

| Directory | Purpose | Authority |
|-----------|---------|-----------|
| `agents/` | Agent markdown definitions | Source authority for runtime projection |
| `commands/` | Slash command projections | Source authority for bundle registry |
| `workflows/` | Workflow YAML definitions | Workflow definitions |
| `skills/` | Skill packages | Agent capabilities |

---

## Key File Locations

**Entry Points:**
- `src/cli.ts` — CLI binary entrypoint
- `src/index.ts` — Main barrel export
- `src/plugin/opencode-plugin.ts` — Plugin entry

**Configuration:**
- `package.json` — Package manifest, exports, scripts
- `opencode.json` — OpenCode configuration
- `tsconfig.json` — TypeScript configuration

**State Authority (runtime files):**
- `.hivemind/state/trajectory-ledger.json` — Trajectory records
- `.hivemind/state/tasks.json` — Workflow tasks
- `.hivemind/config/runtime-attachment.json` — Runtime settings
- `.hivemind/config/entry-kernel-state.json` — Entry state

**Tool Implementations:**
- `src/tools/task/tools.ts` — Task tool
- `src/tools/trajectory/tools.ts` — Trajectory tool
- `src/tools/handoff/tools.ts` — Handoff tool
- `src/tools/runtime/tools.ts` — Runtime status/command tools
- `src/tools/doc/tools.ts` — Doc tool

**Hook Implementations:**
- `src/hooks/start-work/start-work-router.ts` — Session entry routing
- `src/hooks/runtime-loader/index.ts` — Tool event recording
- `src/hooks/event-handler.ts` — Lifecycle event handling

---

## Naming Conventions

**Files:**
- TypeScript source: `kebab-case.ts` (e.g., `entry-kernel-state.ts`)
- Barrel exports: `index.ts`
- Test files: `*.test.ts`
- Types files: `*.types.ts` or `*-types.ts`

**Directories:**
- TypeScript source: `kebab-case/` (e.g., `workflow-management/`)
- Shipped assets: `kebab-case/` (e.g., `agents/`, `commands/`)

**Functions/Classes:**
- PascalCase for classes and constructor functions
- camelCase for regular functions and variables
- UPPER_SNAKE_CASE for constants

**Modules:**
- ESM with `.js` extension in imports (even in TypeScript)
- Barrel exports via `index.ts`

---

## Where to Add New Code

### New Feature/Module

**Primary location:** `src/features/<feature-name>/`

**Structure:**
```
src/features/<feature-name>/
├── index.ts              # Barrel export
├── types.ts              # Type definitions
├── operations.ts         # Business logic
└── (optional) tools/     # If exposing tools
```

### New Tool

**Primary location:** `src/tools/<tool-name>/`

**Structure:**
```
src/tools/<tool-name>/
├── index.ts              # Barrel export
├── types.ts              # Args and contracts
├── tools.ts              # Tool implementation using tool.schema
└── (optional) helpers/   # Helper functions
```

**Template:**
```typescript
import { tool } from '@opencode-ai/plugin/tool'
const s = tool.schema

export function createHivemindXxxTool(projectRoot: string) {
  return tool({
    description: '...',
    args: {
      action: s.enum(['create', 'list']).describe('...'),
    },
    async execute(args, context) {
      return JSON.stringify({ status: 'success', data: result })
    },
  })
}
```

### New Hook

**Primary location:** `src/hooks/<hook-name>/`

**Rules:**
- Hooks are non-durable (no direct `.hivemind/` writes)
- Inject context via `Part` objects
- Keep under 200 LOC per hook file

### New CLI Command

**Handler location:** `src/cli/<command>.ts`

**Registration:** Add to `src/control-plane/control-plane-registry.ts`

**Bundle (if slash command):** Add to `src/commands/slash-command/command-bundles.ts`

### New State Management

**Primary location:** `src/core/<domain>/`

**Rules:**
- All state reads/writes go through store functions
- Never direct file I/O to `.hivemind/`
- Use `src/shared/paths.ts` for path resolution

---

## Special Directories

### `.hivemind/` (Runtime Output)

**Purpose:** HiveMind runtime state directory (created at runtime, not committed)

**Contains:**
- `state/` — Trajectory ledger, tasks, planning projections
- `config/` — Runtime attachment settings, entry kernel state
- `sessions/` — Session-specific state
- `graph/` — Workflow graph state
- `handoffs/` — Delegation handoff records

**Generated:** Yes (by runtime, not committed)

**Note:** Use `getEffectivePaths(projectRoot)` from `src/shared/paths.ts` to resolve

---

### `src/archive/` (Archived Code)

**Purpose:** Preserved modules that have been superseded

**Contains:**
- `schema-kernel/` — Archived schema-kernel contracts

**Authority:** Historical only; do not modify archived modules

---

### `.opencode/` (Runtime Projection)

**Purpose:** User-local runtime projection generated by HiveMind

**Generated:** Yes (by `hm-init` and `hm-doctor`)

**Contains:**
- `.opencode/agents/**` — Runtime-safe agent projections
- `.opencode/commands/**` — Command surface projections

**Note:** Generated from source authority under `agents/` and `commands/`

---

*Structure analysis: 2026-03-21*
