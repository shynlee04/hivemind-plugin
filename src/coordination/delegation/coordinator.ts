import type { DelegationDispatcher, PreflightParams, PreflightResult } from "./dispatcher.js"
import type { DelegationLifecycle } from "./lifecycle.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"
import type { DelegationRetryHandler } from "./retry-handler.js"
import type { Delegation, DelegationNotification, DelegationResult, DelegationSignalSource, DelegationStatus } from "./types.js"
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
    signalCompletionEvent: (delegationId: string, result?: DelegationResult) => void
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

export interface ExecutionSignalInput {
  source: DelegationSignalSource
  observedAt?: number
  actionDelta?: number
  messageDelta?: number
  toolDelta?: number
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
    return { delegationId, evidenceLevel: record.evidenceLevel, executionState: record.executionState, queueKey: preflight.queueKey, status }
  }

  /** Record the first observable child action/message/tool signal; promptAsync acceptance never calls this. */
  recordExecutionSignal(delegationId: string, signal: ExecutionSignalInput): void {
    const record = this.findRecord(delegationId)
    if (!record) return
    const observedAt = signal.observedAt ?? Date.now()
    record.executionState = "confirmed"
    record.firstActionAt ??= observedAt
    record.signalSource = signal.source
    record.actionCount = (record.actionCount ?? 0) + (signal.actionDelta ?? 1)
    record.messageCount = (record.messageCount ?? 0) + (signal.messageDelta ?? (signal.source === "message" ? 1 : 0))
    record.toolCallCount = (record.toolCallCount ?? 0) + (signal.toolDelta ?? (signal.source === "tool" ? 1 : 0))
    record.evidenceLevel = record.toolCallCount > 0 && record.messageCount > 0
      ? "message-and-tool"
      : record.toolCallCount > 0 ? "tool" : record.messageCount > 0 ? "message" : "status-only"
  }

  /** Record a runtime message observation for a tracked child session. */
  recordChildMessageSignal(childSessionId: string, observedAt?: number, finalMessageExcerpt?: string): void {
    const delegationId = this.delegationByChildSession.get(childSessionId)
    if (!delegationId) return
    const record = this.findRecord(delegationId)
    if (record && finalMessageExcerpt) record.finalMessageExcerpt = finalMessageExcerpt
    this.recordExecutionSignal(delegationId, { messageDelta: 1, observedAt, source: "message" })
  }

  /** Record a runtime tool observation for a tracked child session. */
  recordChildToolSignal(childSessionId: string, observedAt?: number): void {
    const delegationId = this.delegationByChildSession.get(childSessionId)
    if (!delegationId) return
    this.recordExecutionSignal(delegationId, { observedAt, source: "tool", toolDelta: 1 })
  }

  /** Mark a delegation as unconfirmed when the 60s first-action window expires without signals. */
  markExecutionUnconfirmed(delegationId: string, elapsedSeconds: number): void {
    const record = this.findRecord(delegationId)
    if (!record || record.executionState === "confirmed") return
    if (elapsedSeconds >= 600) {
      record.executionState = "stalled"
      record.evidenceLevel = record.evidenceLevel ?? "accepted-only"
      record.error = `[Harness] Delegation stalled without first action after ${elapsedSeconds}s`
      this.handleTimeout(delegationId)
      return
    }
    record.executionState = elapsedSeconds >= 600 ? "stalled" : "unconfirmed"
    record.evidenceLevel = record.evidenceLevel ?? "accepted-only"
    this.routeTerminal(delegationId, "progress", `first action unconfirmed after ${elapsedSeconds}s`)
  }

  /** Handles terminal completion and performs monitor, notification, slot, and persistence cleanup. */
  handleCompletion(delegationId: string, result: DelegationResult): void {
    const status = result.status
    this.deps.monitor.onCompletion(delegationId)
    this.mergeCompletionResult(delegationId, result)
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
    this.mergeCompletionResult(delegationId, result)
    active.slotHandle.release()
    this.deps.detector.unwatch(delegationId)
    this.deps.notificationRouter.deregister(delegationId)
    this.active.delete(delegationId)
    this.delegationByChildSession.delete(active.record.childSessionId)
    void this.deps.retryHandler.persistWithRetry(this.deps.lifecycle.list?.() ?? [...this.active.values()].map((entry) => entry.record))
  }

  private findRecord(delegationId: string): Delegation | undefined {
    return this.active.get(delegationId)?.record ?? this.deps.lifecycle.getStatus?.(delegationId)
  }

  private mergeCompletionResult(delegationId: string, result: DelegationResult): void {
    const record = this.findRecord(delegationId)
    if (!record) return
    if (result.childSessionId) record.childSessionId = result.childSessionId
    if (result.result) record.result = result.result
    if (result.error) record.error = result.error
    record.evidenceLevel = result.evidenceLevel ?? record.evidenceLevel ?? (result.result || result.finalMessageExcerpt ? "message" : "status-only")
    record.finalMessageExcerpt = result.finalMessageExcerpt ?? record.finalMessageExcerpt
    record.signalSource = result.signalSource ?? record.signalSource
    record.actionCount = result.actionCount ?? record.actionCount
    record.messageCount = result.messageCount ?? record.messageCount
    record.toolCallCount = result.toolCallCount ?? record.toolCallCount
    if (record.executionState !== "confirmed" && record.evidenceLevel !== "accepted-only" && record.evidenceLevel !== "status-only") {
      record.executionState = "confirmed"
      record.firstActionAt ??= Date.now()
    }
  }

  private handleChildSessionTerminal(childSessionId: string, status: DelegationStatus, errorMessage?: string): void {
    const delegationId = this.delegationByChildSession.get(childSessionId)
    if (!delegationId) return
    const completionResult = this.buildChildCompletionResult(delegationId, childSessionId, status, errorMessage)
    this.deps.detector.signalCompletionEvent(delegationId, completionResult)
    this.deps.detector.signalTerminalStatus(delegationId, status)
    if (errorMessage) {
      const record = this.active.get(delegationId)?.record ?? this.deps.lifecycle.getStatus?.(delegationId)
      if (record) record.error = errorMessage
    }
  }

  private buildChildCompletionResult(delegationId: string, childSessionId: string, status: DelegationStatus, errorMessage?: string): DelegationResult {
    const record = this.active.get(delegationId)?.record ?? this.deps.lifecycle.getStatus?.(delegationId)
    const finalMessageExcerpt = record?.finalMessageExcerpt
    const result = finalMessageExcerpt
      ? `Child session ${childSessionId} completed: ${finalMessageExcerpt}`
      : `Child session ${childSessionId} reached terminal status ${status}`
    return {
      actionCount: record?.actionCount,
      childSessionId,
      delegationId,
      error: errorMessage ?? record?.error,
      evidenceLevel: record?.evidenceLevel ?? (finalMessageExcerpt ? "message" : "status-only"),
      executionState: record?.executionState,
      finalMessageExcerpt,
      firstActionAt: record?.firstActionAt,
      messageCount: record?.messageCount,
      result: status === "completed" ? result : undefined,
      signalSource: record?.signalSource,
      status,
      toolCallCount: record?.toolCallCount,
    }
  }

  private routeTerminal(delegationId: string, type: DelegationNotification["type"], message: string): void {
    this.deps.notificationRouter.route({ delegationId, idempotencyKey: `${delegationId}:${type}:${message}`, message, timestamp: Date.now(), type })
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
      actionCount: 0, evidenceLevel: "accepted-only", executionState: "pending", lastMessageCount: 0, messageCount: 0, nestingDepth: params.currentDepth + 1, parentSessionId: params.parentSessionId, queueKey,
      prompt: params.prompt, stablePollCount: 0, status: "dispatched", surface: params.surface, workingDirectory: params.workingDirectory ?? process.cwd(),
      toolCallCount: 0,
    }
  }

  private errorResult(delegationId: string, caughtError: unknown): DelegationResult {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    return { delegationId, error: `[Harness] Native Task dispatch failed: ${message}`, status: "error" }
  }
}
