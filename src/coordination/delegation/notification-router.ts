import type { DelegationNotification, DelegationNotificationType } from "./types.js"
import { NOTIFICATION_RETRY_TTL_MS, NOTIFICATION_THROTTLE_INTERVAL_MS } from "../timing.js"

export interface RouteResult {
  parentSessionId: string
  notification: DelegationNotification
}

export interface PendingNotificationRecord {
  parentSessionId: string
  notification: DelegationNotification
  stateRoot: ".hivemind"
  retryCount: number
  maxRetries: number
  expiresAt: number
}

type RetryState = {
  retryCount: number
  maxRetries: number
  expiresAt: number
}

export interface NotificationRouterOptions {
  deliver?: (parentSessionId: string, notification: DelegationNotification) => boolean | Promise<boolean>
  persistPending?: (records: PendingNotificationRecord[]) => void
}

type RouteEntry = {
  parentSessionId: string
  notifications: DelegationNotification[]
}

const NOTIFICATION_ICONS: Record<DelegationNotificationType, string> = {
  failure: "❌",
  progress: "🔄",
  success: "✅",
  timeout: "⏰",
}

function isParentFacingNotification(type: DelegationNotificationType): boolean {
  return type === "success" || type === "failure" || type === "timeout"
}

/** Routes delegation notifications to their owning parent session. */
export class NotificationRouter {
  private readonly routes = new Map<string, RouteEntry>()
  private readonly pendingLimit = 50
  private readonly deliveredKeys = new Set<string>()
  private readonly retryState = new Map<string, RetryState>()
  /** Tracks last notification timestamp per parent session for throttling. */
  private readonly lastNotificationTs = new Map<string, number>()
  /** Deferred notifications queued during throttle window, aggregated by parent session. */
  private readonly deferredNotifications = new Map<string, DelegationNotification[]>()

  constructor(private readonly options: NotificationRouterOptions = {}) {}

  /** Register a delegation-to-parent route. */
  register(delegationId: string, parentSessionId: string): void {
    this.routes.set(delegationId, { parentSessionId, notifications: [] })
  }

  /** Check if delivery is throttled for this parent session (returns true if throttled). */
  private isThrottled(parentSessionId: string): boolean {
    const lastTs = this.lastNotificationTs.get(parentSessionId)
    if (lastTs === undefined) return false
    return Date.now() - lastTs < NOTIFICATION_THROTTLE_INTERVAL_MS
  }

  /** Defer a notification for batch delivery when throttle window expires. */
  private deferNotification(parentSessionId: string, notification: DelegationNotification): void {
    const existing = this.deferredNotifications.get(parentSessionId) ?? []
    existing.push(notification)
    this.deferredNotifications.set(parentSessionId, existing)
  }

  /**
   * Flush and deliver all deferred notifications for a parent session.
   * Fire-and-forget (noReply) notifications are aggregated: multiple pending
   * items are collapsed into a single-line batch with a count summary.
   */
  private flushDeferred(parentSessionId: string): void {
    const deferred = this.deferredNotifications.get(parentSessionId)
    if (!deferred || deferred.length === 0) return
    this.deferredNotifications.delete(parentSessionId)

    // Aggregate fire-and-forget notifications (non-terminal: progress)
    const terminal = deferred.filter((n) => isParentFacingNotification(n.type))
    const progress = deferred.filter((n) => !isParentFacingNotification(n.type))

    // Deliver single aggregated batch for progress notifications
    if (progress.length > 0) {
      const batchNotification: DelegationNotification = {
        delegationId: "batch",
        idempotencyKey: `batch:progress:${parentSessionId}:${Date.now()}`,
        message: `${progress.length} delegation progress updates batched`,
        timestamp: Date.now(),
        type: "progress",
      }
      if (!this.deliveredKeys.has(batchNotification.idempotencyKey!)) {
        void this.options.deliver?.(parentSessionId, batchNotification)
        this.deliveredKeys.add(batchNotification.idempotencyKey!)
      }
    }

    // Deliver terminal notifications individually
    for (const notification of terminal) {
      void this.options.deliver?.(parentSessionId, notification)
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
    }
  }

