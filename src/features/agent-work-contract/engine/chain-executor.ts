/**
 * Chain Executor
 *
 * Handler registration and action dispatch for workflow automation.
 * Supports extensibility through handler registration pattern.
 *
 * @module agent-work-contract/engine/chain-executor
 */

import type { DelegationHandoffRecord } from '../../../delegation/delegation-store.js'
import type { WorkflowContinuityLinkage } from '../../runtime-entry/workflow-continuity.js'
import type { AgentWorkContract } from '../schema/index.js'
import { ContractStore } from './contract-store.js'
import type { ChainActionTrigger, ChainActionEvent } from '../types.js'

/**
 * Handler function type for chain actions.
 */
export type ChainActionHandler = (payload: unknown) => Promise<void>

interface DelegationProjectionEntry {
  delegationId: string
  handoffRef: string
  status: DelegationHandoffRecord['status']
  summary: string
  targetSessionId: string
  resumeTarget?: string
  taskRefs: string[]
  subtaskRefs: string[]
  evidenceRefs: string[]
  continuityRef?: string
  updatedAt: string
}

interface DelegationProjectionState {
  linkedContractId: string
  updatedAt: string
  handoffs: DelegationProjectionEntry[]
}

export interface DelegationHandoffPacketDispatchResult {
  action: 'handoff-packet'
  contractId: string
  delegationId: string
  executed: boolean
  artifactRefs: string[]
  stateTransitions: string[]
}

function getDelegationProjectionState(contract: AgentWorkContract): DelegationProjectionState {
  const projection = (contract as AgentWorkContract & { delegationProjection?: DelegationProjectionState }).delegationProjection

  if (!projection) {
    return {
      linkedContractId: contract.contractId,
      updatedAt: contract.updatedAt,
      handoffs: [],
    }
  }

  return projection
}

function buildDelegationProjectionEntry(input: {
  handoff: DelegationHandoffRecord
  handoffRef: string
  continuity?: WorkflowContinuityLinkage | null
}): DelegationProjectionEntry {
  return {
    delegationId: input.handoff.id,
    handoffRef: input.handoffRef,
    status: input.handoff.status,
    summary: input.handoff.summary,
    targetSessionId: input.handoff.packet.targetSessionId,
    resumeTarget: input.handoff.packet.resumeTarget,
    taskRefs: input.handoff.packet.taskIds,
    subtaskRefs: input.handoff.packet.subtaskIds,
    evidenceRefs: input.handoff.evidence.map((entry) => `${entry.kind}:${entry.description}`),
    continuityRef: input.continuity
      ? `workflow-continuity:${input.continuity.transaction.continuityId}`
      : undefined,
    updatedAt: input.handoff.updatedAt,
  }
}

function mergeDelegationProjectionEntry(
  existing: DelegationProjectionState,
  entry: DelegationProjectionEntry,
): DelegationProjectionState {
  const handoffs = existing.handoffs.filter((item) => item.delegationId !== entry.delegationId)

  return {
    linkedContractId: existing.linkedContractId,
    updatedAt: entry.updatedAt,
    handoffs: [...handoffs, entry].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  }
}

/**
 * ChainExecutor - Manages handler registration and action dispatch.
 *
 * Supports four trigger types:
 * - onTaskComplete: Task completion automation
 * - onWorkflowEnd: Workflow end automation
 * - onDelegation: Delegation automation
 * - onCompaction80: Context compaction automation
 *
 * Handlers are stored as arrays to support multiple handlers per trigger.
 *
 * @example
 * ```typescript
 * const executor = new ChainExecutor()
 *
 * executor.registerHandler('onTaskComplete', async (payload) => {
 *   console.log('Task completed:', payload)
 * })
 *
 * await executor.dispatch({
 *   trigger: 'onTaskComplete',
 *   payload: { contractId: 'c1', taskId: 't1' }
 * })
 * ```
 */
export class ChainExecutor {
  private handlers: Map<ChainActionTrigger, ChainActionHandler[]>

  constructor() {
    this.handlers = new Map()
  }

  /**
   * Registers a handler for a specific trigger.
   * Multiple handlers can be registered for the same trigger.
   * Handlers are called in registration order.
   *
   * @param trigger - The trigger type to register for
   * @param handler - The handler function to register
   *
   * @example
   * ```typescript
   * executor.registerHandler('onTaskComplete', async (payload) => {
   *   // Handle task completion
   * })
   * ```
   */
  registerHandler(trigger: ChainActionTrigger, handler: ChainActionHandler): void {
    const existing = this.handlers.get(trigger) ?? []
    existing.push(handler)
    this.handlers.set(trigger, existing)
  }

