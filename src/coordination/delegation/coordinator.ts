import type { DelegationDispatcher, PreflightParams, PreflightResult } from "./dispatcher.js"
import type { DelegationLifecycle } from "./lifecycle.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"
import type { PeriodicNotifier } from "./periodic-notifier.js"
import type { Delegation, DelegationNotification, DelegationResult, DelegationSignalSource, DelegationStatus } from "./types.js"
import type { SlotHandle } from "./slot-manager.js"
import { z } from "zod"
import { type OpenCodeClient, getSessionMessages } from "../../shared/session-api.js"
import { notifyParentSession } from "../completion/notification-handler.js"

/**
 * Minimal SDK message shape used by the coordinator.
 * The SDK has evolved its message format — messages may carry metadata in a
 * nested `info` wrapper or directly on the top-level object. This type
 * captures both shapes without relying on `any`.
 */
interface SdkMessageInfo {
  role?: string
  modelID?: string
  providerID?: string
  model?: { providerID?: string; modelID?: string }
  error?: unknown
}

interface SdkMessage {
  info?: SdkMessageInfo
  role?: string
  modelID?: string
  providerID?: string
  model?: { providerID?: string; modelID?: string }
  error?: unknown
}

/**
 * Zod-validated SDK message shape covering both `info.*` wrapper and
 * top-level field positions. Used by the typed extraction functions below
 * to avoid inline type assertions (`as SdkMessage`, `as Record`).
 */
export const sdkMessageSchema = z.object({
  role: z.string().optional(),
  info: z.object({
    role: z.string().optional(),
    error: z.unknown().optional(),
  }).optional(),
  error: z.unknown().optional(),
})

/** Inferred body type from the Zod schema. */
export type SdkMessageShape = z.infer<typeof sdkMessageSchema>

/**
 * Extract the role field from an SDK message, preferring `info.role` over
 * the top-level `role` (the nested wrapper is the newer SDK format).
 *
 * @param msg - A parsed SDK message body (Zod-validated).
 * @returns The role string, or `undefined` if neither field is present.
 */
export function extractSdkMessageRole(msg: SdkMessageShape): string | undefined {
  return msg?.info?.role ?? msg?.role
}

/**
 * Extract a concise error string from an SDK message. Searches `info.error`
 * first, then falls back to top-level `error`. For object errors, extracts
 * the `.message` property if available; otherwise returns `String(errorField)`.
 *
 * This function deliberately does NOT use `JSON.stringify()` on the error
 * field — JSON.stringify produces unreadable long strings for complex objects.
 *
 * @param msg - A parsed SDK message body (Zod-validated).
 * @returns A concise error string, or `undefined` if no error field is present.
 */
export function extractSdkMessageError(msg: SdkMessageShape): string | undefined {
  const errorField = msg?.info?.error ?? msg?.error
  if (errorField === undefined) return undefined
  if (typeof errorField === "object" && errorField !== null) {
    const message = (errorField as Record<string, unknown>)?.message
    return typeof message === "string" && message.length > 0
      ? message
      : String(errorField)
  }
  return String(errorField)
}

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
  periodicNotifier?: Pick<PeriodicNotifier, "deregister" | "register">
  onChildSessionCreated?: (childSessionId: string, parentSessionId: string) => void
  client?: OpenCodeClient
  /**
   * P58.8 S1 (REQ-58-07): optional session manager reference used to start
   * the capture-pane polling loop after a child session is created. When
   * undefined, no polling is started (tmux may be unavailable or the
   * integration is not wired in the current environment).
   */
  sessionManager?: { startPolling(intervalMs?: number): void }
}

export interface ChildSessionStartParams {
  agent: string
  delegationId: string
  parentSessionId: string
  prompt: string
  validatedAgent: PreflightResult["validatedAgent"]
  workingDirectory: string
  onChildSessionId?: (childSessionId: string) => void
  model?: {
    providerID: string
    modelID: string
  }
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
    this.deps.lifecycle.register?.(record, true)

    this.deps.lifecycle.transition(delegationId, "dispatched")
    this.deps.notificationRouter.register(delegationId, params.parentSessionId)

    // Retrieve parent session model for provider/model ID inheritance
    let inheritedModel: { providerID: string; modelID: string } | undefined
    if (this.deps.client && params.parentSessionId) {
      try {
        const parentMessages = await getSessionMessages(this.deps.client, params.parentSessionId)
        for (const msg of [...parentMessages].reverse()) {
          const raw = (msg as SdkMessage)
          const msgInfo: SdkMessage = raw?.info as SdkMessage ?? raw
          if (msgInfo?.modelID && msgInfo?.providerID) {
            inheritedModel = {
              providerID: msgInfo.providerID,
              modelID: msgInfo.modelID,
            }
            break
          }
          if (msgInfo?.model?.providerID && msgInfo?.model?.modelID) {
            inheritedModel = {
              providerID: msgInfo.model.providerID,
              modelID: msgInfo.model.modelID,
            }
            break
          }
        }
      } catch (err) {
        // Best-effort: safe fallback — ignore error getting parent model
        void this.deps.client?.app?.log?.({
          body: {
            service: "delegation",
            level: "warn",
            message: `[Harness] Failed to resolve parent model for ${params.parentSessionId}: ${err instanceof Error ? err.message : String(err)}`,
          },
        })
      }
    }