  /** Resolve a notification target without broadcasting to unrelated parents. */
  route(notification: DelegationNotification): RouteResult | undefined {
    const route = this.routes.get(notification.delegationId)
    if (!route) return undefined
    if (notification.idempotencyKey && this.deliveredKeys.has(notification.idempotencyKey)) {
      return { parentSessionId: route.parentSessionId, notification }
    }

    // Non-parent-facing notifications (progress): defer if throttled
    if (!isParentFacingNotification(notification.type)) {
      if (this.isThrottled(route.parentSessionId)) {
        this.deferNotification(route.parentSessionId, notification)
      } else {
        this.lastNotificationTs.set(route.parentSessionId, Date.now())
        void this.options.deliver?.(route.parentSessionId, notification)
      }
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
      return { parentSessionId: route.parentSessionId, notification }
    }

    // Parent-facing notifications (success/failure/timeout): throttle + deliver
    if (this.isThrottled(route.parentSessionId)) {
      this.deferNotification(route.parentSessionId, notification)
      // Still return a route result so the caller can continue
      return { parentSessionId: route.parentSessionId, notification }
    }

    // Within throttle budget — deliver immediately
    this.lastNotificationTs.set(route.parentSessionId, Date.now())
    const deliveryResult = this.options.deliver?.(route.parentSessionId, notification) ?? true
    if (typeof (deliveryResult as Promise<boolean>).then === "function") {
      void (deliveryResult as Promise<boolean>)
        .then((delivered) => {
          this.finalizeDelivery(notification.delegationId, notification, delivered)
          if (delivered) this.flushDeferred(route.parentSessionId)
        })
        .catch(() => {
          this.finalizeDelivery(notification.delegationId, notification, false)
        })
    } else if (deliveryResult) {
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
      this.flushDeferred(route.parentSessionId)
    } else {
      if (!this.shouldQueuePending(notification.delegationId)) return { parentSessionId: route.parentSessionId, notification }
      this.queuePending(notification.delegationId, notification)
    }
    return { parentSessionId: route.parentSessionId, notification }
  }

  /** Complete an async delivery attempt without duplicating pending records. */
  private finalizeDelivery(delegationId: string, notification: DelegationNotification, delivered: boolean): void {
    if (delivered) {
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
      return
    }
    if (!this.shouldQueuePending(delegationId)) return
    this.queuePending(delegationId, notification)
  }

  /** Check retry/TTL state before queueing a failed delivery. Returns false to drop silently. */
  private shouldQueuePending(delegationId: string): boolean {
    const state = this.retryState.get(delegationId)
    if (!state) {
      // First failed delivery attempt — create state and allow queue
      this.retryState.set(delegationId, { retryCount: 1, maxRetries: 1, expiresAt: Date.now() + NOTIFICATION_RETRY_TTL_MS })
      return true
    }
    // TTL expiry check
    if (state.expiresAt <= Date.now()) return false
    // Retry exhaustion check
    if (state.retryCount >= state.maxRetries) return false
    // Increment retry count and allow queue
    state.retryCount++
    return true
  }

  /** Remove a route after terminal completion. */
  deregister(delegationId: string): void {
    const route = this.routes.get(delegationId)
    this.routes.delete(delegationId)
    this.retryState.delete(delegationId)
    // Clean up deferred if parent has no remaining routes
    if (route) {
      const hasMoreRoutes = Array.from(this.routes.values()).some((r) => r.parentSessionId === route.parentSessionId)
      if (!hasMoreRoutes) {
        this.deferredNotifications.delete(route.parentSessionId)
        this.lastNotificationTs.delete(route.parentSessionId)
      }
    }
  }

  /** Queue a pending notification, bounded to the latest 50 entries. */
  queuePending(delegationId: string, notification: DelegationNotification): void {
    if (!isParentFacingNotification(notification.type)) return
    const route = this.routes.get(delegationId)
    if (!route) return
    if (notification.idempotencyKey && this.deliveredKeys.has(notification.idempotencyKey)) return
    route.notifications.push(notification)
    if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
    if (route.notifications.length > this.pendingLimit) route.notifications.splice(0, route.notifications.length - this.pendingLimit)
    this.persistAllPending()
  }

