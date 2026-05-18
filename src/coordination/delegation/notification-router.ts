import type { DelegationNotification, DelegationNotificationType } from "./types.js"

export interface RouteResult {
  parentSessionId: string
  notification: DelegationNotification
}

export interface PendingNotificationRecord {
  parentSessionId: string
  notification: DelegationNotification
  stateRoot: ".hivemind"
}

export interface NotificationRouterOptions {
  deliver?: (parentSessionId: string, notification: DelegationNotification) => boolean
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

/** Routes delegation notifications to their owning parent session. */
export class NotificationRouter {
  private readonly routes = new Map<string, RouteEntry>()
  private readonly pendingLimit = 50
  private readonly deliveredKeys = new Set<string>()

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
    const delivered = this.options.deliver?.(route.parentSessionId, notification) ?? true
    if (delivered) {
      if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
    } else {
      this.queuePending(notification.delegationId, notification)
    }
    return { parentSessionId: route.parentSessionId, notification }
  }

  /** Remove a route after terminal completion. */
  deregister(delegationId: string): void {
    this.routes.delete(delegationId)
  }

  /** Queue a pending notification, bounded to the latest 50 entries. */
  queuePending(delegationId: string, notification: DelegationNotification): void {
    const route = this.routes.get(delegationId)
    if (!route) return
    route.notifications.push(notification)
    if (notification.idempotencyKey) this.deliveredKeys.add(notification.idempotencyKey)
    if (route.notifications.length > this.pendingLimit) route.notifications.splice(0, route.notifications.length - this.pendingLimit)
    this.persistAllPending()
  }

  /** Replay and clear pending notifications for a parent in FIFO order. */
  replayPending(parentSessionId: string): DelegationNotification[] {
    const replayed: DelegationNotification[] = []
    for (const route of this.routes.values()) {
      if (route.parentSessionId !== parentSessionId) continue
      replayed.push(...route.notifications.splice(0))
    }
    return replayed.sort((left, right) => left.timestamp - right.timestamp)
  }

  private persistAllPending(): void {
    if (!this.options.persistPending) return
    const records: PendingNotificationRecord[] = []
    for (const route of this.routes.values()) {
      for (const notification of route.notifications) {
        records.push({ notification, parentSessionId: route.parentSessionId, stateRoot: ".hivemind" })
      }
    }
    this.options.persistPending(records)
  }

  /** Format a compact parent-facing notification line. */
  formatNotification(type: DelegationNotificationType, delegationId: string, message: string): string {
    return `${NOTIFICATION_ICONS[type]} [DT:${delegationId}] ${type} — ${message}`
  }
}
