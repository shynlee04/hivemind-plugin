import type { DelegationDispatcher, PreflightParams, PreflightResult } from "./dispatcher.js"
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
  childSessionStarter?: {
    start: (params: ChildSessionStartParams) => Promise<ChildSessionStartResult>
  }
  dispatcher: Pick<DelegationDispatcher, "preflightCheck">
  monitor: Pick<DelegationMonitor, "onCompletion" | "start" | "stop">
  notificationRouter: Pick<NotificationRouter, "deregister" | "register" | "route">
  lifecycle: Pick<DelegationLifecycle, "isTerminal" | "markTimeout" | "transition"> & Partial<Pick<DelegationLifecycle, "getStatus" | "list" | "register">>
  detector: {
    signalCompletionEvent: (delegationId: string) => void
    signalTerminalStatus: (delegationId: string, status: DelegationStatus) => void
    unwatch: (delegationId: string) => void
    watchDualSignal: (delegationId: string, childSessionId: string, callback: (result: DelegationResult) => void) => void
  }
  retryHandler: Pick<DelegationRetryHandler, "persistWithRetry">
}

export interface ChildSessionStartParams {
  agent: string
  delegationId: string
  parentSessionId: string
  prompt: string
  validatedAgent: PreflightResult["validatedAgent"]
  workingDirectory: string
}

export interface ChildSessionStartResult {
  childSessionId: string
}

type ActiveDelegation = { record: Delegation; slotHandle: SlotHandle }

/** SDK-free delegate-task v2 wire coordinator; the tool layer still owns native Task dispatch. */
export class DelegationCoordinator {
  private readonly active = new Map<string, ActiveDelegation>()
  private readonly delegationByChildSession = new Map<string, string>()

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
    if (this.deps.childSessionStarter) {
      try {
        const child = await this.deps.childSessionStarter.start({
          agent: params.agent,
          delegationId,
          parentSessionId: params.parentSessionId,
          prompt: params.prompt ?? "",
          validatedAgent: preflight.validatedAgent,
          workingDirectory: params.workingDirectory ?? process.cwd(),
        })
        this.attachChildSession(delegationId, child.childSessionId)
        this.deps.lifecycle.transition(delegationId, "running")
      } catch (caughtError) {
        this.failDispatch(delegationId, caughtError)
        return this.errorResult(delegationId, caughtError)
      }
    }
    this.deps.monitor.start(delegationId, params.parentSessionId)
    this.deps.detector.watchDualSignal(delegationId, record.childSessionId, (result) => {
      this.handleCompletion(delegationId, result)
    })

    const status = this.deps.lifecycle.getStatus?.(delegationId)?.status ?? "dispatched"
    return { delegationId, queueKey: preflight.queueKey, status }
  }

  /** Handles terminal completion and performs monitor, notification, slot, and persistence cleanup. */
  handleCompletion(delegationId: string, result: DelegationResult): void {
    const status = result.status
    this.deps.monitor.onCompletion(delegationId)
    this.deps.lifecycle.transition(delegationId, status)
    this.routeTerminal(delegationId, this.notificationTypeFor(status), result.result ?? result.error ?? status)
    this.cleanup(delegationId, status, result)
  }

  /** Marks a delegation timed out and performs the same cleanup path as terminal completion. */
  handleTimeout(delegationId: string): void {
    const result = this.deps.lifecycle.markTimeout(delegationId)
    this.deps.monitor.onCompletion(delegationId)
    this.routeTerminal(delegationId, "timeout", result.error ?? "timed out")
    this.cleanup(delegationId, "timeout", result)
  }

  /** Updates the child session mapping once the native Task seam returns a real session ID. */
  attachChildSession(delegationId: string, childSessionId: string): void {
    const active = this.active.get(delegationId)
    if (!active) return
    this.delegationByChildSession.delete(active.record.childSessionId)
    active.record.childSessionId = childSessionId
    this.delegationByChildSession.set(childSessionId, delegationId)
  }

  /** Converts a native Task dispatch failure into terminal cleanup without leaking active resources. */
  failDispatch(delegationId: string, caughtError: unknown): void {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    this.deps.lifecycle.transition(delegationId, "error")
    this.deps.monitor.onCompletion(delegationId)
    this.routeTerminal(delegationId, "failure", `[Harness] Native Task dispatch failed: ${message}`)
    this.cleanup(delegationId, "error", { delegationId, error: `[Harness] Native Task dispatch failed: ${message}`, status: "error" })
  }

  /** Aborts an active delegation and releases all coordinator-owned resources. */
  abortDelegation(delegationId: string, reason = "[Harness] Delegation aborted"): DelegationResult {
    const result: DelegationResult = { delegationId, error: reason, status: "error", terminalKind: "cancelled", explicitCancellation: true }
    this.deps.lifecycle.transition(delegationId, "error")
    this.deps.monitor.onCompletion(delegationId)
    this.routeTerminal(delegationId, "failure", reason)
    this.cleanup(delegationId, "error", result)
    return result
  }

  /** Cancels tracking for an active delegation without asserting child termination. */
  cancelDelegation(delegationId: string, reason = "[Harness] Delegation cancelled"): DelegationResult {
    const result: DelegationResult = { delegationId, error: reason, status: "error", terminalKind: "cancelled", explicitCancellation: true }
    this.deps.lifecycle.transition(delegationId, "error")
    this.deps.monitor.onCompletion(delegationId)
    this.routeTerminal(delegationId, "failure", reason)
    this.cleanup(delegationId, "error", result)
    return result
  }

  /** Routes child session idle hook observations into the v2 completion path. */
  handleSessionIdle(childSessionId: string): void {
    this.handleChildSessionTerminal(childSessionId, "completed")
  }

  /** Routes child session error hook observations into the v2 completion path. */
  handleSessionError(childSessionId: string, caughtError?: unknown): void {
    const message = caughtError instanceof Error ? caughtError.message : caughtError === undefined ? undefined : String(caughtError)
    this.handleChildSessionTerminal(childSessionId, "error", message)
  }

  /** Routes child session deleted hook observations into the v2 completion path. */
  handleSessionDeleted(childSessionId: string): void {
    this.handleChildSessionTerminal(childSessionId, "error", "[Harness] Delegated child session was deleted")
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
    active.record.explicitCancellation = result.explicitCancellation
    active.record.terminalKind = result.terminalKind
    active.slotHandle.release()
    this.deps.detector.unwatch(delegationId)
    this.deps.notificationRouter.deregister(delegationId)
    this.active.delete(delegationId)
    this.delegationByChildSession.delete(active.record.childSessionId)
    void this.deps.retryHandler.persistWithRetry(this.deps.lifecycle.list?.() ?? [...this.active.values()].map((entry) => entry.record))
  }

  private handleChildSessionTerminal(childSessionId: string, status: DelegationStatus, errorMessage?: string): void {
    const delegationId = this.delegationByChildSession.get(childSessionId)
    if (!delegationId) return
    this.deps.detector.signalCompletionEvent(delegationId)
    this.deps.detector.signalTerminalStatus(delegationId, status)
    if (errorMessage) {
      const record = this.active.get(delegationId)?.record ?? this.deps.lifecycle.getStatus?.(delegationId)
      if (record) record.error = errorMessage
    }
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
      prompt: params.prompt, stablePollCount: 0, status: "dispatched", surface: params.surface, workingDirectory: params.workingDirectory ?? process.cwd(),
    }
  }

  private errorResult(delegationId: string, caughtError: unknown): DelegationResult {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    return { delegationId, error: `[Harness] Native Task dispatch failed: ${message}`, status: "error" }
  }
}
