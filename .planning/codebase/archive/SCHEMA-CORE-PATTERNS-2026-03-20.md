# Schema & Core Patterns Analysis

**Analysis Date:** 2026-03-20

## Executive Summary

The HiveMind plugin uses a dual-layer schema architecture:
1. **Archived Schema Kernel** (`src/archive/schema-kernel/`) - Machine-authoritative contracts for Phase 1 records
2. **Active Contracts** (`src/shared/contracts/`) - Runtime-facing validation schemas for tool responses

Core state management follows CQRS principles with:
- **Write-side**: Tools in `src/tools/` (agent-callable)
- **Read-side**: Hooks in `src/hooks/` (context injection)
- **State Authority**: `src/core/traject` and `src/core/workflow-management/`

---

## Schema-Kernel Architecture

### Location & Status

| Path | Status | Purpose |
|------|--------|---------|
| `src/schema-kernel/` | **Archived stub** | Re-exports from archive for backward compatibility |
| `src/archive/schema-kernel/` | **Active** | Machine-authoritative contracts forPhase 1records |

The schema-kernel was archived (see `src/schema-kernel/index.ts`):
```typescript
export const SCHEMA_KERNEL_ARCHIVED = true
export const SCHEMA_KERNEL_ARCHIVE_PATH = 'src/archive/schema-kernel/'
```

### Schema Files (Active Archive)

| File | Purpose | Field Count |
|------|---------|-------------|
| `shared.ts` | Common enums and schema primitives | 9 enums |
| `lifecycle-records.ts` | Entry, runtime invocation, turn output, delegation receipt |4 schemas (10-25 fields each) |
| `orchestration-records.ts` | Supervisor, session, workflow graph, wave, guard | 5 schemas |
| `evidence-records.ts` | Freshness, deadlock, replay contracts | 3 schemas |

### Schema Patterns

**1. Version Literal Pattern**
Every schema uses `z.literal('v1')` for versioning:
```typescript
export const entryKernelStateSchema = z.object({
  version: z.literal('v1'),
  state: entryKernelStateKindSchema,
  // ...
}).strict()
```

**2. Strict Object Enforcement**
All object schemas use `.strict()` to prevent extra fields:
```typescript
z.object({ /* fields */ }).strict()
```

**3. Composed Enum Schemas**
Enums are defined separately and reused:
```typescript
// shared.ts
export const entryKernelStateKindSchema = z.enum([
  'uninitialized',
  'repair-required',
  'qa-pending',
  'ready',
  'blocked',
])

// lifecycle-records.ts
export const entryKernelStateSchema = z.object({
  state: entryKernelStateKindSchema,
  // ...
})
```

**4. Factory Functions with Input Interfaces**
Each schema has a corresponding factory function:
```typescript
export interface CreateEntryKernelStateRecordInput {
  state: EntryKernelStateRecord['state']
  qaState: EntryKernelStateRecord['qaState']
  // ...
}

export function createEntryKernelStateRecord(
  input: CreateEntryKernelStateRecordInput,
): EntryKernelStateRecord {
  return entryKernelStateSchema.parse({
    version: 'v1',
    state: input.state,
    // ...
  })
}
```

**5. Type Inference Pattern**
Types are inferred from schemas:
```typescript
export type EntryKernelStateRecord = z.infer<typeof entryKernelStateSchema>
```

---

## Active Contracts (Runtime Facing)

### Location

`src/shared/contracts/` contains runtime-facing schemas:
- `runtime-events.ts` - Recent event schema
- `runtime-status.ts` - Runtime status, entry state, workflow summary

### Schema Patterns

**Flattened Object Schemas** (no strict enforcement):
```typescript
export const runtimeStatusSchema = z.object({
  runtimeAuthority: runtimeAuthoritySchema,
  runtimeInstanceId: z.string().optional(),
  serverBaseUrl: z.string().optional(),
  entryState: runtimeStatusEntryStateSchema,
  // ...
})
```

**Nested Schema Composition**:
```typescript
export const runtimeStatusEntryStateSchema = z.object({
  state: z.string(),
  interactiveBootstrapRequired: z.boolean(),
  recommendedNext: z.string(),
})

export const runtimeStatusSchema = z.object({
  entryState: runtimeStatusEntryStateSchema,
  // ...
})
```

**Default Values**:
```typescript
recentEvents: z.array(runtimeRecentEventSchema).default([]),
workflowSummary: runtimeWorkflowSummarySchema.nullable().default(null),
```

---