    if (this.deps.childSessionStarter) {
      try {
        const child = await this.deps.childSessionStarter.start({
          agent: params.agent,
          delegationId,
          parentSessionId: params.parentSessionId,
          prompt: params.prompt ?? "",
          validatedAgent: preflight.validatedAgent,
          workingDirectory: params.workingDirectory ?? process.cwd(),
          onChildSessionId: (childSessionId) => this.attachChildSession(delegationId, childSessionId),
          model: inheritedModel,
        })
        this.attachChildSession(delegationId, child.childSessionId)
        this.deps.lifecycle.transition(delegationId, "running")

        // Notify session-tracker (if wired) so child sessions created by
        // delegate-task are visible even when session.created events don't fire
        // for SDK-created sessions.
        this.deps.onChildSessionCreated?.(child.childSessionId, params.parentSessionId)

        // P58.8 S1 (REQ-58-07): start the capture-pane polling loop on
        // first child session creation so the parent tmux panel receives
        // child events in real time. startPolling is idempotent — safe to
        // call on every dispatch.
        this.deps.sessionManager?.startPolling()

        // Phase 23: Notify parent session — toast + context injection
        if (this.deps.client) {
          void notifyParentSession(this.deps.client, params.parentSessionId, {
            sessionID: child.childSessionId,
            description: `Delegation: ${params.agent}`,
            agent: params.agent,
            status: "started",
          })
        }
      } catch (caughtError) {
        this.failDispatch(delegationId, caughtError)
        return this.errorResult(delegationId, caughtError)
      }
    }
    this.deps.monitor.start(delegationId, params.parentSessionId)
    this.deps.periodicNotifier?.register({
      delegationId,
      parentSessionId: params.parentSessionId,
      agent: params.agent,
      toolCount: 0,
      actionCount: 0,
      elapsedMs: 0,
    })
    this.deps.detector.watchDualSignal(delegationId, record.childSessionId, (result) => {
      this.handleCompletion(delegationId, result)
    })

