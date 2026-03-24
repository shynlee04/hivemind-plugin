# Session Inspection Export

- ses_id: `ses_2e51714c7ffez60v0wf991dgLI`
- prepared_at: `2026-03-23T13:39:35.492Z`

## Assistant Output

Now I have a comprehensive understanding of the codebase. Let me compile the findings:

---

## Codebase Investigation Report

**Scope:** src/features/, src/shared/, src/hooks/, .hivemind/ directory structures and patterns
**Question:** Understand existing patterns for feature structure, path resolution, event/error/session tracking, and hook implementations

---

### 1. Existing Feature Patterns (`src/features/`)

**8 feature directories found:**

| Feature | Structure | Complexity |
|---------|-----------|------------|
| `agent-work-contract/` | `index.ts`, `types.ts`, `schema/`, `hooks/`, `engine/`, `tools/` | **Complex** |
| `doc-intelligence/` | `index.ts`, `doc.ts` | Simple |
| `handoff/` | `index.ts`, `handoff.ts` | Simple |
| `runtime-entry/` | 27 files - various handlers, builders, persistence | **Large** |
| `runtime-observability/` | `index.ts`, `status.ts`, `sync.ts` | Medium |
| `session-entry/` | `index.ts`, 13 files - intake, gates, classifiers | **Large** |
| `trajectory/` | `index.ts`, `trajectory.ts` | Simple |
| `workflow/` | `index.ts`, `task.ts` | Simple |

**Feature Index Pattern:**
```typescript
// Simple feature (1 export)
export * from './handoff.js'

// Complex feature (multiple layers)
export * from './schema/index.js'
export * from './types.js'
export * from './hooks/index.js'
```

**Feature Subdirectory Patterns:**
- `schema/` - Zod schemas for machine-validated contract structures
- `hooks/` - Feature-specific hook implementations
- `engine/` - Core business logic
- `tools/` - Tool implementations (if feature exposes tools)

---

### 2. Current Path Resolution Patterns (`src/shared/paths.ts`)

**File:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/shared/paths.ts` (89 lines)

**Directory Constants:**
```typescript
export const HIVEMIND_DIR = '.hivemind'
export const STATE_DIR = 'state'
export const SESSIONS_DIR = 'sessions'
export const GRAPH_DIR = 'graph'
export const CONFIG_DIR = 'config'
export const ARTIFACTS_DIR = 'artifacts'
export const CHECKPOINTS_DIR = 'checkpoints'
```

**State Files Object:**
```typescript
export const STATE_FILES = {
  hiveneuron: 'hiveneuron.json',
  hivebrain: 'hivebrain.md',
  brain: 'brain.json',
  anchors: 'anchors.json',
} as const
```

**Individual Path Builders:**
```typescript
export function getHivemindPath(projectRoot: string): string
export function getStatePath(projectRoot: string, filename: string): string
export function getSessionPath(projectRoot: string, sessionId: string): string
export function getSessionInspectionPath(projectRoot: string, sessionId: string): string
export function getErrorLogPath(projectRoot: string): string
export function getConfigPath(projectRoot: string, configName: string): string
```

**Canonical Path Authority (Preferred Pattern - Lines 63-88):**
```typescript
export function getEffectivePaths(projectRoot: string) {
  const root = path.join(projectRoot, HIVEMIND_DIR)
  return {
    root,
    stateDir: path.join(root, STATE_DIR),
    configDir: path.join(root, CONFIG_DIR),
    graphDir: path.join(root, GRAPH_DIR),
    sessionsDir: path.join(root, SESSIONS_DIR),
    sessionInspectionDir: path.join(root, 'session-inspection'),
    projectPlanningDir: path.join(root, 'project', 'planning'),
    handoffsDir: path.join(root, 'handoffs'),
    errorLogDir: path.join(root, 'error-log'),
    runtimeAttachmentSettings: path.join(configDir, 'runtime-attachment.json'),
    workflowTasksState: path.join(stateDir, 'tasks.json'),
    workflowTasksGraph: path.join(graphDir, 'tasks.json'),
    trajectoryLedger: path.join(stateDir, 'trajectory-ledger.json'),
  }
}
```

---

### 3. Existing Code Related to Error-Log, Session-Inspection, Event Tracking

**Error-Log Implementation (`src/sdk-supervisor/diagnostic-log.ts`):**
- **Location:** `src/sdk-supervisor/diagnostic-log.ts` (104 lines)
- **Purpose:** Writes diagnostic summaries to `.hivemind/error-log/` after each agent completes its flow
- **Key Function:** `writeDiagnosticLog(projectRoot, entry)` - writes markdown files named `${sessionId}-${Date.now()}.md`
- **Entry Structure:**
  ```typescript
  interface DiagnosticLogEntry {
    sessionId: string
    timestamp: string
    assistantText: string
    purpose?: string
    sessionState?: string
    trajectory?: string
    workflow?: string
    agent?: string
    injection?: { /* skill bundle, context blocks */ }
  }
  ```

**Session-Inspection Implementation (`src/sdk-supervisor/session-inspection.ts`):**
- **Location:** `src/sdk-supervisor/session-inspection.ts` (106 lines)
- **Purpose:** Upserts per-session inspection exports with paired async purification commands
- **Key Function:** `upsertSessionInspectionExport(projectRoot, { sessionId, assistantText })`
- **Output Structure:**
  - `.hivemind/session-inspection/<session-id>/assistant-output.md`
  - `.hivemind/session-inspection/<session-id>/purification-command.json`
- **Runtime:** Automatic via `experimental.text.complete` hook (exempt from consent requirement per AGENTS.md)

**Event Handler Hook (`src/hooks/event-handler.ts`):**
- **Location:** `src/hooks/event-handler.ts` (125 lines)
- **Purpose:** Bridges OpenCode runtime events into the active trajectory ledger
- **Key Function:** `createEventHandler(directory)` returns OpenCode `event` hook
- **Known Event Types:** `session.started`, `session.ended`, `session.compacted`, `message.added`, `tool.executed`, `command.executed`, `agent.created`, `trajectory.started`, `trajectory.ended`
- **Special Handling:** Agent-work contract events (prefixed with `agent-work`)

---

### 4. Hook Implementation Patterns

**Hook Directory Structure (`src/hooks/`):**

| Subdirectory | Hook Event | Purpose |
|-------------|------------|---------|
| `start-work/` | `chat.message` (implied) | Purpose classification, lineage, readiness gates, trajectory assessment |
| `runtime-loader/` | `tool.execute.after` | Post-tool state observation and metadata capture |
| `workflow-integration/` | `session.compacting` | Inject workflow context into compaction |
| `auto-slash-command/` | `chat.message` | Auto-detect and route slash commands |
| `runtime-bridge/` | `command.execute.before` | Load command assets, resolve runtime contracts |

**Standalone Hook Files:**
- `sdk-context.ts` (98 lines) - SDK client/shell reference caching with `withClient<T>()` helper
- `event-handler.ts` (125 lines) - OpenCode event hook bridging to trajectory ledger
- `soft-governance.ts` (52 lines) - Toast throttling via `client.tui.showToast()`

**SDK Context Pattern (`src/hooks/sdk-context.ts`):**
```typescript
let clientRef: ClientRef | null = null
let shellRef: ShellRef | null = null