## Core State Patterns

### Trajectory Module (`src/core/trajectory/`)

**File Structure**:
```
trajectory/
├── trajectory-types.ts    # Type definitions (no Zod)
├── trajectory-store.ts    # CRUD operations
├── trajectory-assessment.ts  # Entry assessment
└── index.ts               # Barrel export
```

**Type Decomposition Pattern**:
Types are decomposed into logical slices:
```typescript
// Core identity - always present
export interface TrajectoryCore {
  id: string
  lineage: KernelLineage
  purposeClass: PurposeClass
  status: TrajectoryStatus
  createdAt: string
  updatedAt: string
}

// Entity bindings - what trajectory is attached to
export interface TrajectoryBindings {
  workflowIds: string[]
  sessionIds: string[]
  taskIds: string[]
  // ...
}

// Full record via intersection
export type TrajectoryRecord = TrajectoryCore
  & TrajectoryBindings
  & TrajectoryEvidence
  & TrajectoryPlanning
```

**Note**: No Zod schemas in core types - pure TypeScript interfaces.

### Workflow Module (`src/core/workflow-management/`)

**File Structure**:
```
workflow-management/
├── workflow-types.ts      # Type definitions
├── workflow-authority.ts  # Workflow creation/updates
├── task-lifecycle.ts      # Task state machine
├── workflow-router.ts     # Routing logic
├── continuity.ts          # Session continuity
└── index.ts               # Barrel export
```

**Simple Interface Pattern**:
```typescript
export interface WorkflowRecord {
  id: string
  intent: string
  stage: 'initial' | 'interdependent' | 'mid-session'
  scope: 'main' | 'sub-session'
  // ...20+ fields, many optional
}
```

---

## Zod Usage Patterns Summary

### Locations with Zod Schemas

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/archive/schema-kernel/` | 4 files | Machine-authoritative contracts |
| `src/shared/contracts/` | 2 files | Runtime-facing validation |
| `src/tools/*/tools.ts` | Inline | Tool argument validation via `tool.schema` |

### Tool Argument Pattern

Tools use `tool.schema` (Zod re-export):
```typescript
import { tool } from '@opencode-ai/plugin'

export function createHivemindTaskTool(projectRoot: string) {
  return tool({
    description: 'Canonical task and subtask authority...',
    args: {
      action: tool.schema.enum(['create', 'list', 'get', 'activate', 'rotate', 'verify', 'complete'])
        .describe('Task authority action to perform'),
      workflowId: tool.schema.string().optional()
        .describe('Workflow identifier that owns the task'),
      // ...
    },
    async execute(args, context) {
      // Use context.sessionID, context.agent, context.directory// ...
    },
  })
}
```

**Key Points**:
- Every arg must have `.describe()` for agent introspection
- `tool.schema` IS Zod (re-exported from 'zod')
- Args are validated automatically before `execute` is called

---

## Tool Helper Utilities

### Available Utilities (`src/shared/tool-helpers.ts`)

| Function | Purpose | Signature |
|----------|---------|-----------|
| `parseList` | Parse comma-separated string to array | `(value?: string) =>string[]` |
| `parseJsonArray` | Parse JSON array string safely | `<T>(json?: string) => T[]` |
| `renderToolResult` | Pretty-print JSON output | `(result: unknown) => string` |

**Usage Example**:
```typescript
import { parseList, renderToolResult as render } from '../../shared/tool-helpers.js'

// Parse comma-separated IDs
const taskIds = parseList(args.taskIds)  // "a, b, c" → ['a', 'b', 'c']

// Return formatted result
return render(success(result.message, result.data))
```

### Tool Response Format (`src/shared/tool-response.ts`)

| Function | Return Type | Status |
|----------|-------------|--------|
| `success<T>()` | `ToolResponse<T>` | `'success'` |
| `error<T>()` | `ToolResponse<T>` | `'error'` |
| `pending<T>()` | `ToolResponse<T>` | `'pending'` |

```typescript
export interface ToolResponse<T = unknown> {
  status: 'success' | 'error' | 'pending'
  message: string
  data?: T
  metadata?: Record<string, unknown>
}
```

---

## Path Resolution Pattern

### Centralized Path Authority (`src/shared/paths.ts`)

**Constants**:
```typescript
export const HIVEMIND_DIR = '.hivemind'
export const STATE_DIR = 'state'
export const SESSIONS_DIR = 'sessions'
// ...
```

**Canonical Path Builder**:
```typescript
export function getEffectivePaths(projectRoot: string) {
  const root = path.join(projectRoot, HIVEMIND_DIR)
  return {
    root,
    stateDir,
    configDir,
    graphDir,
    sessionsDir,
    runtimeAttachmentSettings: path.join(configDir, 'runtime-attachment.json'),
    workflowTasksState: path.join(stateDir, 'tasks.json'),
    trajectoryLedger: path.join(stateDir, 'trajectory-ledger.json'),
    // ...
  }
}
```

**Rule**: All path resolution must go through `getEffectivePaths()` - neverhardcode `.hivemind/` paths.

---

## Recommendations for Schema Design

### 1. Follow Interface Decomposition Pattern

**Do**:
```typescript
// Decompose into logical slices
interface Core { id: string; status: string }
interface Bindings { workflowIds: string[]; taskIds: string[] }
type Record = Core & Bindings& Extensions// ≤10 fields per slice
```

**Don't**:
```typescript
// Avoid 20+ field monoliths
interface Record {
  id: string
  status: string
  workflowIds: string[]
  taskIds: string[]
  // ... 20more fields
}
```

### 2. Use Factory Functions for Schema Validation

```typescript
// Pattern from lifecycle-records.ts
export interface CreateXxxInput { /* minimal required */ }
export function createXxx(input: CreateXxxInput): XxxRecord {
  return xxxSchema.parse({
    version: 'v1',
    // ... defaults and computed
  })
}
```

### 3. Keep Schemas in Schema Files

- Machine-authoritative schemas: `src/archive/schema-kernel/`
- Runtime-facing schemas: `src/shared/contracts/`
- Tool arg schemas: Inline in `tools.ts` using `tool.schema`

**Don't** create new schema locations without adding to AGENTS.md boundary.

### 4. Use `.strict()` for Persisted Records

```typescript
// Persisted records should be strict
export const entryKernelStateSchema = z.object({
  version: z.literal('v1'),
  // ...
}).strict()
```

### 5. Infer Types from Schemas

```typescript
// Don't duplicate
export interface EntryKernelStateRecord { /* fields */ }
export const entryKernelStateSchema = z.object({ /* same fields */ })