    const status = this.deps.lifecycle.getStatus?.(delegationId)?.status ?? "dispatched"
    return { childSessionId: record.childSessionId, delegationId, evidenceLevel: record.evidenceLevel, executionState: record.executionState, queueKey: preflight.queueKey, status }
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
    // Propagate updates back to lifecycle/state machine — the state machine clones on
    // registerDelegation, so active-map mutation alone does not update the stored record.
    this.deps.lifecycle.register?.(record, false)
  }

  /** Record a runtime message observation for a tracked child session. */
  recordChildMessageSignal(childSessionId: string, observedAt?: number, finalMessageExcerpt?: string): void {
    const delegationId = this.getDelegationIdForChildSession(childSessionId)
    if (!delegationId) return
    const record = this.findRecord(delegationId)
    if (record && finalMessageExcerpt) record.finalMessageExcerpt = finalMessageExcerpt
    this.recordExecutionSignal(delegationId, { messageDelta: 1, observedAt, source: "message" })
  }

  /** Record a runtime tool observation for a tracked child session. */
  recordChildToolSignal(childSessionId: string, observedAt?: number): void {
    const delegationId = this.getDelegationIdForChildSession(childSessionId)
    if (!delegationId) return
    this.recordExecutionSignal(delegationId, { observedAt, source: "tool", toolDelta: 1 })
  }

  /** Mark a delegation as unconfirmed when the 60s first-action window expires without signals. */
  async markExecutionUnconfirmed(delegationId: string, elapsedSeconds: number): Promise<void> {
    const record = this.findRecord(delegationId)
    if (!record || record.executionState === "confirmed") return

    if (this.deps.client && record.childSessionId) {
      try {
        const messages = await getSessionMessages(this.deps.client, record.childSessionId)
        const lastAssistantMessage = [...messages].reverse().find(m => {
          // Per REQ-02: typed extraction via Zod-schematized body; fallback semantics preserved
          const parsed = sdkMessageSchema.safeParse(m)
          return parsed.success && extractSdkMessageRole(parsed.data) === "assistant"
        })
        if (lastAssistantMessage) {
          const parsed = sdkMessageSchema.safeParse(lastAssistantMessage)
          const errorMsg = parsed.success ? extractSdkMessageError(parsed.data) : undefined
          if (errorMsg) {
            record.error = `[Harness] Child session assistant error: ${errorMsg}`
            record.executionState = "stalled"
            this.failDispatch(delegationId, new Error(record.error))
            return
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes("404") || msg.includes("not found")) {
          record.error = `[Harness] Child session ${record.childSessionId} was deleted or not found`
          record.executionState = "stalled"
          this.failDispatch(delegationId, new Error(record.error))
          return
        }
      }
    }

    if (elapsedSeconds >= 60) {
      record.executionState = "stalled"
      record.evidenceLevel = record.evidenceLevel ?? "accepted-only"
      record.error = `[Harness] Delegation stalled without first action after ${elapsedSeconds}s`
      this.handleTimeout(delegationId)
      return
    }
    record.executionState = "unconfirmed"
    record.evidenceLevel = record.evidenceLevel ?? "accepted-only"
  }

  /** Handles terminal completion and performs monitor, notification, slot, and persistence cleanup. */
  handleCompletion(delegationId: string, result: DelegationResult): void {
    const status = result.status
    this.deps.periodicNotifier?.deregister(delegationId)
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
    // Propagate to lifecycle/state machine so reads via getStatus() see the real child session ID.
    this.deps.lifecycle.register?.(active.record, false)
  }

  private getDelegationIdForChildSession(childSessionId: string): string | undefined {
    let delegationId = this.delegationByChildSession.get(childSessionId)
    if (!delegationId) {
      for (const [id, active] of this.active.entries()) {
        if (active.record.childSessionId === childSessionId) {
          delegationId = id
          this.delegationByChildSession.set(childSessionId, id)
          break
        }
      }
    }
    return delegationId
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
    const result: DelegationResult = { delegationId, error: reason, status: "aborted", terminalKind: "cancelled", explicitCancellation: true }
    this.deps.periodicNotifier?.deregister(delegationId)
    this.deps.lifecycle.transition(delegationId, "aborted")
    this.deps.monitor.onCompletion(delegationId)
    this.routeTerminal(delegationId, "failure", reason)
    this.cleanup(delegationId, "aborted", result)
    return result
  }

  /** Cancels tracking for an active delegation without asserting child termination. */
  cancelDelegation(delegationId: string, reason = "[Harness] Delegation cancelled"): DelegationResult {
    const result: DelegationResult = { delegationId, error: reason, status: "cancelled", terminalKind: "cancelled", explicitCancellation: true }
    this.deps.lifecycle.transition(delegationId, "cancelled")
    this.deps.monitor.onCompletion(delegationId)
    this.routeTerminal(delegationId, "failure", reason)
    this.cleanup(delegationId, "cancelled", result)
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

  /** Dispatches a bounded sequential chain, passing prior results into later prompts when requested.
   * When sendPromptAsync is provided, steps after the first append to the previous child session
   * instead of creating a new one. */
  async chain(delegations: ChainStep[], sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>): Promise<DelegationResult[]> {
    const results: DelegationResult[] = []
    let previousChildSessionId: string | undefined
    for (const [index, step] of delegations.entries()) {
      if (index > 0 && previousChildSessionId && sendPromptAsync) {
        // Append to existing completed child session
        await sendPromptAsync(previousChildSessionId, step.prompt)
        const chainResult = this.buildChainResult(step, previousChildSessionId, results[results.length - 1].delegationId, index)
        results.push(chainResult)
        if (chainResult.status !== "completed") break
        continue
      }
      // First step or no sendPromptAsync: use existing dispatch
      const previous = results.at(-1)
      const result = await this.dispatch({
        agent: step.agent,
        currentDepth: index,
        parentSessionId: "chain",
        prompt: step.usePreviousResult && previous ? `${step.prompt}\n\nPrevious result: ${previous.result ?? previous.error ?? previous.status}` : step.prompt,
        queueKey: `chain:${step.agent}:${index}`,
      })
      previousChildSessionId = result.childSessionId
      const completedResult = result.status === "dispatched" ? { ...result, status: "completed" as const } : result
      results.push(completedResult)
      if (completedResult.status !== "completed") break
    }
    return results
  }

  private buildChainResult(step: ChainStep, childSessionId: string, previousDelegationId: string, _index: number): DelegationResult {
    return {
      childSessionId,
      delegationId: this.createDelegationId(),
      status: "completed" as const,
      result: step.usePreviousResult ? `Chained from ${previousDelegationId}` : undefined,
      chainedFrom: previousDelegationId,
    }
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
    // Propagate merged completion result back to lifecycle/state machine so reads
    // via getStatus() see evidence, result, and execution state.
    this.deps.lifecycle.register?.(record, false)
  }

  private handleChildSessionTerminal(childSessionId: string, status: DelegationStatus, errorMessage?: string): void {
    const delegationId = this.getDelegationIdForChildSession(childSessionId)
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
      toolCallCount: 0, v2: true,
    }
  }

  private errorResult(delegationId: string, caughtError: unknown): DelegationResult {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    return { delegationId, error: `[Harness] Native Task dispatch failed: ${message}`, status: "error" }
  }
}
