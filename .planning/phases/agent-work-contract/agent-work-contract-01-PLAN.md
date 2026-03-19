---
phase: agent-work-contract
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/agent-work-contract/schema/contract.ts
  - src/features/agent-work-contract/schema/intent.ts
  - src/features/agent-work-contract/schema/delegation.ts
  - src/features/agent-work-contract/schema/index.ts
  - src/features/agent-work-contract/types.ts
  - src/features/agent-work-contract/index.ts
autonomous: true
requirements:
  - AWC-01
  - AWC-02
  - AWC-03

must_haves:
  truths:
    - "Contract schema validates correct structure for contracts"
    - "Intent schema validates user intent classification inputs"
    - "Delegation schema validates delegation records and handoff packets"
    - "All schema types are exported for consumption"
  artifacts:
    - path: "src/features/agent-work-contract/schema/contract.ts"
      provides: "AgentWorkContractSchema, PurposeClass, DelegationMode, ResponseMode enums"
      min_lines: 50
    - path: "src/features/agent-work-contract/schema/intent.ts"
      provides: "IntentClassificationSchema for user intent classification"
      min_lines: 20
    - path: "src/features/agent-work-contract/schema/delegation.ts"
      provides: "DelegationRecordSchema, HandoffPacketSchema for delegation"
      min_lines: 20
    - path: "src/features/agent-work-contract/schema/index.ts"
      provides: "Barrel export for all schemas"
      min_lines: 10
    - path: "src/features/agent-work-contract/types.ts"
      provides: "TypeScript interfaces for store operations, classifiers, executors"
      min_lines: 40
    - path: "src/features/agent-work-contract/index.ts"
      provides: "Feature barrel export"
      min_lines: 10
  key_links:
    - from: "src/features/agent-work-contract/schema/contract.ts"
      to: "src/features/agent-work-contract/types.ts"
      via: "type exports"
      pattern: "export type.*from.*schema"
    - from: "src/features/agent-work-contract/engine/*.ts"
      to: "src/features/agent-work-contract/schema/*.ts"
      via: "import"
      pattern: "import.*AgentWorkContractSchema"
---

<objective>
Establish the Agent-Work Contract feature foundation: Zod schemas, types, and feature structure. This is the contract-first layer that all subsequent engine and tool work depends on.

Purpose: Provide machine-validated (Zod) contract structures that downstream engine and tools consume. Uses JSON format per planning artifact decision.
Output: Feature directory structure with validated schemas at `src/features/agent-work-contract/schema/`
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.experimental-planning/the-agent-work-contract-planning-artifact.md
@/Users/apple/hivemind-plugin/src/features/session-entry/start-work-types.ts
</execution_context>

<context>
## Conflict Resolution (MANDATORY)

| Conflict | Existing | Proposed | Resolution |
|----------|----------|----------|------------|
| `event-handler.ts` | `src/hooks/event-handler.ts` | `src/features/agent-work-contract/hooks/event-handler.ts` | **MUST rename** to `agent-work-event-handler.ts` to avoid shadowing |
| `session.compacting` | `workflow-integration/` already handles | New `compaction-hook.ts` | **REUSE existing hook**, extend it with contract preservation |
| Contract tools | Overlap with `hivemind_task`, `hivemind_trajectory` | New contract tools | Ensure delegation NOT duplication |

## Schema Format Decision

**JSON** (not YAML, not MD, not XML) — per planning artifact:
- Native `JSON.parse/stringify`, zero deps
- Zod validation + TypeScript inference
- RFC 6902 patch support via json-render SpecStream pattern

## Key SDK Types (from opencode-api-sdk.xml line 382700)

```typescript
export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string      // Prefer over process.cwd()
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Promise<void>
}
```