// Do infer
export type EntryKernelStateRecord = z.infer<typeof entryKernelStateSchema>
```

### 6. Enum Schemas Should Be Shared

```typescript
// shared.ts - define once
export const statusSchema = z.enum(['active', 'closed'])

// other files - import and reuse
import { statusSchema } from './shared.js'
```

---

## Architecture Constraints

### CQRS Boundary

| Layer | Can Write | Can Read | Location |
|-------|-----------|----------|----------|
| Tools | Yes | Yes | `src/tools/` |
| Hooks | No | Yes | `src/hooks/` |
| Plugin | Wires only | Yes | `src/plugin/` |

### State Authority

| Module | Owns | Path |
|--------|------|------|
| `core/trajectory/` | Trajectory ledger | `.hivemind/state/trajectory-ledger.json` |
| `core/workflow-management/` | Workflow state | `.hivemind/state/tasks.json` |
| `features/session-entry/` | Entry kernel state | `.hivemind/runtime-attachment.json` |

### SDK Contract (ToolContext)

Available in every tool `execute(args, context)`:
- `context.sessionID` - Current session
- `context.agent` - Calling agent name
- `context.directory` - Project root
- `context` - Worktree root
- `context.abort` - AbortSignal
- `context.metadata()` - Set tool metadata
- `context.ask()` - Request user permission

---

## File Reference Summary

### Schema Files
- `src/archive/schema-kernel/shared.ts` - Enums and primitives
- `src/archive/schema-kernel/lifecycle-records.ts` - Entry/runtime/turn schemas
- `src/archive/schema-kernel/orchestration-records.ts` - Supervisor/session schemas
- `src/archive/schema-kernel/evidence-records.ts` - Freshness/deadlock schemas
- `src/shared/contracts/runtime-status.ts` - Runtime status schemas

### Core Types (No Zod)
- `src/core/trajectory/trajectory-types.ts` - Trajectory interfaces
- `src/core/workflow-management/workflow-types.ts` - Workflow interfaces
- `src/tools/task/types.ts` - Task tool types + pressure contracts

### Utilities
- `src/shared/tool-helpers.ts` - parseList, parseJsonArray, renderToolResult
- `src/shared/tool-response.ts` - success, error, pending factories
- `src/shared/paths.ts` - getEffectivePaths, path constants

---

*Schema analysis: 2026-03-20*