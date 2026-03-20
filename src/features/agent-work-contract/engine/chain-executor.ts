/**
 * Chain Executor
 *
 * Handler registration and action dispatch for workflow automation.
 * Supports extensibility through handler registration pattern.
 *
 * @module agent-work-contract/engine/chain-executor
 */

import type { ChainActionTrigger, ChainActionEvent } from '../types.js'

/**
 * Handler function type for chain actions.
 */
export type ChainActionHandler = (payload: unknown) => Promise<void>

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