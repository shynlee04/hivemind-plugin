# Agent Work Contract Architecture

**Created:** 2026-03-20
**Phase:** Phase 5 - Continuity and Recovery Contract
**Requirement:** FLOW-04 - Persist minimum deterministic continuation record

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONSUMER LAYER                                   │
│  (npm package consumers, OpenCode agents, GSD workflows)               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SHARED PROJECTION LAYER                             │
│  src/shared/contracts/agent-work-contract.ts                            │
│  - Re-exports types and schemas for consumers                          │
│  - `AgentWorkContract` type alias for `AgentWorkContractRecord`         │
│  - All Zod schemas: intent, responseMode, workflow, chainActions, etc.  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCHEMA KERNEL LAYER (AUTHORITY)                      │
│  src/schema-kernel/agent-work-contract.ts                               │
│  - Zod schemas with strict validation (z.strictObject)                  │
│  - `createAgentWorkContractRecord()` factory                            │
│  - Type exports: AgentWorkContractRecord, CreateInput, etc.            │
│  - Single source of truth for contract shape                            │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CORE LAYER (IMPLEMENTATION)                        │
│  src/core/agent-work-contract/                                           │
│  ├── contract-types.ts    - TypeScript type definitions                 │
│  ├── contract-store.ts    - File-based persistence adapter              │
│  └── index.ts             - Barrel export                                │
│                                                                         │
│  Store Operations:                                                      │
│  - getActive() → AgentWorkContractRecord | null                        │
│  - initialize(contract) → AgentWorkContractRecord                      │
│  - archive(contractId) → void                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### AgentWorkContractRecord

```
AgentWorkContractRecord
├── id: string                      # Contract identifier (awc_*)
├── sessionId: string               # OpenCode session ID
├── createdAt: string               # ISO timestamp
├── updatedAt: string               # ISO timestamp  
├── version: "v1"                   # Schema version (fixed)
├── intent: AgentWorkContractIntent
│   ├── raw: string                 # Original user intent
│   ├── confidence: number          # 0-1 confidence score
│   ├── purposeClass: PurposeClass  # quick-action | research-brainstorm | project-driven
│   ├── requiresPlan: boolean
│   └── requiresGovernance: boolean
├── responseMode: ResponseMode
│   ├── mode: ResponseModeName      # broad-search-execute | interactive-qa | deep-research
│   └── reason: string               # Why this mode was chosen
├── workflow: Workflow
│   ├── planningPath?: string       # Path to planning doc
│   ├── phase?: string              # Current phase
│   ├── outlineRef?: string         # Reference to outline
│   └── tasks: Task[]
│       ├── id: string
│       ├── title: string
│       ├── status: TaskStatus       # pending | active | delegated | verifying | complete
│       ├── parentTaskId?: string
│       ├── dependencyIds?: string[]
│       ├── delegationMode?: DelegationMode  # parallel | sequential | handoff
│       ├── delegationSessionId?: string
│       └── evidenceRefs?: string[]
├── chainActions: ChainActions
│   ├── onTaskComplete: TaskCompleteAction  # export-workflow | next-task | close
│   ├── onWorkflowEnd: WorkflowEndAction    # export-contract | archive
│   ├── onDelegation: DelegationAction      # export-messages | handoff-packet
│   └── onCompaction80: CompactionAction    # launch-context-agent | export-summary
├── briefing?: Briefing
│   ├── summary: string
│   ├── workflowState: string
│   └── followUp: string[]
└── anchors?: Anchor[]
    ├── timestamp: string
    ├── kind: AnchorKind           # workflow-shift | planning-shift | stage-shift | user-redirect
    ├── description: string
    └── snapshotRef?: string
```

---

## File Locations

| Layer | Path | Purpose |
|-------|------|---------|
| Schema Authority | `src/schema-kernel/agent-work-contract.ts` | Zod schemas, validation, factory |
| Types | `src/core/agent-work-contract/contract-types.ts` | TypeScript interfaces |
| Store | `src/core/agent-work-contract/contract-store.ts` | File persistence |
| Shared Export | `src/shared/contracts/agent-work-contract.ts` | Consumer-facing projection |
| Tests | `tests/agent-work-contract-*.test.ts` | Schema and store tests |

---

## Persistence Path

```
.hivemind/
└── contracts/
    ├── active.json          # Current active contract
    └── archive/
        └── {contractId}.json  # Archived contracts
```

The `getEffectivePaths(projectRoot)` resolves to `.hivemind/` directory.

---

## Integration Points

### With Existing Tools

| Tool | How It Uses Contracts |
|------|----------------------|
| `hivemind_task` | Creates/updates tasks within contract workflow |
| `hivemind_trajectory` | Records trajectory events linked to contract anchors |
| `hivemind_handoff` | Uses `chainActions.onDelegation` to determine handoff behavior |
| `hivemind_runtime_command` | Can initialize/archive contracts |

### With Session Lifecycle

1. **Session Start**: `initialize(contract)` creates active contract
2. **Task Progress**: Tasks update, contract `updatedAt` refreshes
3. **Delegation**: Uses `chainActions.onDelegation` to determine behavior
4. **Compaction at 80%**: Uses `chainActions.onCompaction80` to preserve context
5. **Workflow End**: Uses `chainActions.onWorkflowEnd` to archive

---

## Zod Schema Design

```typescript
// All schemas use z.strictObject() - rejects unknown keys
// This ensures forward compatibility and strict validation

export const agentWorkContractRecordSchema = z.strictObject({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  // ... all fields required
  version: z.literal('v1'),  // Fixed version
})
```

**Key Design Decisions:**
1. `z.strictObject()` - No unknown keys allowed, catches typos and schema drift
2. Factory function `createAgentWorkContractRecord()` - Injects version automatically
3. Separation of schema (zod) from types (TypeScript) - Both must stay in sync

---

## Authority Hierarchy

```
┌─────────────────────────────────────────┐
│   src/schema-kernel/agent-work-contract │  ← SINGLE SOURCE OF TRUTH
│   - Zod schemas (runtime validation)    │
│   - Type inference                      │
│   - Factory function                     │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌────────────────────┐  ┌────────────────────┐
│ src/core/          │  │ src/shared/        │
│ contract-types.ts  │  │ contracts/          │
│ (TypeScript types) │  │ (consumer export)   │
└────────────────────┘  └────────────────────┘
```

---

## Test Coverage

| Test File | Coverage |
|-----------|----------|
| `agent-work-contract-phase1.test.ts` | Schema validation, factory, barrel exports, strict rejection |
| `agent-work-contract-store.test.ts` | initialize, getActive, archive, error cases, corruption handling |

**10 tests, all passing:**
- Schema exports from authoritative barrels
- Valid record creation
- Strict key rejection
- Initialize and reload
- Empty state returns null
- Archive success
- Archive ID mismatch rejection
- Archive no-op when empty
- Corruption error surfacing
- Corruption during archive

---

## Alignment with FLOW-04

> **FLOW-04**: User can persist the minimum deterministic continuation record outside prompt memory

The `AgentWorkContractRecord` captures:
- **Intent**: What the agent was asked to do
- **Workflow state**: Where in the workflow the agent is
- **Task status**: What tasks are active, delegated, complete
- **Chain actions**: What to do on task complete, workflow end, delegation, compaction
- **Briefing**: Summary for resumption
- **Anchors**: Key decision points for history

This is the **deterministic continuation record** that survives compaction and enables session resumption.