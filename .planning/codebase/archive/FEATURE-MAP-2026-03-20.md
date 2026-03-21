# Feature Mapping Analysis

**Analysis Date:** 2026-03-20

## Directory Tree

```
src/features/
├── doc-intelligence/          # Markdown document operations
│   ├── doc.ts                 # Feature implementation
│   └── index.ts               # Barrel export
├── handoff/                   # Delegation handoff management
│   ├── handoff.ts             # Feature implementation
│   └── index.ts               # Barrel export
├── runtime-entry/             # Runtime initialization and lifecycle
│   ├── attachment.ts          # Runtime attachment handling
│   ├── command.ts             # Command execution
│   ├── doctor.ts              # Diagnostics and repair
│   ├── handler-shared.ts      # Shared handler utilities
│   ├── harness.ts             # Harness validation
│   ├── index.ts               # Barrel export
│   ├── init.ts                # Initialization
│   ├── instruction-loader.ts  # Command asset loading
│   ├── invocation.ts          # Runtime invocation records
│   ├── settings.ts            # Settings management
│   └── turn-output.ts         # Turn output envelope handling
├── runtime-observability/     # Runtime status and sync
│   ├── index.ts               # Barrel export
│   ├── status.ts              # Status snapshot builder
│   └── sync.ts                # Sync utilities
├── session-entry/             # Session intake and classification
│   ├── index.ts               # Barrel export
│   ├── intake.ts              # Control plane intake resolution
│   ├── lineage-router.ts      # Lineage routing logic
│   ├── purpose-classifier.ts  # Purpose classification
│   ├── readiness-gates.ts     # Readiness gate evaluation
│   ├── session-state.ts       # Session state types
│   └── start-work-types.ts    # Start work type definitions
├── trajectory/                # Trajectory management
│   ├── index.ts               # Barrel export
│   └── trajectory.ts          # Feature implementation
└── workflow/                  # Workflow task management
    ├── index.ts               # Barrel export
    └── task.ts                # Feature implementation
```

## Feature Descriptions

| Feature | Purpose | Files | LOC Range |
|---------|---------|-------|-----------|
| `doc-intelligence` | Markdown document operations (skim, read, chunk, search) | 2 | ~100 |
| `handoff` | Delegation handoff create/read/update/close/validate | 2 | ~170 |
| `runtime-entry` | Runtime initialization, command execution, diagnostics | 11 | ~100-400 |
| `runtime-observability` | Runtime status snapshots and sync | 3 | ~150 |
| `session-entry` | Session intake, lineage routing, readiness gates | 7 | ~50-400 |
| `trajectory` | Trajectory attach/traverse/checkpoint/event/close | 2 | ~170 |
| `workflow` | Workflow task create/activate/verify/complete | 2 | ~190 |

## Import Dependency Graph

### Feature → Core Dependencies

```
runtime-entry/    → core/trajectory, core/workflow-management
session-entry/    → core/trajectory, core/workflow-management
trajectory/       → core/trajectory, core/workflow-management
workflow/         → core/workflow-management
handoff/          → core/trajectory
doc-intelligence/ → (none - uses intelligence/)
runtime-observability/ → (none - uses sdk-supervisor/)
```

### Feature → Shared Dependencies

```
All features use:
  → shared/tool-helpers.ts (parseList, parseJsonArray)
  → shared/paths.ts (getHivemindPath, getConfigPath)
  → shared/runtime-attachment.ts (RuntimeBindingsSnapshot)
  
runtime-entry/
  → shared/entry-kernel-state.ts (EntryKernelStateKind, markEntryKernelReady)
  → shared/lifecycle-spine.ts (RuntimeInvocationV1, TurnOutputEnvelope)
  → shared/contracts/runtime-status.ts (buildRuntimeEntryDecision)
  → shared/bootstrap-profile.ts (normalizeProfileLanguage)
  
session-entry/
  → shared/pressure-contract.ts (PressureContract)
  → shared/opencode-knowledge.ts (OpencodeKnowledgeSurface)
  
runtime-observability/
  → shared/contracts/runtime-status.ts
  → shared/runtime-attachment.ts
```

### Feature → Tools Dependencies (Pressure Contracts)

