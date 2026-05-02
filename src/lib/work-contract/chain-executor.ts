import type { AgentWorkContractRuntime } from "./agent-work-contract.js"

export type ChainEventType =
  | "contract.started"
  | "contract.completed"
  | "contract.failed"
  | "chain.completed"
  | "chain.failed"

export type ChainEvent = {
  type: ChainEventType
  contractId: string
  timestamp: number
  detail?: string
}

export type ChainExecutionContext = {
  sessionId: string
  executedCount: number
  failedCount: number
  startedAt: number
}

/** Creates a fresh chain execution context with zeroed counters. */
export function createChainExecutionContext(sessionId: string): ChainExecutionContext {
  return { sessionId, executedCount: 0, failedCount: 0, startedAt: Date.now() }
}

/**
 * Function signature for executing a single work contract within a chain.
 * @param contract - The runtime contract to execute.
 * @param context - Current chain context (read-only for metrics).
 * @returns Success/failure with optional detail string.
 */
export type ContractExecutorFn = (
  contract: AgentWorkContractRuntime,
  context: Readonly<ChainExecutionContext>,
) => Promise<{ success: boolean; detail?: string }>

type EventHandler = (event: ChainEvent, context: ChainExecutionContext) => void | Promise<void>

/** Validates a contract is in an executable state. Rejects paused/cancelled. */
const defaultExecutor: ContractExecutorFn = async (contract) => {
  if (contract.runtimeStatus === "cancelled" || contract.runtimeStatus === "paused") {
    return { success: false, detail: `Contract ${contract.id} is ${contract.runtimeStatus}` }
  }
  return { success: true }
}

function mkEvent(type: ChainEventType, contractId: string, detail?: string): ChainEvent {
  return { type, contractId, timestamp: Date.now(), detail }
}

/** Executes a chain of work contracts sequentially, emitting lifecycle events. Accepts optional {@link ContractExecutorFn}. */
export class ChainExecutor {
  private handlers: Partial<Record<ChainEventType, EventHandler[]>> = {}
  private readonly executor: ContractExecutorFn

  constructor(executor?: ContractExecutorFn) {
    this.executor = executor ?? defaultExecutor
  }

  on(event: ChainEventType, handler: EventHandler): void {
    this.handlers[event] ??= []
    this.handlers[event]!.push(handler)
  }

  off(event: ChainEventType, handler: EventHandler): void {
    const list = this.handlers[event]
    if (!list) return
    this.handlers[event] = list.filter((h) => h !== handler)
  }

  private async emit(event: ChainEvent, context: ChainExecutionContext): Promise<void> {
    for (const handler of this.handlers[event.type] ?? []) {
      await handler(event, context)
    }
  }

  /**
   * Executes contracts in order, calling the executor and emitting events.
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