export function initSdkContext(input: Pick<PluginInput, 'client' | '$' | 'serverUrl' | 'project'>): void
export function resetSdkContext(): void
export async function withClient<T>(fn: (client: ClientRef) => Promise<T>, fallback?: T): Promise<T | undefined>
```

**Soft Governance Pattern (`src/hooks/soft-governance.ts`):**
```typescript
const toastCooldowns = new Map<string, number>()
const TOAST_COOLDOWN_MS = 5_000

export async function showGovernanceToast(category: string, message: string, variant?: 'info' | 'warning' | 'error'): Promise<void>
export function resetToastCooldowns(): void
```

---

### 5. File Naming Conventions and Exports

**Barrel Export Pattern (index.ts):**
```typescript
/**
 * Module description barrel export
 */
export * from './paths.js'
export * from './tool-response.js'
// ... named exports only, no default exports
```

**Feature Index Pattern:**
```typescript
/**
 * Feature Barrel Export
 * Public interface for the Feature.
 * @module feature-name
 */
// Schema exports
export * from './schema/index.js'
// Type exports
export * from './types.js'
// Stable feature root exports
export * from './hooks/index.js'
```

**File Naming:**
- Source files: `kebab-case.ts` (e.g., `paths.ts`, `runtime-attachment.ts`)
- Test files: `*.test.ts` colocated with source
- Hook subdirectories: `kebab-case/` with `index.ts` barrel

**Export Rules:**
- Named exports only (`export *` or `export { name }`)
- No default exports in shared/feature modules
- `.js` extension in export paths (ESM)

---

### 6. `.hivemind/` Directory Structure

```
.hivemind/
├── agent-work-contract/     # Agent contract storage
├── config/
│   └── runtime-attachment.json
├── context-check.json
├── error-log/               # Diagnostic logs
│   └── ses_<id>-<timestamp>.md
├── graph/
│   └── tasks.json
├── project/
│   └── planning/
├── session-inspection/      # Session exports
│   └── ses_<id>/
│       ├── assistant-output.md
│       └── purification-command.json
└── state/
    ├── anchors.json
    ├── brain.json
    ├── hiveneuron.json
    ├── hivebrain.md
    └── trajectory-ledger.json
```

---

### 7. Schema Pattern (from `agent-work-contract/schema/contract.ts`)

```typescript
import { z } from 'zod'

// Enum schemas
export const PurposeClassSchema = z.enum(['quick-action', 'research-brainstorm', 'project-driven'])

// Object schemas with validation
export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: TaskStatusSchema,
  parentTaskId: z.string().min(1).optional(),
  dependencyIds: z.array(z.string().min(1)).optional(),
})

// Type inference
export type Task = z.infer<typeof TaskSchema>
```

---

### 8. Tool Pattern (from `src/tools/runtime/tools.ts`)

```typescript
import { tool } from '@opencode-ai/plugin/tool'
const s = tool.schema  // This IS zod

export function createHivemindRuntimeStatusTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: 'Clear, agent-facing description',
    args: {
      action: s.enum(['create', 'list']).describe('Operation to perform'),
      id: s.string().optional().describe('Record identifier'),
    },
    async execute(args, context) {
      // USE context.sessionID, context.agent, context.directory
      const result = await someOperation(projectRoot, { sessionID: context.sessionID })
      context.metadata(result.metadata)
      return JSON.stringify({ status: 'success', data: result })
    },
  })
}
```

---

### 9. Testing Pattern

```typescript
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('ComponentName - methodName - describes expected behavior', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-prefix-'))
  try {
    // Arrange
    // Act
    // Assert
    assert.equal(actual, expected)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
```

---

### 10. Key AGENTS.md Governance Notes

**From `src/shared/AGENTS.md`:**
- `event-bus.ts` was **REMOVED** - use SDK `event` hook instead
- `logging.ts` should supplement with `client.app.log()`
- Session-inspection exports are **exempt from consent requirement** (automatic, non-blocking, deterministic)

**From `src/hooks/AGENTS.md`:**
- Hooks are **non-durable** - never write to `.hivemind/` state directly
- Each hook file ≤ 200 LOC
- `start-work/` is the **real session lifecycle**