```
trajectory/  → tools/trajectory/types.ts (HivemindTrajectoryToolArgs, trajectoryActionPressureContracts)
workflow/    → tools/task/types.ts (HivemindTaskToolArgs, taskActionPressureContracts)
handoff/     → tools/handoff/types.ts (HivemindHandoffToolArgs, handoffActionPressureContracts)
doc-intelligence/ → tools/doc/types.ts (HivemindDocToolArgs, docActionPressureContracts)
runtime-observability/ → tools/runtime/types.ts (HivemindRuntimeStatusPayload)
```

### Feature → Control Plane Dependencies

```
runtime-entry/
  → control-plane/control-plane-registry.ts (findControlPlanePrimitive)
  → control-plane/control-plane-intake.ts (resolveControlPlaneIntakeGate)
  → control-plane/control-plane-types.ts (ControlPlanePrimitive, ControlPlaneProfileFieldId)
  → control-plane/sdk-runtime.ts (createManagedRuntime)
  
session-entry/
  → control-plane/control-plane-types.ts (ControlPlanePrimitiveId)
  → control-plane/index.ts (resolveControlPlaneGate)
```

### Feature → Other Domains

```
runtime-entry/
  → commands/slash-command/ (executeSlashCommandBundle, findSlashCommandBundle)
  → governance/index.ts (createPlanningGovernanceProjection)
  → recovery/index.ts (assessRecoveryState, createRecoveryCheckpoint)
  → context/prompt-packet/ (KernelLineage, SessionScope)
  
session-entry/
  → commands/slash-command/command-types.ts (CommandExecutionInput)
  
handoff/
  → delegation/index.ts (createDelegationHandoff, listDelegationHandoffs, etc.)
  
doc-intelligence/
  → intelligence/doc/index.ts (skimDocument, readSection, searchDocuments)
  
runtime-observability/
  → commands/slash-command/index.ts (discoverSlashCommandBundles)
  → sdk-supervisor/index.ts (buildRuntimeStatusSnapshot)
```

## Feature Isolation Patterns

### Pattern 1: Thin Barrel Exports

Every feature uses `index.ts` for barrel exports with `export * from './module.js'`:

```typescript
// src/features/workflow/index.ts
export * from './task.js'
```

**Recommendation for agent-work-contract:**
Create `src/features/agent-work-contract/index.ts` with barrel exports.

### Pattern 2: Context Type Definition

Features define a context interface for tool execution:

```typescript
// src/features/workflow/task.ts
export interface TaskFeatureContext {
  sessionID: string
}

export type TaskFeatureResult =
  | { kind: 'error'; message: string; details?: Record<string, unknown> }
  | { kind: 'success'; message: string; data: Record<string, unknown>; metadata?: {...} }
```

**Recommendation for agent-work-contract:**
Define `AgentWorkContractFeatureContext` with `sessionID` and `agent`.

### Pattern 3: Pressure Contract Integration

Features import pressure contracts from `tools/` for safety validation:

```typescript
// src/features/trajectory/trajectory.ts
import { trajectoryActionPressureContracts, type HivemindTrajectoryToolArgs } from '../../tools/trajectory/types.js'

const pressureContract = trajectoryActionPressureContracts[args.action]
```

**Recommendation for agent-work-contract:**
Create `src/tools/agent-work-contract/types.ts` with pressure contracts before feature implementation.

### Pattern 4: Core Delegation (CQRS)

Features delegate state mutations to `core/` modules:

```typescript
// src/features/workflow/task.ts
import { createWorkflowTask, readWorkflowTask, ... } from '../../core/workflow-management/index.js'

// Features never write directly to .hivemind/state/
const result = createWorkflowTask(projectRoot, { workflowId, taskId, ... })
```

**Recommendation for agent-work-contract:**
If contracts need state persistence, create `src/core/agent-work-contract/` module first, then feature delegates to it.

### Pattern 5: Shared Helper Usage

Features use `shared/tool-helpers.ts` for common parsing:

```typescript
// src/features/handoff/handoff.ts
import { parseList, parseJsonArray } from '../../shared/tool-helpers.js'

const dependencyIds = parseList(args.dependencyIds)
const evidence = parseJsonArray<DelegationEvidenceRecord>(args.evidence)
```