  /** Replay and clear pending notifications for a parent in FIFO order. */
  replayPending(parentSessionId: string): DelegationNotification[] {
    const replayed: DelegationNotification[] = []
    const now = Date.now()
    for (const [delegationId, route] of this.routes.entries()) {
      if (route.parentSessionId !== parentSessionId) continue
      // P22-08: Purge expired records from in-memory Map at replay time
      const state = this.retryState.get(delegationId)
      if (state && state.expiresAt <= now) {
        this.retryState.delete(delegationId)
        route.notifications = []
        continue
      }
      replayed.push(...route.notifications.splice(0))
    }
    return replayed.sort((left, right) => left.timestamp - right.timestamp)
  }

  private persistAllPending(): void {
    if (!this.options.persistPending) return
    const records: PendingNotificationRecord[] = []
    for (const [delegationId, route] of this.routes.entries()) {
      const state = this.retryState.get(delegationId)
      for (const notification of route.notifications) {
        records.push({
          notification,
          parentSessionId: route.parentSessionId,
          stateRoot: ".hivemind" as const,
          retryCount: state?.retryCount ?? 0,
          maxRetries: state?.maxRetries ?? 1,
          expiresAt: state?.expiresAt ?? Date.now() + NOTIFICATION_RETRY_TTL_MS,
        })
      }
    }
    this.options.persistPending(records)
  }

  /** Format a compact parent-facing notification line. */
  formatNotification(type: DelegationNotificationType, delegationId: string, message: string): string {
    return `${NOTIFICATION_ICONS[type]} [DT:${delegationId}] ${type} — ${message}`
  }

  /** Format a TUI system notification line for live delegation append. Extended with rich fields. */
  formatTuiNotification(type: DelegationNotificationType, delegationId: string, agent: string, elapsedMs: number, toolCount?: number, extra?: { path?: string; fileChanges?: string[]; completedAt?: string }): string {
    const opts: NotificationFormatOptions = {
      agent,
      delegationId,
      elapsedMs,
      status: type === "success" ? "completed" : type === "failure" ? "error" : type === "timeout" ? "timeout" : "cancelled",
      toolCount,
      path: extra?.path,
      fileChanges: extra?.fileChanges,
      completedAt: extra?.completedAt,
    }
    return formatCompactLine(opts)
  }

  /** Format system notification block for session prompt delivery. Extended with rich fields. */
  formatSystemNotification(type: DelegationNotificationType, delegationId: string, agent: string, elapsedMs: number, toolCount?: number, summary?: string, extra?: { path?: string; fileChanges?: string[]; completedAt?: string }): string {
    const opts: NotificationFormatOptions = {
      agent,
      delegationId,
      elapsedMs,
      status: type === "success" ? "completed" : type === "failure" ? "error" : type === "timeout" ? "timeout" : "cancelled",
      summaryPreview: summary,
      toolCount,
      path: extra?.path,
      fileChanges: extra?.fileChanges,
      completedAt: extra?.completedAt,
    }
    return formatDelegationNotification(opts)
  }
}

// ---------------------------------------------------------------------------
// Formatting functions (merged from notification-formatter.ts, REQ-03)
// ---------------------------------------------------------------------------

export interface NotificationFormatOptions {
  delegationId: string
  agent: string
  status: "completed" | "error" | "timeout" | "cancelled" | "running"
  elapsedMs: number
  toolCount?: number
  summaryPreview?: string
  /** Path to working directory or result file */
  path?: string
  /** List of modified/created files detected by completion detector */
  fileChanges?: string[]
  /** ISO 8601 completion timestamp */
  completedAt?: string
}

const STATUS_ICONS: Record<string, string> = {
  completed: "✅",
  error: "❌",
  timeout: "⏰",
  cancelled: "⊘",
  running: "🔄",
}

/**
 * Format a full system reminder block for session prompt delivery.
 * Wraps output in <system_reminder> tags with all available fields.
 */
