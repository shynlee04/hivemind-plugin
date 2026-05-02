import type { AgentWorkContractRuntime } from "./agent-work-contract.js"

/**
 * Lifecycle event types emitted during chain execution.
 *
 * - `"contract.started"` — A single contract has begun execution.
 * - `"contract.completed"` — A single contract completed successfully.
 * - `"contract.failed"` — A single contract failed.
 * - `"chain.completed"` — The entire chain finished with no failures.
 * - `"chain.failed"` — The chain finished with at least one failure.
 */
export type ChainEventType =
  | "contract.started"
  | "contract.completed"
  | "contract.failed"
  | "chain.completed"
  | "chain.failed"

/**
 * An event emitted during chain execution.
 *
 * @property type - The event type.
 * @property contractId - ID of the related contract (or `"chain"` for terminal events).
 * @property timestamp - Unix timestamp in milliseconds.
 * @property detail - Optional human-readable detail string.
 */
export type ChainEvent = {
  type: ChainEventType
  contractId: string
  timestamp: number
  detail?: string
}

/**
 * Mutable execution context tracking progress through a chain of contracts.
 *
 * @property sessionId - The session ID associated with this chain execution.
 * @property executedCount - Number of successfully executed contracts.
 * @property failedCount - Number of failed contracts.
 * @property startedAt - Unix timestamp when the chain started.
 */
export type ChainExecutionContext = {
  sessionId: string
  executedCount: number
  failedCount: number
  startedAt: number
}

/**
 * Creates a fresh chain execution context with zeroed counters.
 *
 * @param sessionId - The session ID to associate with the context.
 * @returns A new {@link ChainExecutionContext}.
 *
 * @example
 * ```typescript
 * const ctx = createChainExecutionContext("session-123")
 * console.log(ctx.executedCount) // 0
 * ```
 */
export function createChainExecutionContext(sessionId: string): ChainExecutionContext {
  return { sessionId, executedCount: 0, failedCount: 0, startedAt: Date.now() }
}

/**
 * Function signature for executing a single work contract within a chain.
 *
 * @param contract - The runtime contract to execute.
 * @param context - Current chain context (read-only for metrics).
 * @returns Success/failure with optional detail string.
 */
export type ContractExecutorFn = (
  contract: AgentWorkContractRuntime,
  context: Readonly<ChainExecutionContext>,
) => Promise<{ success: boolean; detail?: string }>

/** @internal Handler type for chain events. */
type EventHandler = (event: ChainEvent, context: ChainExecutionContext) => void | Promise<void>

/**
 * Default executor that validates a contract is in an executable state.
 *
 * Rejects contracts with `"cancelled"` or `"paused"` runtime status.
 *
 * @param contract - The contract to validate.
 * @returns Success if the contract is active, failure otherwise.
 */
const defaultExecutor: ContractExecutorFn = async (contract) => {
  if (contract.runtimeStatus === "cancelled" || contract.runtimeStatus === "paused") {
    return { success: false, detail: `Contract ${contract.id} is ${contract.runtimeStatus}` }
  }
  return { success: true }
}

/**
 * Create a chain event object.
 *
 * @param type - The event type.
 * @param contractId - The related contract ID.
 * @param detail - Optional detail string.
 * @returns A {@link ChainEvent}.
 */
function mkEvent(type: ChainEventType, contractId: string, detail?: string): ChainEvent {
  return { type, contractId, timestamp: Date.now(), detail }
}

/**
 * Executes a chain of work contracts sequentially, emitting lifecycle events.
 *
 * Accepts an optional {@link ContractExecutorFn} to customize how each
 * contract is executed. The default executor simply checks that the contract
 * is not paused or cancelled.
 *
 * @example
 * ```typescript
 * const executor = new ChainExecutor()
 * executor.on("contract.completed", (event, ctx) => {
 *   console.log(`Done: ${event.contractId}, total: ${ctx.executedCount}`)
 * })
 * const result = await executor.executeChain(contracts)
 * ```
 */
export class ChainExecutor {
  private handlers: Partial<Record<ChainEventType, EventHandler[]>> = {}
  private readonly executor: ContractExecutorFn

  /**
   * @param executor - Optional custom executor function. Defaults to status-checking executor.
   */
  constructor(executor?: ContractExecutorFn) {
    this.executor = executor ?? defaultExecutor
  }

  /**
   * Register an event handler for a specific event type.
   *
   * @param event - The event type to listen for.
   * @param handler - Callback invoked when the event fires.
   */
  on(event: ChainEventType, handler: EventHandler): void {
    this.handlers[event] ??= []
    this.handlers[event]!.push(handler)
  }

  /**
   * Remove a previously registered event handler.
   *
   * @param event - The event type the handler was registered for.
   * @param handler - The handler reference to remove.
   */
  off(event: ChainEventType, handler: EventHandler): void {
    const list = this.handlers[event]
    if (!list) return
    this.handlers[event] = list.filter((h) => h !== handler)
  }

  /**
   * Emit an event to all registered handlers for its type.
   *
   * @param event - The event to emit.
   * @param context - The current execution context.
   */
  private async emit(event: ChainEvent, context: ChainExecutionContext): Promise<void> {
    for (const handler of this.handlers[event.type] ?? []) {
      await handler(event, context)
    }
  }

  /**
   * Executes contracts in order, calling the executor and emitting events.
   *
   * @param contracts - Ordered list of contracts to execute.
   * @param context - Optional pre-existing context; created if omitted.
   * @returns Final execution context with updated counters.
   */
  async executeChain(
    contracts: AgentWorkContractRuntime[],
    context?: ChainExecutionContext,
  ): Promise<ChainExecutionContext> {
    const ctx = context ?? createChainExecutionContext("default")

    for (const contract of contracts) {
      await this.emit(mkEvent("contract.started", contract.id), ctx)

      let result: { success: boolean; detail?: string }
      try {
        result = await this.executor(contract, ctx)
      } catch (err) {
        result = { success: false, detail: err instanceof Error ? err.message : String(err) }
      }

      if (result.success) {
        ctx.executedCount++
        await this.emit(mkEvent("contract.completed", contract.id), ctx)
      } else {
        ctx.failedCount++
        await this.emit(mkEvent("contract.failed", contract.id, result.detail), ctx)
      }
    }

    const finalType = ctx.failedCount > 0 ? "chain.failed" : "chain.completed"
    await this.emit(
      mkEvent(finalType, "chain", `executed=${ctx.executedCount}, failed=${ctx.failedCount}`),
      ctx,
    )
    return ctx
  }
}
