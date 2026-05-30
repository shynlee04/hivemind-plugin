import type { DelegationNotification, DelegationNotificationType } from "./types.js"
import { formatCompactLine, formatDelegationNotification, type NotificationFormatOptions } from "./notification-formatter.js"

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

  constructor(private readonly options: NotificationRouterOptions = {}) {}

  /** Register a delegation-to-parent route. */
  register(delegationId: string, parentSessionId: string): void {
    this.routes.set(delegationId, { parentSessionId, notifications: [] })
  }

  /** Resolve a notification target without broadcasting to unrelated parents. */
  route(notification: DelegationNotification): RouteResult | undefined {
    const route = this.routes.get(notification.delegationId)
    if (!route) return undefined
    if (notification.idempotencyKey && this.deliveredKeys.has(notification.idempotencyKey)) {
      return { parentSessionId: route.parentSessionId, notification }
    }
    if (!isParentFacingNotification(notification.type)) {
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
      return { parentSessionId: route.parentSessionId, notification }
    }
    const deliveryResult = this.options.deliver?.(route.parentSessionId, notification) ?? true
    if (typeof (deliveryResult as Promise<boolean>).then === "function") {
      void (deliveryResult as Promise<boolean>)
        .then((delivered) => { this.finalizeDelivery(notification.delegationId, notification, delivered) })
        .catch(() => { this.finalizeDelivery(notification.delegationId, notification, false) })
    } else if (deliveryResult) {
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
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
      this.retryState.set(delegationId, { retryCount: 1, maxRetries: 1, expiresAt: Date.now() + 5 * 60 * 1000 })
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
    this.routes.delete(delegationId)
    this.retryState.delete(delegationId)
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
          expiresAt: state?.expiresAt ?? Date.now() + 5 * 60 * 1000,
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