**Recommendation for agent-work-contract:**
Use existing `parseList` and `parseJsonArray` helpers from `shared/tool-helpers.ts`.

### Pattern 6: Trajectory Event Recording

Features that mutate state should record trajectory events:

```typescript
// src/features/handoff/handoff.ts
import { recordTrajectoryEvent } from '../../core/trajectory/index.js'

async function recordHandoffEvent(projectRoot: string, trajectoryId: string | undefined, summary: string): Promise<void> {
  if (!trajectoryId) return
  await recordTrajectoryEvent(projectRoot, trajectoryId, { kind: 'handoff', summary })
}
```

**Recommendation for agent-work-contract:**
Consider whether contract lifecycle events should be recorded in trajectory.

### Pattern 7: Metadata Return Pattern

Successful feature results include optional metadata:

```typescript
return {
  kind: 'success',
  message: 'Created canonical workflow task',
  data: { result, task: readWorkflowTask(projectRoot, args.taskId), pressureContract },
  metadata: {
    title: `HiveMind task ${args.taskId}`,
    metadata: { action: 'create', workflowId: args.workflowId, safetyLevel: pressureContract.safety.level },
  },
}
```

**Recommendation for agent-work-contract:**
Follow same pattern for consistent tool responses.

## Recommendations for agent-work-contract Feature

### Directory Structure

```
src/features/agent-work-contract/
├── index.ts                 # Barrel export
├── contract.ts              # Contract CRUD operations
├── contract-types.ts        # Contract type definitions
└── verification.ts          # Contract verification logic
```

### Import Pattern

```typescript
// src/features/agent-work-contract/contract.ts
import {
  createAgentWorkContract,
  readAgentWorkContract,
  verifyAgentWorkContract,
  // ... core state functions
} from '../../core/agent-work-contract/index.js'  // Create first!

import { parseList } from '../../shared/tool-helpers.js'
import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
import {
  contractActionPressureContracts,
  type HivemindContractToolArgs,
} from '../../tools/agent-work-contract/types.js'  // Create before feature!
```

### Context Type

```typescript
export interface AgentWorkContractFeatureContext {
  sessionID: string
  agent: string
}

export type AgentWorkContractResult =
  | { kind: 'error'; message: string; details?: Record<string, unknown> }
  | { kind: 'success'; message: string; data: Record<string, unknown>; metadata?: {...} }
```

### Action Pattern

```typescript
export function executeHivemindContractAction(
  projectRoot: string,
  args: HivemindContractToolArgs,
  context: AgentWorkContractFeatureContext,
): AgentWorkContractResult {
  const pressureContract = contractActionPressureContracts[args.action]
  
  switch (args.action) {
    case 'create':
      // Delegate to core module
    case 'verify':
      // Verify contract
    case 'complete':
      // Mark complete with evidence
    default:
      return { kind: 'error', message: `Unsupported action: ${args.action}` }
  }
}
```

### Feature Dependencies Order

1. **Create shared types first:** `src/tools/agent-work-contract/types.ts`
2. **Create core state module:** `src/core/agent-work-contract/`
3. **Create feature implementation:** `src/features/agent-work-contract/`
4. **Create tool wrapper:** `src/tools/agent-work-contract/tools.ts`

### State Path Pattern

If contracts need persistent storage:

```typescript
// src/core/agent-work-contract/store.ts
import { getHivemindPath } from '../../shared/paths.js'

export function getContractStorePath(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'state', 'contracts', 'index.json')
}
```

## Key Observations

1. **Zero circular imports:** All features import DOWN from core/shared/tools, never UP from features.
2. **Consistent error handling:** All features use `{ kind: 'error' | 'success', message, ... }` pattern.
3. **Trajectory integration:** State-mutating features record events to trajectory ledger.
4. **Pressure contract safety:** Every mutation action has an associated pressure contract for safety levels.
5. **Core delegation:** Features never access `.hivemind/` state directly - delegate to `core/` modules.
6. **Tool separation:** Tool definitions in `src/tools/` use features for implementation through type imports only.

---

*Feature mapping analysis: 2026-03-20*