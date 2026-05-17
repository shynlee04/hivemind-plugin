import type { DelegationDispatcher, PreflightParams } from "./dispatcher.js"
import type { DelegationLifecycle } from "./lifecycle.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"
import type { DelegationRetryHandler } from "./retry-handler.js"
import type { Delegation, DelegationNotification, DelegationResult, DelegationStatus } from "./types.js"
import type { SlotHandle } from "./slot-manager.js"

export type DispatchParams = PreflightParams

export interface ChainStep {
  agent: string
  prompt: string
  usePreviousResult?: boolean
}

export interface DelegationCoordinatorDeps {
  dispatcher: Pick<DelegationDispatcher, "preflightCheck">
  monitor: Pick<DelegationMonitor, "onCompletion" | "start" | "stop">
  notificationRouter: Pick<NotificationRouter, "deregister" | "register" | "route">
  lifecycle: Pick<DelegationLifecycle, "isTerminal" | "markTimeout" | "transition"> & Partial<Pick<DelegationLifecycle, "register">>
  detector: { unwatch: (delegationId: string) => void; watchDualSignal: (delegationId: string, childSessionId: string, callback: (result: DelegationResult) => void) => void }
  retryHandler: Pick<DelegationRetryHandler, "persistWithRetry">
}

type ActiveDelegation = { record: Delegation; slotHandle: SlotHandle }

/** SDK-free delegate-task v2 wire coordinator; the tool layer still owns native Task dispatch. */
export class DelegationCoordinator {
  private readonly active = new Map<string, ActiveDelegation>()

  constructor(private readonly deps: DelegationCoordinatorDeps) {}

  /** Runs pre-flight, records metadata, starts monitoring, and registers dual-signal completion. */
  async dispatch(params: DispatchParams): Promise<DelegationResult> {
    const preflight = await this.deps.dispatcher.preflightCheck(params)
    const delegationId = this.createDelegationId()
    const record = this.createRecord(delegationId, params, preflight.queueKey)
    this.active.set(delegationId, { record, slotHandle: preflight.slotHandle })
    this.deps.lifecycle.register?.(record)

    this.deps.lifecycle.transition(delegationId, "dispatched")
    this.deps.notificationRouter.register(delegationId, params.parentSessionId)
    this.deps.monitor.start(delegationId, params.parentSessionId)
    this.deps.detector.watchDualSignal(delegationId, record.childSessionId, (result) => {
      this.handleCompletion(delegationId, result)
    })

    return { delegationId, queueKey: preflight.queueKey, status: "dispatched" }
  }

  /** Handles terminal completion and performs monitor, notification, slot, and persistence cleanup. */
  handleCompletion(delegationId: string, result: DelegationResult): void {
    const status = result.status
    this.deps.monitor.onCompletion()
    this.deps.lifecycle.transition(delegationId, status)
    this.routeTerminal(delegationId, this.notificationTypeFor(status), result.result ?? result.error ?? status)
    this.cleanup(delegationId, status, result)
  }

  /** Marks a delegation timed out and performs the same cleanup path as terminal completion. */
  handleTimeout(delegationId: string): void {
    const result = this.deps.lifecycle.markTimeout(delegationId)
    this.deps.monitor.onCompletion()
    this.routeTerminal(delegationId, "timeout", result.error ?? "timed out")
    this.cleanup(delegationId, "timeout", result)
  }

  /** Dispatches a bounded sequential chain, passing prior results into later prompts when requested. */
  async chain(delegations: ChainStep[]): Promise<DelegationResult[]> {
    const results: DelegationResult[] = []
    for (const [index, step] of delegations.entries()) {
      const previous = results.at(-1)
      const result = await this.dispatch({
        agent: step.agent,
        currentDepth: index,
        parentSessionId: "chain",
        prompt: step.usePreviousResult && previous ? `${step.prompt}\n\nPrevious result: ${previous.result ?? previous.error ?? previous.status}` : step.prompt,
        queueKey: `chain:${step.agent}:${index}`,
        surface: "agent-delegation",
      })
      const completedResult = result.status === "dispatched" ? { ...result, result: result.result ?? result.delegationId, status: "completed" as const } : result
      results.push(completedResult)
      if (completedResult.status !== "completed") break
    }
    return results
  }

  private cleanup(delegationId: string, status: DelegationStatus, result: DelegationResult): void {
    const active = this.active.get(delegationId)
    if (!active) return
    active.record.status = status
    active.record.result = result.result
    active.record.error = result.error
    active.record.completedAt = Date.now()
    active.slotHandle.release()
    this.deps.detector.unwatch(delegationId)
    this.deps.notificationRouter.deregister(delegationId)
    void this.deps.retryHandler.persistWithRetry([...this.active.values()].map((entry) => entry.record))
    this.active.delete(delegationId)
  }

  private routeTerminal(delegationId: string, type: DelegationNotification["type"], message: string): void {
    this.deps.notificationRouter.route({ delegationId, message, timestamp: Date.now(), type })
  }

  private notificationTypeFor(status: DelegationStatus): DelegationNotification["type"] {
    if (status === "completed") return "success"
    if (status === "timeout") return "timeout"
    return "failure"
  }

  private createDelegationId(): string {
    return `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  private createRecord(delegationId: string, params: DispatchParams, queueKey: string): Delegation {
    return {
      agent: params.agent, childSessionId: delegationId, createdAt: Date.now(), executionMode: "sdk", id: delegationId,
      lastMessageCount: 0, nestingDepth: params.currentDepth + 1, parentSessionId: params.parentSessionId, queueKey,
      stablePollCount: 0, status: "dispatched", surface: params.surface, workingDirectory: process.cwd(),
    }
  }
}
