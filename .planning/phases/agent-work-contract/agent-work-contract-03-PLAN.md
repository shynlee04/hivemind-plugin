---
phase: agent-work-contract
plan: 03
type: execute
wave: 3
depends_on:
  - agent-work-contract-02
files_modified:
  - src/features/agent-work-contract/hooks/agent-work-event-handler.ts
  - src/features/agent-work-contract/hooks/compaction-preservation.ts
  - src/features/agent-work-contract/hooks/index.ts
  - src/features/agent-work-contract/tools/create-contract-tool.ts
  - src/features/agent-work-contract/tools/classify-intent-tool.ts
  - src/features/agent-work-contract/tools/export-contract-tool.ts
  - src/features/agent-work-contract/tools/index.ts
autonomous: false
requirements:
  - AWC-03
  - AWC-05

must_haves:
  truths:
    - "Event handler named agent-work-event-handler.ts (no shadowing of src/hooks/event-handler.ts)"
    - "session.compacting hook EXTENDED via buildContractCompactionPreservation() not duplicated"
    - "Compaction preservation written to .hivemind/agent-work-contract/compaction/"
    - "Tools delegate to hivemind_task (tasks) and hivemind_trajectory (evidence) not duplicating"
    - "All tool args use tool.schema (Zod) with .describe() for agent introspection"
    - "Tools return JSON.stringify() and use ToolContext correctly"
  artifacts:
    - path: "src/features/agent-work-contract/hooks/agent-work-event-handler.ts"
      provides: "createAgentWorkEventHandler() for session.created/session.compacted"
      min_lines: 60
    - path: "src/features/agent-work-contract/hooks/compaction-preservation.ts"
      provides: "buildContractCompactionPreservation() extension function"
      min_lines: 60
    - path: "src/features/agent-work-contract/tools/create-contract-tool.ts"
      provides: "create-contract tool with delegation to hivemind_task"
      min_lines: 120
    - path: "src/features/agent-work-contract/tools/classify-intent-tool.ts"
      provides: "classify-intent tool for pure intent classification"
      min_lines: 40
    - path: "src/features/agent-work-contract/tools/export-contract-tool.ts"
      provides: "export-contract tool with delegation to hivemind_trajectory"
      min_lines: 80
  key_links:
    - from: "src/plugin/opencode-plugin.ts"
      to: "src/features/agent-work-contract/hooks/agent-work-event-handler.ts"
      via: "import and register"
      pattern: "createAgentWorkEventHandler"
    - from: "src/hooks/workflow-integration/workflow-continuity.ts"
      to: "src/features/agent-work-contract/hooks/compaction-preservation.ts"
      via: "import and call"
      pattern: "buildContractCompactionPreservation"
    - from: "src/features/agent-work-contract/tools/create-contract-tool.ts"
      to: "hivemind_task"
      via: "delegate signal in return"
      pattern: "delegateTo.*hivemind_task"
    - from: "src/features/agent-work-contract/tools/export-contract-tool.ts"
      to: "hivemind_trajectory"
      via: "delegate signal in return"
      pattern: "delegateTo.*hivemind_trajectory"
---

<objective>
Implement Agent-Work Contract hooks and tools. 

CRITICAL CONFLICTS TO RESOLVE:
1. **event-handler.ts naming** — existing `src/hooks/event-handler.ts` MUST be shadowed by renaming to `agent-work-event-handler.ts`
2. **session.compacting REUSE** — existing `workflow-integration/` already handles this hook. Extend it, don't duplicate.
3. **Tool delegation** — Tools must delegate to existing hivemind_task, hivemind_trajectory, NOT duplicate them.

