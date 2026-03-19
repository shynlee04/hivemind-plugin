---
phase: agent-work-contract
plan: 02
type: execute
wave: 2
depends_on:
  - agent-work-contract-01
files_modified:
  - src/features/agent-work-contract/engine/contract-store.ts
  - src/features/agent-work-contract/engine/intent-classifier.ts
  - src/features/agent-work-contract/engine/response-mode-resolver.ts
  - src/features/agent-work-contract/engine/anchor-recorder.ts
  - src/features/agent-work-contract/engine/chain-executor.ts
  - src/features/agent-work-contract/engine/index.ts
autonomous: true
requirements:
  - AWC-01
  - AWC-02
  - AWC-04

must_haves:
  truths:
    - "Contract store provides atomic create/read/update/delete/list/archive operations"
    - "Intent classifier maps raw messages to PurposeClass with confidence scores"
    - "Response mode resolver provides deterministic purpose-to-mode mapping"
    - "Anchor recorder captures decision shifts with timestamps"
    - "Chain executor dispatches actions based on trigger type"
    - "All operations use proper-lockfile for atomicity"
  artifacts:
    - path: "src/features/agent-work-contract/engine/contract-store.ts"
      provides: "ContractStoreOperations with atomic CRUD via proper-lockfile"
      min_lines: 100
    - path: "src/features/agent-work-contract/engine/intent-classifier.ts"
      provides: "classifyIntent() function mapping raw messages to PurposeClass"
      min_lines: 80
    - path: "src/features/agent-work-contract/engine/response-mode-resolver.ts"
      provides: "resolveResponseMode() deterministic mapping"
      min_lines: 30
    - path: "src/features/agent-work-contract/engine/anchor-recorder.ts"
      provides: "createAnchorRecorder() for decision shift recording"
      min_lines: 50
    - path: "src/features/agent-work-contract/engine/chain-executor.ts"
      provides: "createChainExecutor() dispatching on task/workflow/delegation/compaction"
      min_lines: 60
    - path: "src/features/agent-work-contract/engine/index.ts"
      provides: "Barrel export for engine"
      min_lines: 10
  key_links:
    - from: "src/features/agent-work-contract/engine/contract-store.ts"
      to: ".hivemind/agent-work-contract/"
      via: "proper-lockfile writes"
      pattern: "flock\\.lock"
    - from: "src/features/agent-work-contract/engine/intent-classifier.ts"
      to: "src/features/agent-work-contract/schema/intent.ts"
      via: "import"
      pattern: "IntentClassificationSchema"
    - from: "src/features/agent-work-contract/hooks/*.ts"
      to: "src/features/agent-work-contract/engine/*.ts"
      via: "import"
      pattern: "createContractStore|createAnchorRecorder"
---

<objective>
Implement the Agent-Work Contract engine layer: contract persistence, intent classification, response mode resolution, anchor recording, and chain action execution.

Purpose: Provide the business logic layer that schema-validated contracts flow through. Engine operations are pure functions that don't depend on OpenCode hooks.
Output: Feature engine at `src/features/agent-work-contract/engine/`
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.planning/phases/agent-work-contract/agent-work-contract-01-PLAN.md
@/Users/apple/hivemind-plugin/src/shared/entry-kernel-state.ts
@/Users/apple/hivemind-plugin/src/core/trajectory/index.ts
</execution_context>

<context>
## Data Persistence Structure (from Planning Artifact)

```
.hivemind/agent-work-contract/
├── active-contract.json          # Current session's contract
├── contracts/
│   ├── {contract-id}.json        # Completed/archived contracts
│   └── ...
└── delegation/
    ├── {delegation-id}.json      # Sub-session delegation records
    └── ...
```

## Single Writer Authority (per Planning Artifact)

| State File | Single Writer |
|---|---|
| `trajectory-ledger.json` | `core/trajectory/trajectory-store.ts` |
| `runtime-attachment.json` | `features/runtime-entry/attachment.ts` |
| `entry-kernel-state.json` | `shared/entry-kernel-state.ts` |

Agent-Work Contract uses its own `.hivemind/agent-work-contract/` directory — no conflict with existing writers.

## Dependency on Plan 01