export function formatDelegationNotification(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  const summary = opts.summaryPreview ? ` | ${opts.summaryPreview}` : ""
  const path = opts.path ? ` | path=${opts.path}` : ""
  const files = opts.fileChanges ? ` | files=${opts.fileChanges.length}` : ""
  const timestamp = opts.completedAt ? ` | at=${opts.completedAt}` : ""
  return `<system_reminder>[DT:${opts.delegationId}] ${icon} ${opts.status} | agent=${opts.agent} | ${formatDuration(opts.elapsedMs)} | tools=${tools}${path}${files}${timestamp}${summary}</system_reminder>`
}

/**
 * Format a compact thin-line string for TUI prompt append.
 * Omits summary preview to keep the line short and scannable.
 */
export function formatCompactLine(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  const path = opts.path ? ` | path=${opts.path}` : ""
  const files = opts.fileChanges ? ` | files=${opts.fileChanges.length}` : ""
  return `[DT:${opts.delegationId}] ${icon} ${opts.status} | ${formatDuration(opts.elapsedMs)} | tools=${tools} | agent=${opts.agent}${path}${files}`
}

/**
 * Format a toast-style notification line.
 * Minimal format suitable for transient UI toast displays.
 */
export function formatToastLine(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  return `${icon} [DT:${opts.delegationId}] ${opts.agent} — ${formatDuration(opts.elapsedMs)}`
}

/**
 * Format a duration in milliseconds into a human-readable string.
 * <1000ms → "Xms", <60s → "X.Xs", <60m → "Xm Ys", >=60m → "Xh Ym"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

export interface FailureNotificationOptions {
  delegationId: string
  agent: string
  failureLevel: number
  elapsedSeconds: number
  actionCount: number
  isExecutedRunning: boolean
}

/**
 * Format a failure checkpoint notification line.
 *
 * Distinguishes between sessions that ran tools but stalled
 * (executed-running-fail) and sessions that never executed (fail-from-threshold).
 */
export function formatFailureNotification(opts: FailureNotificationOptions): string {
  if (opts.isExecutedRunning) {
    return `[DT:${opts.delegationId}] ⚠ Stall failure (level ${opts.failureLevel}) | agent=${opts.agent} | last actions=${opts.actionCount} at ${opts.elapsedSeconds}s`
  }
  return `[DT:${opts.delegationId}] ❌ Execution failure | agent=${opts.agent} | no actions recorded`
}

/**
 * Format a final failure notification (level 4, 300s).
 */
export function formatFinalFailure(opts: FailureNotificationOptions): string {
  return `[DT:${opts.delegationId}] 🛑 Final failure | agent=${opts.agent} | level=${opts.failureLevel} | elapsed=${opts.elapsedSeconds}s | actions=${opts.actionCount}`
}

/**
 * Format an urgent failure notification that requires the orchestrator to respond.
 *
 * For early failures (30s/60s/120s checkpoints) where no actions were detected,
 * this creates a prompt that the orchestrator MUST respond to with a decision:
 * resume, change-agent, steer, or cancel.
 */
export function formatUrgentFailureNotification(opts: FailureNotificationOptions): string {
  const title = opts.isExecutedRunning
    ? `Delegation ${opts.delegationId} (${opts.agent}) appears stalled`
    : `Delegation ${opts.delegationId} (${opts.agent}) did not execute`

  const actions = opts.isExecutedRunning
    ? "Suggested actions: resume, change agent, adjust prompt, or cancel."
    : "Suggested actions: cancel (agent may be unavailable), change agent, or adjust prompt and retry."

  return `<system_reminder>
[DT:${opts.delegationId}] ⚠️  ${title}
  Level: ${opts.failureLevel} | Elapsed: ${opts.elapsedSeconds}s
  Actions recorded: ${opts.actionCount}
  ${actions}
</system_reminder>
`
}

/**
 * Map a DelegationNotificationType to the corresponding status string
 * used by the formatter functions.
 */
export function typeToStatus(type: DelegationNotificationType): "completed" | "error" | "timeout" | "cancelled" | "running" {
  switch (type) {
    case "success":
      return "completed"
    case "failure":
      return "error"
    case "timeout":
      return "timeout"
    case "progress":
      return "running"
  }
}