Purpose: Wire the engine layer to OpenCode hooks and expose contract operations as agent-callable tools.
Output: Feature hooks and tools at `src/features/agent-work-contract/hooks/` and `src/features/agent-work-contract/tools/`
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.planning/phases/agent-work-contract/agent-work-contract-02-PLAN.md
@/Users/apple/hivemind-plugin/src/hooks/event-handler.ts
@/Users/apple/hivemind-plugin/src/hooks/workflow-integration/workflow-continuity.ts
@/Users/apple/hivemind-plugin/src/plugin/opencode-plugin.ts
</execution_context>

<context>
## Hook Registration Strategy

**CRITICAL**: Hooks in `src/hooks/` register at plugin init in `src/plugin/opencode-plugin.ts`.

For Agent-Work Contract hooks, we have TWO options:
1. Register new hooks in `opencode-plugin.ts` (new hook registration)
2. Extend existing hooks in `workflow-integration/` (preferred — no duplication)

**Decision: Extend existing `session.compacting` hook, register new `event` handler separately**

| Hook | Existing Handler | Agent-Work Extension |
|------|-----------------|---------------------|
| `session.compacting` | `workflow-integration/` | Add contract preservation logic |
| `event` | `src/hooks/event-handler.ts` | Create new `agent-work-event-handler.ts` (NOT event-handler.ts to avoid shadowing) |

## Tool Delegation Strategy

**CRITICAL**: Agent-Work Contract tools must NOT duplicate existing tools.

| Existing Tool | What It Does | Delegation Pattern |
|--------------|--------------|-------------------|
| `hivemind_task` | Task CRUD | Contract tools add tasks via this tool |
| `hivemind_trajectory` | Trajectory recording | Contract tools record via this tool |
| `hivemind_handoff` | Handoff packets | Contract delegation uses this tool |

**Agent-Work Contract tools are CONTRACT-LEVEL wrappers**:
- `create-contract-tool` — creates contract, delegates task creation to hivemind_task
- `classify-intent-tool` — classifies intent (pure function, no delegation needed)
- `export-contract-tool` — exports workflow, delegates to hivemind_trajectory for evidence

## SDK Hook Names

Per planning artifact and SDK research:
- `session.compacting` → `experimental.session.compacting`
- `event` → `event`
- `tool.execute.before` → `tool.execute.before`
- `tool.execute.after` → `tool.execute.after`
- `permission.ask` → `permission.ask`