Plan 01 created the schemas. Plan 02 imports from:
- `src/features/agent-work-contract/schema/contract.ts` — AgentWorkContractSchema
- `src/features/agent-work-contract/schema/intent.ts` — IntentClassificationSchema  
- `src/features/agent-work-contract/schema/delegation.ts` — DelegationRecordSchema, HandoffPacketSchema
- `src/features/agent-work-contract/types.ts` — ContractStoreOperations, etc.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement Contract Store with Single-Writer Authority</name>
  <files>
    src/features/agent-work-contract/engine/contract-store.ts
    src/features/agent-work-contract/engine/contract-store.test.ts
  </files>
  <behavior>
    - create() writes contract to .hivemind/agent-work-contract/active-contract.json
    - get() reads and parses contract from disk
    - update() patches existing contract with safe merge
    - delete() removes contract from disk
    - list() returns all contracts for a sessionId
    - archive() moves contract from active to contracts/ subdirectory
    - All write operations use proper-lockfile for atomicity
    - Zod validation on read before returning
  </behavior>
  <action>
    Create `src/features/agent-work-contract/engine/contract-store.ts`:

    Uses `proper-lockfile` (already a dependency) for atomic writes:
    ```typescript
    import { promises as fs } from 'fs'
    import path from 'path'
    import flock from 'proper-lockfile'
    import { AgentWorkContractSchema, type AgentWorkContract } from '../schema/contract.js'
    
    const CONTRACT_DIR = '.hivemind/agent-work-contract'
    const ACTIVE_CONTRACT = 'active-contract.json'
    const CONTRACTS_DIR = 'contracts'
    const DELEGATION_DIR = 'delegation'
    
    function getContractPath(directory: string, contractId: string): string {
      return path.join(directory, CONTRACT_DIR, CONTRACTS_DIR, `${contractId}.json`)
    }
    
    function getActiveContractPath(directory: string): string {
      return path.join(directory, CONTRACT_DIR, ACTIVE_CONTRACT)
    }
    
    export interface ContractStoreOptions {
      projectRoot: string
    }
    
    export function createContractStore(options: ContractStoreOptions): ContractStoreOperations {
      const { projectRoot } = options
      
      async function ensureDirectories(): Promise<void> {
        await fs.mkdir(path.join(projectRoot, CONTRACT_DIR, CONTRACTS_DIR), { recursive: true })
        await fs.mkdir(path.join(projectRoot, CONTRACT_DIR, DELEGATION_DIR), { recursive: true })
      }
      
      async function create(contract: AgentWorkContract): Promise<void> {
        await ensureDirectories()
        const activePath = getActiveContractPath(projectRoot)
        const release = await flock.lock(activePath, { retries: 3 })
        try {
          await fs.writeFile(activePath, JSON.stringify(contract, null, 2), 'utf-8')
        } finally {
          await release()
        }
      }
      
      async function get(contractId: string): Promise<AgentWorkContract | null> {
        const contractPath = getContractPath(projectRoot, contractId)
        try {
          const content = await fs.readFile(contractPath, 'utf-8')
          const parsed = JSON.parse(content)
          return AgentWorkContractSchema.parse(parsed)
        } catch {
          return null
        }
      }
      
      async function getActive(): Promise<AgentWorkContract | null> {
        const activePath = getActiveContractPath(projectRoot)
        try {
          const content = await fs.readFile(activePath, 'utf-8')
          const parsed = JSON.parse(content)
          return AgentWorkContractSchema.parse(parsed)
        } catch {
          return null
        }
      }
      
      async function update(contractId: string, updates: Partial<AgentWorkContract>): Promise<void> {
        const existing = await get(contractId)
        if (!existing) throw new Error(`Contract ${contractId} not found`)
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
        const contractPath = getContractPath(projectRoot, contractId)
        const release = await flock.lock(contractPath, { retries: 3 })
        try {
          await fs.writeFile(contractPath, JSON.stringify(updated, null, 2), 'utf-8')
        } finally {
          await release()
        }
      }
      
      async function deleteContract(contractId: string): Promise<void> {
        const contractPath = getContractPath(projectRoot, contractId)
        await fs.unlink(contractPath)
      }
      
      async function list(sessionId: string): Promise<AgentWorkContract[]> {
        const contractsDir = path.join(projectRoot, CONTRACT_DIR, CONTRACTS_DIR)
        try {
          const files = await fs.readdir(contractsDir)
          const contracts: AgentWorkContract[] = []
          for (const file of files) {
            if (file.endsWith('.json')) {
              const content = await fs.readFile(path.join(contractsDir, file), 'utf-8')
              const parsed = JSON.parse(content)
              const contract = AgentWorkContractSchema.parse(parsed)
              if (contract.sessionId === sessionId) {
                contracts.push(contract)
              }
            }
          }
          return contracts
        } catch {
          return []
        }
      }
      
      async function archive(contractId: string): Promise<void> {
        const contract = await get(contractId)
        if (!contract) throw new Error(`Contract ${contractId} not found`)
        // Contract stays in contracts/ subdirectory — already archived structure
        // Just update the contract state to indicate it's archived
        await update(contractId, { ...contract })
      }
      
      return {
        create,
        get,
        update: update,
        delete: deleteContract,
        list,
        archive,
        // Internal helpers for other engine components
        getActive,
      }
    }
    ```

    Also create `contract-store.test.ts` with TDD tests:
    ```typescript
    import { describe, it, expect, beforeEach } from 'vitest'
    import { createContractStore } from './contract-store.js'
    import { promises as fs } from 'fs'
    import path from 'path'
    
    describe('ContractStore', () => {
      const testDir = '/tmp/contract-store-test'
      
      beforeEach(async () => {
        await fs.rm(testDir, { recursive: true, force: true })
        await fs.mkdir(path.join(testDir, '.hivemind/agent-work-contract/contracts'), { recursive: true })
      })
      
      it('creates and retrieves a contract', async () => {
        const store = createContractStore({ projectRoot: testDir })
        const contract = createTestContract()
        await store.create(contract)
        const retrieved = await store.get(contract.contractId)
        expect(retrieved).toEqual(contract)
      })
      
      it('returns null for non-existent contract', async () => {
        const store = createContractStore({ projectRoot: testDir })
        const retrieved = await store.get('non-existent')
        expect(retrieved).toBeNull()
      })
      
      // ... more tests
    })
    ```
  </action>
  <verify>
    <automated>npx vitest run src/features/agent-work-contract/engine/contract-store.test.ts</automated>
  </verify>
  <done>
    Contract store provides atomic create/read/update/delete/list operations.
    Uses proper-lockfile for write safety.
    Zod validation on all reads.
    Archived contracts stored in .hivemind/agent-work-contract/contracts/
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement Intent Classifier and Response Mode Resolver</name>
  <files>
    src/features/agent-work-contract/engine/intent-classifier.ts
    src/features/agent-work-contract/engine/intent-classifier.test.ts
    src/features/agent-work-contract/engine/response-mode-resolver.ts
    src/features/agent-work-contract/engine/response-mode-resolver.test.ts
  </files>
  <behavior>
    - classifyIntent() takes raw user message, returns IntentClassification with confidence score
    - Purpose class mapped correctly: quick actions vs research vs project-driven
    - Response mode resolved from purpose class: broad-search-execute for implementation, interactive-qa for brainstorming, deep-research for research
    - Reasoning provided for classification
  </behavior>
  <action>
    Create `intent-classifier.ts`:
    ```typescript
    import { type IntentClassification, IntentClassificationSchema } from '../schema/intent.js'
    import type { PurposeClass, ResponseMode } from '../schema/contract.js'
    
    interface ClassifyIntentOptions {
      rawMessage: string
      sessionScope?: 'main' | 'sub-session'
      hasAttachments?: boolean
      turnCount?: number
    }
    
    const QUICK_ACTION_PATTERNS = [
      /\b(quick|fast|simple|immediate|now)\b/i,
      /\b(show|list|get|find)\s+(me\s+)?/i,
      /\b(what|who|when|where)\b/i,
    ]
    
    const RESEARCH_PATTERNS = [
      /\b(research|investigate|explore|analyze)\b/i,
      /\b(compare|evaluate|assess)\b/i,
      /\b(find\s+out|look\s+into|dive\s+into)\b/i,
    ]
    
    const PROJECT_PATTERNS = [
      /\b(plan|build|create|implement|develop)\b/i,
      /\b(project|task|todo)\b/i,
      /\b(roadmap|sprint|backlog)\b/i,
    ]
    
    function calculatePurposeClass(message: string, options: ClassifyIntentOptions): { purposeClass: PurposeClass; confidence: number; reasons: string[] } {
      const reasons: string[] = []
      let quickScore = 0
      let researchScore = 0
      let projectScore = 0
      
      for (const pattern of QUICK_ACTION_PATTERNS) {
        if (pattern.test(message)) {
          quickScore++
          reasons.push(`matches quick-action pattern: ${pattern}`)
        }
      }
      
      for (const pattern of RESEARCH_PATTERNS) {
        if (pattern.test(message)) {
          researchScore++
          reasons.push(`matches research pattern: ${pattern}`)
        }
      }
      
      for (const pattern of PROJECT_PATTERNS) {
        if (pattern.test(message)) {
          projectScore++
          reasons.push(`matches project pattern: ${pattern}`)
        }
      }
      
      if (options.sessionScope === 'sub-session') {
        projectScore += 2
        reasons.push('sub-session indicates project work')
      }
      
      if (options.turnCount && options.turnCount > 10) {
        projectScore += 2
        reasons.push('long session indicates project work')
      }
      
      if (options.hasAttachments) {
        researchScore += 1
        reasons.push('has attachments indicating investigation')
      }
      
      const maxScore = Math.max(quickScore, researchScore, projectScore)
      if (maxScore === 0) {
        return { purposeClass: 'quick-action', confidence: 0.5, reasons: ['defaulting to quick-action'] }
      }
      
      if (maxScore === quickScore) return { purposeClass: 'quick-action', confidence: Math.min(0.9, 0.5 + quickScore * 0.2), reasons }
      if (maxScore === researchScore) return { purposeClass: 'research-brainstorm', confidence: Math.min(0.9, 0.5 + researchScore * 0.2), reasons }
      return { purposeClass: 'project-driven', confidence: Math.min(0.9, 0.5 + projectScore * 0.2), reasons }
    }
    
    export function classifyIntent(options: ClassifyIntentOptions): IntentClassification {
      const { purposeClass, confidence, reasons } = calculatePurposeClass(options.rawMessage, options)
      const suggestedResponseMode = resolveResponseMode(purposeClass)
      
      return IntentClassificationSchema.parse({
        intent: {
          raw: options.rawMessage,
          confidence,
          purposeClass,
          requiresPlan: purposeClass === 'project-driven',
          requiresGovernance: purposeClass === 'project-driven',
        },
        reasoning: reasons,
        suggestedResponseMode,
      })
    }
    
    function resolveResponseMode(purposeClass: PurposeClass): ResponseMode {
      switch (purposeClass) {
        case 'quick-action': return 'broad-search-execute'
        case 'research-brainstorm': return 'interactive-qa'
        case 'project-driven': return 'deep-research'
      }
    }
    ```

    Create `response-mode-resolver.ts`:
    ```typescript
    import type { PurposeClass, ResponseMode } from '../schema/contract.js'
    
    const RESPONSE_MODE_MAP: Record<PurposeClass, ResponseMode> = {
      'quick-action': 'broad-search-execute',
      'research-brainstorm': 'interactive-qa',
      'project-driven': 'deep-research',
    }
    
    export function resolveResponseMode(purposeClass: PurposeClass): ResponseMode {
      return RESPONSE_MODE_MAP[purposeClass]
    }
    
    export function resolveResponseModeFromOptions(options: {
      purposeClass: PurposeClass
      confidence: number
      hasMultipleIntents?: boolean
    }): ResponseMode {
      // Higher confidence = use suggested mode
      // Mixed intents = interactive-qa
      if (options.hasMultipleIntents) {
        return 'interactive-qa'
      }
      return RESPONSE_MODE_MAP[options.purposeClass]
    }
    ```
  </action>
  <verify>
    <automated>npx vitest run src/features/agent-work-contract/engine/intent-classifier.test.ts src/features/agent-work-contract/engine/response-mode-resolver.test.ts</automated>
  </verify>
  <done>
    Intent classifier maps raw user messages to PurposeClass with confidence scoring.
    Response mode resolver provides deterministic mapping.
    Both functions are pure and testable.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement Anchor Recorder and Chain Executor</name>
  <files>
    src/features/agent-work-contract/engine/anchor-recorder.ts
    src/features/agent-work-contract/engine/anchor-recorder.test.ts
    src/features/agent-work-contract/engine/chain-executor.ts
    src/features/agent-work-contract/engine/chain-executor.test.ts
    src/features/agent-work-contract/engine/index.ts
  </files>
  <behavior>
    - recordAnchor() appends anchor point to contract's anchors array
    - Chain executor dispatches appropriate action based on trigger type
    - onTaskComplete, onWorkflowEnd, onDelegation, onCompaction80 all handled
    - Chain actions are dispatched to registered handlers
  </behavior>
  <action>
    Create `anchor-recorder.ts`:
    ```typescript
    import type { AnchorPoint, ContractStoreOperations } from '../types.js'
    import type { AgentWorkContract } from '../schema/contract.js'
    
    export interface AnchorRecorderOptions {
      store: Pick<ContractStoreOperations, 'get' | 'update'>
      projectRoot: string
    }
    
    export function createAnchorRecorder(options: AnchorRecorderOptions) {
      return {
        async recordAnchor(
          contractId: string,
          anchor: Omit<AnchorPoint, 'timestamp'>
        ): Promise<void> {
          const contract = await options.store.get(contractId)
          if (!contract) throw new Error(`Contract ${contractId} not found`)
          
          const newAnchor: AnchorPoint = {
            ...anchor,
            timestamp: new Date().toISOString(),
          }
          
          const anchors = contract.anchors ?? []
          await options.store.update(contractId, {
            anchors: [...anchors, newAnchor],
          })
        },
        
        async recordWorkflowShift(contractId: string, description: string, snapshotRef?: string) {
          await this.recordAnchor({ kind: 'workflow-shift', description, snapshotRef })
        },
        
        async recordPlanningShift(contractId: string, description: string, snapshotRef?: string) {
          await this.recordAnchor({ kind: 'planning-shift', description, snapshotRef })
        },
        
        async recordStageShift(contractId: string, description: string, snapshotRef?: string) {
          await this.recordAnchor({ kind: 'stage-shift', description, snapshotRef })
        },
        
        async recordUserRedirect(contractId: string, description: string, snapshotRef?: string) {
          await this.recordAnchor({ kind: 'user-redirect', description, snapshotRef })
        },
      }
    }
    ```

    Create `chain-executor.ts`:
    ```typescript
    import type { ChainActionEvent, ContractStoreOperations } from '../types.js'
    import type { AgentWorkContract } from '../schema/contract.js'
    
    export interface ChainExecutorHandlers {
      onTaskComplete?: (payload: { contractId: string; taskId: string; contract: AgentWorkContract }) => Promise<void>
      onWorkflowEnd?: (payload: { contractId: string; contract: AgentWorkContract }) => Promise<void>
      onDelegation?: (payload: { contractId: string; delegationId: string; contract: AgentWorkContract }) => Promise<void>
      onCompaction80?: (payload: { contractId: string; contract: AgentWorkContract }) => Promise<void>
    }
    
    export interface ChainExecutorOptions {
      store: Pick<ContractStoreOperations, 'get' | 'update' | 'getActive'>
      handlers: ChainExecutorHandlers
    }
    
    export function createChainExecutor(options: ChainExecutorOptions) {
      async function execute(event: ChainActionEvent): Promise<void> {
        switch (event.trigger) {
          case 'onTaskComplete': {
            const contract = await options.store.get(event.payload.contractId)
            if (!contract) return
            await options.handlers.onTaskComplete?.({
              contractId: event.payload.contractId,
              taskId: event.payload.taskId,
              contract,
            })
            break
          }
          case 'onWorkflowEnd': {
            const contract = await options.store.get(event.payload.contractId)
            if (!contract) return
            await options.handlers.onWorkflowEnd?.({
              contractId: event.payload.contractId,
              contract,
            })
            break
          }
          case 'onDelegation': {
            const contract = await options.store.get(event.payload.contractId)
            if (!contract) return
            await options.handlers.onDelegation?.({
              contractId: event.payload.contractId,
              delegationId: event.payload.delegationId,
              contract,
            })
            break
          }
          case 'onCompaction80': {
            const contract = await options.store.get(event.payload.contractId)
            if (!contract) return
            await options.handlers.onCompaction80?.({
              contractId: event.payload.contractId,
              contract,
            })
            break
          }
        }
      }
      
      return { execute }
    }
    ```

    Create `engine/index.ts`:
    ```typescript
    export * from './contract-store.js'
    export * from './intent-classifier.js'
    export * from './response-mode-resolver.js'
    export * from './anchor-recorder.js'
    export * from './chain-executor.js'
    ```
  </action>
  <verify>
    <automated>npx vitest run src/features/agent-work-contract/engine/*.test.ts</automated>
  </verify>
  <done>
    Anchor recorder captures decision shifts with timestamps.
    Chain executor dispatches actions to registered handlers based on trigger type.
    All operations return Promises for async behavior.
  </done>
</task>

</tasks>

<verification>
1. All engine tests pass: `npx vitest run src/features/agent-work-contract/engine/`
2. Contract store uses proper-lockfile for atomic writes
3. Zod validation on all reads
4. No direct state file conflicts with existing writers (uses .hivemind/agent-work-contract/)
</verification>

<success_criteria>
- [x] Contract store with atomic create/read/update/delete/list/archive operations
- [x] Intent classifier maps raw messages to PurposeClass with confidence
- [x] Response mode resolver provides deterministic mapping
- [x] Anchor recorder captures decision shifts with timestamps
- [x] Chain executor dispatches actions based on trigger type
- [x] TDD tests for all engine components
- [x] Uses proper-lockfile for write safety
- [x] Uses .hivemind/agent-work-contract/ directory (no conflicts with existing state writers)
</success_criteria>

<output>
After completion, create `.planning/phases/agent-work-contract/agent-work-contract-02-SUMMARY.md`
</output>