Tool args MUST use `tool.schema` (Zod re-export):
```typescript
import { tool } from '@opencode-ai/plugin'
const s = tool.schema  // IS zod
```
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create Agent-Work Contract Zod Schemas</name>
  <files>
    src/features/agent-work-contract/schema/contract.ts
    src/features/agent-work-contract/schema/intent.ts
    src/features/agent-work-contract/schema/delegation.ts
    src/features/agent-work-contract/schema/index.ts
  </files>
  <behavior>
    - Schema parses valid contract JSON without throwing
    - Schema rejects invalid contract JSON (missing required fields, wrong types)
    - PurposeClass enum accepts only defined values
    - DelegationMode enum accepts only defined values
    - ResponseMode enum accepts only defined values
    - Task status transitions are validated
    - ChainActions enum values are validated
  </behavior>
  <action>
    Create `src/features/agent-work-contract/schema/` directory structure.

    **contract.ts** — Core contract schema based on planning artifact:
    ```typescript
    import { z } from 'zod'
    
    const PurposeClassSchema = z.enum([
      'quick-action', 'research-brainstorm', 'project-driven'
    ])
    
    const DelegationModeSchema = z.enum(['parallel', 'sequential', 'handoff'])
    
    const ResponseModeSchema = z.enum([
      'broad-search-execute',
      'interactive-qa',
      'deep-research',
    ])
    
    const TaskSchema = z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(['pending', 'active', 'delegated', 'verifying', 'complete']),
      parentTaskId: z.string().optional(),
      dependencyIds: z.array(z.string()).optional(),
      delegationMode: DelegationModeSchema.optional(),
      delegationSessionId: z.string().optional(),
      evidenceRefs: z.array(z.string()).optional(),
    })
    
    export const AgentWorkContractSchema = z.object({
      // Identity
      contractId: z.string(),
      sessionId: z.string(),
      delegationExportSessionId: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      // User Intent
      userIntent: z.object({
        raw: z.string(),
        confidence: z.number(),
        purposeClass: PurposeClassSchema,
        requiresPlan: z.boolean(),
        requiresGovernance: z.boolean(),
      }),
      // Response Mode
      responseMode: ResponseModeSchema,
      // Workflow Frame
      workflow: z.object({
        planningPath: z.string().optional(),
        phase: z.string().optional(),
        outlineRef: z.string().optional(),
        tasks: z.array(TaskSchema),
      }),
      // Chain Actions
      chainActions: z.object({
        onTaskComplete: z.enum(['export-workflow', 'next-task', 'close']),
        onWorkflowEnd: z.enum(['export-contract', 'archive']),
        onDelegation: z.enum(['export-messages', 'handoff-packet']),
        onCompaction80: z.enum(['launch-context-agent', 'export-summary']),
      }),
      // Briefing
      briefing: z.object({
        summary: z.string(),
        workflowState: z.string(),
        followUp: z.array(z.string()),
      }).optional(),
      // Anchor Points
      anchors: z.array(z.object({
        timestamp: z.string(),
        kind: z.enum(['workflow-shift', 'planning-shift', 'stage-shift', 'user-redirect']),
        description: z.string(),
        snapshotRef: z.string().optional(),
      })).optional(),
    })
    
    export type AgentWorkContract = z.infer<typeof AgentWorkContractSchema>
    export type PurposeClass = z.infer<typeof PurposeClassSchema>
    export type DelegationMode = z.infer<typeof DelegationModeSchema>
    export type ResponseMode = z.infer<typeof ResponseModeSchema>
    export type TaskStatus = z.infer<typeof TaskSchema>['status']
    export type ChainActionTrigger = keyof z.infer<typeof AgentWorkContractSchema>['chainActions']
    ```

    **intent.ts** — Intent classification schema:
    ```typescript
    import { z } from 'zod'
    
    const IntentSignalSchema = z.object({
      raw: z.string(),
      confidence: z.number(),
      purposeClass: PurposeClassSchema,
      requiresPlan: z.boolean(),
      requiresGovernance: z.boolean(),
    })
    
    // Classification result
    export const IntentClassificationSchema = z.object({
      intent: IntentSignalSchema,
      reasoning: z.array(z.string()),
      suggestedResponseMode: ResponseModeSchema,
    })
    
    export type IntentClassification = z.infer<typeof IntentClassificationSchema>
    ```

    **delegation.ts** — Delegation sub-schemas:
    ```typescript
    import { z } from 'zod'
    
    export const DelegationRecordSchema = z.object({
      delegationId: z.string(),
      contractId: z.string(),
      parentSessionId: z.string(),
      childSessionId: z.string(),
      mode: DelegationModeSchema,
      delegatedTaskIds: z.array(z.string()),
      createdAt: z.string(),
      completedAt: z.string().optional(),
      status: z.enum(['pending', 'active', 'completed', 'failed', 'timed-out']),
      evidenceRefs: z.array(z.string()).optional(),
    })
    
    export const HandoffPacketSchema = z.object({
      delegationId: z.string(),
      sourceSessionId: z.string(),
      targetSessionId: z.string(),
      contractRef: z.string(),
      taskRefs: z.array(z.string()),
      context: z.object({
        summary: z.string(),
        workflowState: z.string(),
        followUp: z.array(z.string()),
      }),
      exportedAt: z.string(),
    })
    
    export type DelegationRecord = z.infer<typeof DelegationRecordSchema>
    export type HandoffPacket = z.infer<typeof HandoffPacketSchema>
    ```

    **index.ts** — Barrel export:
    ```typescript
    export * from './contract.js'
    export * from './intent.js'
    export * from './delegation.js'
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit src/features/agent-work-contract/schema/*.ts</automated>
  </verify>
  <done>
    AgentWorkContractSchema parses valid contracts, rejects invalid ones.
    All types exported for consumption by engine and tools.
    Zod schemas validate at runtime and provide TypeScript inference at compile time.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create Feature Types and Directory Structure</name>
  <files>
    src/features/agent-work-contract/types.ts
    src/features/agent-work-contract/index.ts
    src/features/agent-work-contract/engine/.gitkeep
    src/features/agent-work-contract/hooks/.gitkeep
    src/features/agent-work-contract/tools/.gitkeep
  </files>
  <action>
    Create `src/features/agent-work-contract/types.ts` — All TypeScript interfaces for the feature:
    
    ```typescript
    // Re-export from schemas for convenience
    export type {
      AgentWorkContract,
      PurposeClass,
      DelegationMode,
      ResponseMode,
      TaskStatus,
      ChainActionTrigger,
    } from './schema/index.js'
    
    export type { IntentClassification } from './schema/intent.js'
    export type { DelegationRecord, HandoffPacket } from './schema/delegation.js'
    
    // Contract store operations
    export interface ContractStoreOperations {
      create(contract: AgentWorkContract): Promise<void>
      get(contractId: string): Promise<AgentWorkContract | null>
      update(contractId: string, updates: Partial<AgentWorkContract>): Promise<void>
      delete(contractId: string): Promise<void>
      list(sessionId: string): Promise<AgentWorkContract[]>
      archive(contractId: string): Promise<void>
    }
    
    // Intent classifier operations
    export interface IntentClassifierResult {
      intent: IntentClassification
      confidence: number
    }
    
    // Response mode resolver
    export interface ResponseModeResolver {
      resolve(purposeClass: PurposeClass): ResponseMode
    }
    
    // Anchor recorder
    export interface AnchorPoint {
      timestamp: string
      kind: 'workflow-shift' | 'planning-shift' | 'stage-shift' | 'user-redirect'
      description: string
      snapshotRef?: string
    }
    
    // Chain executor events
    export type ChainActionEvent = 
      | { trigger: 'onTaskComplete'; payload: { contractId: string; taskId: string } }
      | { trigger: 'onWorkflowEnd'; payload: { contractId: string } }
      | { trigger: 'onDelegation'; payload: { contractId: string; delegationId: string } }
      | { trigger: 'onCompaction80'; payload: { contractId: string } }
    ```

    Create `src/features/agent-work-contract/index.ts` — Feature barrel:
    ```typescript
    // Schema exports
    export * from './schema/index.js'
    
    // Type exports
    export * from './types.js'
    
    // Placeholder — engine, hooks, tools follow in subsequent plans
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit src/features/agent-work-contract/types.ts</automated>
  </verify>
  <done>
    Feature directory structure established with types.ts and index.ts.
    All TypeScript interfaces co-located for easy consumption.
    Placeholder directories created for engine/, hooks/, tools/ to be filled by subsequent plans.
  </done>
</task>

</tasks>

<verification>
1. Schema files parse without errors: `npx tsc --noEmit`
2. Zod safeParse tests pass for valid and invalid inputs
3. All types are re-exported correctly
4. No import conflicts with existing `src/hooks/event-handler.ts`
</verification>

<success_criteria>
- [x] `src/features/agent-work-contract/schema/` directory with contract.ts, intent.ts, delegation.ts, index.ts
- [x] AgentWorkContractSchema validates correct contract structure
- [x] All enums (PurposeClass, DelegationMode, ResponseMode, TaskStatus, ChainActionTrigger) defined
- [x] TypeScript interfaces exported for engine and tool consumption
- [x] Feature barrel at `src/features/agent-work-contract/index.ts`
- [x] No file shadowing with existing `src/hooks/event-handler.ts`
</success_criteria>

<output>
After completion, create `.planning/phases/agent-work-contract/agent-work-contract-01-SUMMARY.md`
</output>