Code uses actual SDK keys (e.g., `experimental.session.compacting`), documentation uses canonical names (e.g., `session.compacting`).
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create Agent-Work Event Handler (renamed to avoid shadowing)</name>
  <files>
    src/features/agent-work-contract/hooks/agent-work-event-handler.ts
    src/features/agent-work-contract/hooks/agent-work-event-handler.test.ts
  </files>
  <behavior>
    - Hook handler created with createAgentWorkEventHandler(directory)
    - Handles session.created event to initialize contract if needed
    - Handles session.compacted event to record anchor
    - Records trajectory events via existing trajectory module
    - Does NOT shadow existing src/hooks/event-handler.ts
  </behavior>
  <action>
    Create `src/features/agent-work-contract/hooks/agent-work-event-handler.ts`:
    
    **IMPORTANT**: File is named `agent-work-event-handler.ts` NOT `event-handler.ts` to avoid shadowing the existing `src/hooks/event-handler.ts`.
    
    ```typescript
    import type { Event } from '@opencode-ai/sdk'
    import { createContractStore } from '../engine/contract-store.js'
    import { createAnchorRecorder } from '../engine/anchor-recorder.js'
    import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
    import { AgentWorkContractSchema } from '../schema/contract.js'
    
    function normalizeEventSummary(event: Event): string {
      if (!event || typeof event !== 'object' || !('type' in event)) {
        return 'event:unknown'
      }
      return `event:${String(event.type)}`
    }
    
    /**
     * Create an event handler for Agent-Work Contract lifecycle events.
     * 
     * NOTE: This file is named agent-work-event-handler.ts to avoid
     * shadowing the existing src/hooks/event-handler.ts
     */
    export function createAgentWorkEventHandler(directory: string) {
      const store = createContractStore({ projectRoot: directory })
      const anchorRecorder = createAnchorRecorder({ store, projectRoot: directory })
      
      return async (input: { event: Event }): Promise<void> => {
        const event = input.event
        
        // Get active contract if exists
        const activeContract = await store.getActive()
        if (!activeContract) {
          // No active contract — nothing to do
          return
        }
        
        // Record trajectory event for all events
        if (activeContract.sessionId) {
          await recordTrajectoryEvent(directory, activeContract.sessionId, {
            kind: 'note',
            summary: normalizeEventSummary(event),
            evidenceRefs: activeContract.workflow?.tasks?.map(t => t.id) ?? [],
          })
        }
        
        // Handle session.compacted — record anchor
        if (event.type === 'session.compacted') {
          await anchorRecorder.recordAnchor({
            kind: 'stage-shift',
            description: `Session compacted at ${new Date().toISOString()}`,
            snapshotRef: `session.compacted:${activeContract.sessionId}`,
          })
        }
        
        // Handle session.created — initialize contract if needed
        if (event.type === 'session.created') {
          // Contract is already initialized — just record the anchor
          await anchorRecorder.recordAnchor({
            kind: 'workflow-shift',
            description: 'New session created',
            snapshotRef: `session.created:${activeContract.sessionId}`,
          })
        }
      }
    }
    ```

    Create test file `agent-work-event-handler.test.ts`:
    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'
    import { createAgentWorkEventHandler } from './agent-work-event-handler'
    
    describe('createAgentWorkEventHandler', () => {
      const mockDirectory = '/tmp/agent-work-test'
      
      beforeEach(() => {
        vi.clearAllMocks()
      })
      
      it('does nothing when no active contract exists', async () => {
        const handler = createAgentWorkEventHandler(mockDirectory)
        await handler({ event: { type: 'session.created' } })
        // Should not throw
      })
      
      it('records anchor on session.compacted when contract active', async () => {
        // ... test implementation
      })
    })
    ```
  </action>
  <verify>
    <automated>npx vitest run src/features/agent-work-contract/hooks/agent-work-event-handler.test.ts</automated>
  </verify>
  <done>
    Event handler named agent-work-event-handler.ts (avoids shadowing).
    Handles session.created and session.compacted events.
    Records trajectory events via existing trajectory module.
    Records anchors for session lifecycle changes.
  </done>
</task>

<task type="auto">
  <name>Task 2: Extend session.compacting Hook for Contract Preservation</name>
  <files>
    src/features/agent-work-contract/hooks/compaction-preservation.ts
    src/features/agent-work-contract/hooks/index.ts
  </files>
  <action>
    Create `src/features/agent-work-contract/hooks/compaction-preservation.ts`:
    
    **CRITICAL**: This EXTENDS the existing workflow-integration session.compacting hook.
    It does NOT create a new hook registration. The preservation logic is additive.
    
    ```typescript
    import type { SessionCompactingEvent } from '@opencode-ai/sdk'
    import { createContractStore } from '../engine/contract-store.js'
    import { createChainExecutor } from '../engine/chain-executor.js'
    
    /**
     * Build contract preservation logic for session.compacting hook.
     * 
     * This is an EXTENSION FUNCTION that the existing workflow-integration
     * hook calls, NOT a new hook registration.
     * 
     * The existing session.compacting handler in workflow-integration/
     * is the authoritative hook. This function provides the contract-specific
     * preservation behavior to add to it.
     */
    export function buildContractCompactionPreservation(directory: string) {
      const store = createContractStore({ projectRoot: directory })
      
      return async (event: SessionCompactingEvent): Promise<void> => {
        const activeContract = await store.getActive()
        if (!activeContract) {
          // No active contract — nothing to preserve
          return
        }
        
        // Build compaction packet for contract preservation
        const compactionPacket = {
          contractId: activeContract.contractId,
          sessionId: activeContract.sessionId,
          preservedAt: new Date().toISOString(),
          workflowState: activeContract.workflow,
          briefing: activeContract.briefing,
          anchors: activeContract.anchors,
          chainActions: activeContract.chainActions,
        }
        
        // Write preservation packet alongside the standard recovery checkpoint
        // The workflow-integration hook handles the standard recovery checkpoint
        // We add the contract-specific preservation
        const { promises: fs } = await import('fs')
        const path = await import('path')
        const preservationDir = path.join(directory, '.hivemind/agent-work-contract/compaction')
        await fs.mkdir(preservationDir, { recursive: true })
        await fs.writeFile(
          path.join(preservationDir, `${activeContract.contractId}.json`),
          JSON.stringify(compactionPacket, null, 2),
          'utf-8'
        )
        
        // Dispatch onCompaction80 chain action if configured
        if (activeContract.chainActions.onCompaction80 === 'export-summary') {
          const chainExecutor = createChainExecutor({
            store,
            handlers: {
              async onCompaction80({ contractId }) {
                // Export summary to trajectory
                console.log(`Contract ${contractId} compaction summary exported`)
              },
            },
          })
          await chainExecutor.execute({
            trigger: 'onCompaction80',
            payload: { contractId: activeContract.contractId },
          })
        }
      }
    }
    ```

    Create `hooks/index.ts`:
    ```typescript
    export * from './agent-work-event-handler.js'
    export * from './compaction-preservation.js'
    ```
    
    **HOW TO INTEGRATE WITH EXISTING HOOK**:
    
    The existing `src/hooks/workflow-integration/workflow-continuity.ts` should be UPDATED to call `buildContractCompactionPreservation()`:
    
    ```typescript
    // In workflow-continuity.ts, add:
    import { buildContractCompactionPreservation } from '../../features/agent-work-contract/hooks/compaction-preservation.js'
    
    // In the session.compacting handler:
    const preserveContract = buildContractCompactionPreservation(directory)
    await preserveContract(event)
    ```
    
    This is the REUSE pattern, not DUPLICATION.
  </action>
  <verify>
    <automated>npx tsc --noEmit src/features/agent-work-contract/hooks/compaction-preservation.ts</automated>
  </verify>
  <done>
    Compaction preservation logic created as extension function.
    Existing workflow-integration hook should be updated to call this extension.
    Contract preservation packet written to .hivemind/agent-work-contract/compaction/
    onCompaction80 chain action dispatched if configured.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Register Hooks in opencode-plugin.ts (Human Verify)</name>
  <files>
    src/plugin/opencode-plugin.ts
  </files>
  <action>
    [Claude automated preparation - see what-built]
    The hook registrations have been prepared in the feature hooks. This checkpoint verifies the integration into opencode-plugin.ts is correct.
  </action>
  <what-built>
    Two new hook registrations in opencode-plugin.ts:
    1. `event` hook → `createAgentWorkEventHandler()` (renamed to avoid shadowing)
    2. Extension call to `buildContractCompactionPreservation()` in session.compacting handler
  </what-built>
  <how-to-verify>
    1. Open `src/plugin/opencode-plugin.ts`
    2. Find where `createEventHandler` is imported from `hooks/event-handler.js`
    3. Verify the import is unchanged (pointing to existing hook)
    4. Find where `buildWorkflowIntegrationState` is called in session.compacting handler
    5. Verify `buildContractCompactionPreservation` is imported from features/agent-work-contract/hooks/ and called AFTER the existing logic
    6. Confirm no duplicate hook registrations
  </how-to-verify>
  <verify>
    <manual>Human verification of opencode-plugin.ts integration</manual>
  </verify>
  <done>
    Hook integration verified by human. No duplicate registrations. Existing hooks preserved.
  </done>
  <resume-signal>
    Type "approved" or describe issues found
  </resume-signal>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Create Agent-Work Contract Tools (with delegation pattern)</name>
  <files>
    src/features/agent-work-contract/tools/create-contract-tool.ts
    src/features/agent-work-contract/tools/create-contract-tool.test.ts
    src/features/agent-work-contract/tools/classify-intent-tool.ts
    src/features/agent-work-contract/tools/classify-intent-tool.test.ts
    src/features/agent-work-contract/tools/export-contract-tool.ts
    src/features/agent-work-contract/tools/export-contract-tool.test.ts
    src/features/agent-work-contract/tools/index.ts
  </files>
  <behavior>
    - create-contract-tool: Creates/updates contracts, delegates task creation to hivemind_task
    - classify-intent-tool: Pure intent classification (no delegation needed)
    - export-contract-tool: Exports workflow summary, delegates evidence recording to hivemind_trajectory
    - All tools use tool.schema (Zod) for args
    - All tools return JSON.stringify()
    - ToolContext used for sessionID, directory, etc.
  </behavior>
  <action>
    Create `tools/create-contract-tool.ts`:
    
    **CRITICAL**: This tool DELEGATES task creation to hivemind_task, NOT implementing its own task logic.
    
    ```typescript
    import { tool } from '@opencode-ai/plugin'
    const s = tool.schema  // This IS zod
    
    import { createContractStore } from '../engine/contract-store.js'
    import { classifyIntent } from '../engine/intent-classifier.js'
    import { AgentWorkContractSchema } from '../schema/contract.js'
    
    function generateContractId(): string {
      return `contract-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    }
    
    export function createCreateContractTool(projectRoot: string) {
      return tool({
        description: 'Create or update an Agent-Work Contract for a session. Tasks are delegated to hivemind_task.',
        args: {
          action: s.enum(['create', 'update', 'addTask', 'completeTask']).describe('Operation to perform'),
          sessionId: s.string().describe('Session identifier'),
          userMessage: s.string().optional().describe('Raw user message for intent classification'),
          contractId: s.string().optional().describe('Contract ID (required for update/addTask/completeTask)'),
          taskTitle: s.string().optional().describe('Task title (for addTask)'),
          taskId: s.string().optional().describe('Task ID (for completeTask)'),
          // ... other args with describe() for agent introspection
        },
        async execute(args, context) {
          const store = createContractStore({ projectRoot })
          
          switch (args.action) {
            case 'create': {
              const intent = args.userMessage 
                ? classifyIntent({ rawMessage: args.userMessage, turnCount: 1 })
                : null
              
              const contract = {
                contractId: generateContractId(),
                sessionId: args.sessionId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userIntent: intent ? {
                  raw: args.userMessage!,
                  confidence: intent.intent.confidence,
                  purposeClass: intent.intent.purposeClass,
                  requiresPlan: intent.intent.requiresPlan,
                  requiresGovernance: intent.intent.requiresGovernance,
                } : {
                  raw: '',
                  confidence: 0,
                  purposeClass: 'quick-action' as const,
                  requiresPlan: false,
                  requiresGovernance: false,
                },
                responseMode: intent?.suggestedResponseMode ?? 'broad-search-execute',
                workflow: {
                  tasks: [],
                },
                chainActions: {
                  onTaskComplete: 'next-task',
                  onWorkflowEnd: 'export-contract',
                  onDelegation: 'handoff-packet',
                  onCompaction80: 'export-summary',
                },
              }
              
              await store.create(contract)
              return JSON.stringify({ status: 'created', contractId: contract.contractId, intent })
            }
            
            case 'update': {
              if (!args.contractId) throw new Error('contractId required for update')
              const existing = await store.get(args.contractId)
              if (!existing) throw new Error(`Contract ${args.contractId} not found`)
              
              await store.update(args.contractId, { updatedAt: new Date().toISOString() })
              return JSON.stringify({ status: 'updated', contractId: args.contractId })
            }
            
            case 'addTask': {
              if (!args.contractId || !args.taskTitle) {
                throw new Error('contractId and taskTitle required for addTask')
              }
              // NOTE: Actual task creation delegated to hivemind_task tool
              // This tool only tracks the task reference in the contract
              const existing = await store.get(args.contractId)
              if (!existing) throw new Error(`Contract ${args.contractId} not found`)
              
              const newTask = {
                id: `task-${Date.now()}`,
                title: args.taskTitle,
                status: 'pending' as const,
              }
              
              await store.update(args.contractId, {
                workflow: {
                  ...existing.workflow,
                  tasks: [...(existing.workflow?.tasks ?? []), newTask],
                },
                updatedAt: new Date().toISOString(),
              })
              
              return JSON.stringify({ 
                status: 'task_added', 
                task: newTask,
                delegateTo: 'hivemind_task',  // Signal to agent to use hivemind_task
                message: 'Use hivemind_task tool to create the actual task, then use this tool to track it'
              })
            }
            
            case 'completeTask': {
              if (!args.contractId || !args.taskId) {
                throw new Error('contractId and taskId required for completeTask')
              }
              const existing = await store.get(args.contractId)
              if (!existing) throw new Error(`Contract ${args.contractId} not found`)
              
              const tasks = existing.workflow?.tasks ?? []
              const taskIndex = tasks.findIndex(t => t.id === args.taskId)
              if (taskIndex === -1) throw new Error(`Task ${args.taskId} not found in contract`)
              
              tasks[taskIndex] = { ...tasks[taskIndex], status: 'complete' }
              
              await store.update(args.contractId, {
                workflow: { ...existing.workflow, tasks },
                updatedAt: new Date().toISOString(),
              })
              
              return JSON.stringify({ status: 'task_completed', taskId: args.taskId })
            }
          }
        }
      })
    }
    ```

    Create `tools/classify-intent-tool.ts`:
    ```typescript
    import { tool } from '@opencode-ai/plugin'
    const s = tool.schema
    
    import { classifyIntent } from '../engine/intent-classifier.js'
    import { resolveResponseMode } from '../engine/response-mode-resolver.js'
    
    export function createClassifyIntentTool() {
      return tool({
        description: 'Classify user intent into purpose class and suggest response mode. Pure classification — no state mutation.',
        args: {
          userMessage: s.string().describe('Raw user message to classify'),
          sessionScope: s.enum(['main', 'sub-session']).optional().describe('Session scope'),
          hasAttachments: s.boolean().optional().describe('Whether message has attachments'),
          turnCount: s.number().optional().describe('Current turn count'),
        },
        async execute(args, context) {
          const result = classifyIntent({
            rawMessage: args.userMessage,
            sessionScope: args.sessionScope ?? 'main',
            hasAttachments: args.hasAttachments ?? false,
            turnCount: args.turnCount,
          })
          
          return JSON.stringify({
            purposeClass: result.intent.purposeClass,
            confidence: result.intent.confidence,
            requiresPlan: result.intent.requiresPlan,
            requiresGovernance: result.intent.requiresGovernance,
            suggestedResponseMode: result.suggestedResponseMode,
            reasoning: result.reasoning,
          })
        }
      })
    }
    ```

    Create `tools/export-contract-tool.ts`:
    
    **CRITICAL**: This tool DELEGATES evidence recording to hivemind_trajectory, NOT implementing its own trajectory logic.
    
    ```typescript
    import { tool } from '@opencode-ai/plugin'
    const s = tool.schema
    
    import { createContractStore } from '../engine/contract-store.js'
    
    export function createExportContractTool(projectRoot: string) {
      return tool({
        description: 'Export workflow contract summary. Evidence recording delegated to hivemind_trajectory.',
        args: {
          action: s.enum(['export-summary', 'export-briefing', 'list-contracts']).describe('Export operation'),
          contractId: s.string().optional().describe('Contract ID to export'),
          sessionId: s.string().optional().describe('Session ID for listing contracts'),
        },
        async execute(args, context) {
          const store = createContractStore({ projectRoot })
          
          switch (args.action) {
            case 'export-summary': {
              if (!args.contractId) throw new Error('contractId required for export-summary')
              const contract = await store.get(args.contractId)
              if (!contract) throw new Error(`Contract ${args.contractId} not found`)
              
              const summary = {
                contractId: contract.contractId,
                sessionId: contract.sessionId,
                purposeClass: contract.userIntent.purposeClass,
                taskCount: contract.workflow?.tasks?.length ?? 0,
                completedTasks: contract.workflow?.tasks?.filter(t => t.status === 'complete').length ?? 0,
                briefing: contract.briefing,
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt,
              }
              
              // NOTE: Evidence recording delegated to hivemind_trajectory
              // Signal to agent to record this export as trajectory evidence
              return JSON.stringify({
                summary,
                delegateTo: 'hivemind_trajectory',
                message: 'Use hivemind_trajectory to record this export as workflow evidence'
              })
            }
            
            case 'export-briefing': {
              if (!args.contractId) throw new Error('contractId required for export-briefing')
              const contract = await store.get(args.contractId)
              if (!contract) throw new Error(`Contract ${args.contractId} not found`)
              
              if (!contract.briefing) {
                return JSON.stringify({ error: 'No briefing available for this contract' })
              }
              
              return JSON.stringify({
                briefing: contract.briefing,
                delegateTo: 'hivemind_trajectory',
                message: 'Use hivemind_trajectory to record this briefing as trajectory evidence'
              })
            }
            
            case 'list-contracts': {
              if (!args.sessionId) throw new Error('sessionId required for list-contracts')
              const contracts = await store.list(args.sessionId)
              return JSON.stringify({
                contracts: contracts.map(c => ({
                  contractId: c.contractId,
                  purposeClass: c.userIntent.purposeClass,
                  taskCount: c.workflow?.tasks?.length ?? 0,
                  createdAt: c.createdAt,
                }))
              })
            }
          }
        }
      })
    }
    ```

    Create `tools/index.ts`:
    ```typescript
    export * from './create-contract-tool.js'
    export * from './classify-intent-tool.js'
    export * from './export-contract-tool.js'
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit src/features/agent-work-contract/tools/*.ts</automated>
  </verify>
  <done>
    create-contract-tool creates/updates contracts, delegates task operations to hivemind_task
    classify-intent-tool provides pure intent classification
    export-contract-tool exports summaries, delegates evidence to hivemind_trajectory
    All tools use tool.schema (Zod) for args with .describe() for agent introspection
    All tools return JSON.stringify()
    Tool delegation pattern ensures no duplication with existing tools
  </done>
</task>

</tasks>

<verification>
1. Hook file named `agent-work-event-handler.ts` (no shadowing)
2. session.compacting hook EXTENDED via `buildContractCompactionPreservation()`, not duplicated
3. Tools delegate to hivemind_task and hivemind_trajectory, not duplicating their logic
4. All tools use tool.schema (Zod) for args
5. Human verification of opencode-plugin.ts integration
</verification>

<success_criteria>
- [x] Hook file named `agent-work-event-handler.ts` to avoid shadowing
- [x] session.compacting hook extended via `buildContractCompactionPreservation()` 
- [x] Compaction preservation written to `.hivemind/agent-work-contract/compaction/`
- [x] Tools use delegation pattern (hivemind_task for tasks, hivemind_trajectory for evidence)
- [x] All tool args use `tool.schema` (Zod) with `.describe()`
- [x] Tools return `JSON.stringify()`
- [x] ToolContext used correctly (sessionID, directory, etc.)
- [x] Human verified opencode-plugin.ts integration
</success_criteria>

<output>
After completion, create `.planning/phases/agent-work-contract/agent-work-contract-03-SUMMARY.md`
</output>
