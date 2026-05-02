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

export function createChainExecutionContext(sessionId: string): ChainExecutionContext {
  return {
    sessionId,
    executedCount: 0,
    failedCount: 0,
    startedAt: Date.now(),
  }
}

type EventHandler = (event: ChainEvent, context: ChainExecutionContext) => void | Promise<void>

export class ChainExecutor {
  private handlers: Partial<Record<ChainEventType, EventHandler[]>> = {}

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
    const list = this.handlers[event.type] ?? []
    for (const handler of list) {
      await handler(event, context)
    }
  }

  async executeChain(
    contracts: AgentWorkContractRuntime[],
    context?: ChainExecutionContext,
  ): Promise<ChainExecutionContext> {
    const ctx = context ?? createChainExecutionContext("default")

    for (const contract of contracts) {
      const startedEvent: ChainEvent = {
        type: "contract.started",
        contractId: contract.id,
        timestamp: Date.now(),
      }
      await this.emit(startedEvent, ctx)

      try {
        ctx.executedCount++
        const completedEvent: ChainEvent = {
          type: "contract.completed",
          contractId: contract.id,
          timestamp: Date.now(),
        }
        await this.emit(completedEvent, ctx)
      } catch (err) {
        ctx.failedCount++
        const failedEvent: ChainEvent = {
          type: "contract.failed",
          contractId: contract.id,
          timestamp: Date.now(),
          detail: err instanceof Error ? err.message : String(err),
        }
        await this.emit(failedEvent, ctx)
      }
    }

    const chainEvent: ChainEvent = {
      type: ctx.failedCount > 0 ? "chain.failed" : "chain.completed",
      contractId: "chain",
      timestamp: Date.now(),
      detail: `executed=${ctx.executedCount}, failed=${ctx.failedCount}`,
    }
    await this.emit(chainEvent, ctx)

    return ctx
  }
}