  /**
   * Checks if any handlers are registered for a trigger.
   *
   * @param trigger - The trigger type to check
   * @returns True if at least one handler is registered
   */
  hasHandler(trigger: ChainActionTrigger): boolean {
    const handlers = this.handlers.get(trigger)
    return handlers !== undefined && handlers.length > 0
  }

  /**
   * Clears all handlers for a specific trigger.
   *
   * @param trigger - The trigger type to clear handlers for
   */
  clearHandlers(trigger: ChainActionTrigger): void {
    this.handlers.delete(trigger)
  }

  /**
   * Dispatches an event to all registered handlers for the trigger.
   * Handlers are called in registration order.
   * Errors in handlers are logged but do not stop execution of subsequent handlers.
   *
   * @param event - The event to dispatch
   *
   * @example
   * ```typescript
   * await executor.dispatch({
   *   trigger: 'onTaskComplete',
   *   payload: { contractId: 'c1', taskId: 't1' }
   * })
   * ```
   */
  async dispatch(event: ChainActionEvent): Promise<void> {
    const handlers = this.handlers.get(event.trigger)
    
    if (!handlers || handlers.length === 0) {
      // No handlers registered, silently succeed
      return
    }

    // Execute handlers in sequence, catching errors gracefully
    for (const handler of handlers) {
      try {
        await handler(event.payload)
      } catch (error) {
        // Log error but continue with next handler
        console.error(`Chain executor handler error for ${event.trigger}:`, error)
      }
    }
  }
}

/**
 * Executes the single supported delegation chain action and projects the
 * delegated task refs onto the linked contract without mutating canonical task
 * authority.
 *
 * @param input - Delegation packet action inputs
 * @returns Dispatch result with artifact and state evidence
 */
export async function dispatchDelegationHandoffPacketAction(input: {
  projectRoot: string
  contractId: string
  handoff: DelegationHandoffRecord
  handoffRef: string
  continuity?: WorkflowContinuityLinkage | null
}): Promise<DelegationHandoffPacketDispatchResult> {
  const store = new ContractStore(input.projectRoot)
  const contract = await store.get(input.contractId)
  const artifactRefs = [
    input.handoffRef,
    `agent-work-contract:${input.contractId}`,
    ...(input.continuity
      ? [
          input.continuity.filePath,
          `workflow-continuity:${input.continuity.transaction.continuityId}`,
        ]
      : []),
  ]

  if (!contract || contract.chainActions.onDelegation !== 'handoff-packet') {
    return {
      action: 'handoff-packet',
      contractId: input.contractId,
      delegationId: input.handoff.id,
      executed: false,
      artifactRefs,
      stateTransitions: ['delegation-handoff-packet-skipped'],
    }
  }

  const executor = new ChainExecutor()
  let executed = false

  executor.registerHandler('onDelegation', async () => {
    const latest = await store.get(input.contractId)

    if (!latest) {
      throw new Error(`Contract ${input.contractId} not found`)
    }

    const projection = mergeDelegationProjectionEntry(
      getDelegationProjectionState(latest),
      buildDelegationProjectionEntry(input),
    )

    await store.update(input.contractId, {
      delegationExportSessionId: input.handoff.packet.targetSessionId,
      delegationProjection: projection,
    } as Partial<AgentWorkContract>)

    executed = true
  })

  await executor.dispatch({
    trigger: 'onDelegation',
    payload: {
      contractId: input.contractId,
      delegationId: input.handoff.id,
      handoffRef: input.handoffRef,
      targetSessionId: input.handoff.packet.targetSessionId,
      resumeTarget: input.handoff.packet.resumeTarget,
      taskRefs: input.handoff.packet.taskIds,
      subtaskRefs: input.handoff.packet.subtaskIds,
      status: input.handoff.status,
    },
  })

  return {
    action: 'handoff-packet',
    contractId: input.contractId,
    delegationId: input.handoff.id,
    executed,
    artifactRefs,
    stateTransitions: executed
      ? ['delegation-handoff-packet-dispatched', 'linked-contract-delegation-projection-updated']
      : ['delegation-handoff-packet-failed'],
  }
}
