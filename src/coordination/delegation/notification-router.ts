import type { DelegationNotification, DelegationNotificationType } from "./types.js"

export interface RouteResult {
  parentSessionId: string
  notification: DelegationNotification
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

  /** Register a delegation-to-parent route. */
  register(delegationId: string, parentSessionId: string): void {
    this.routes.set(delegationId, { parentSessionId, notifications: [] })
  }

  /** Resolve a notification target without broadcasting to unrelated parents. */
  route(notification: DelegationNotification): RouteResult | undefined {
    const route = this.routes.get(notification.delegationId)
    return route ? { parentSessionId: route.parentSessionId, notification } : undefined
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
    if (route.notifications.length > this.pendingLimit) route.notifications.splice(0, route.notifications.length - this.pendingLimit)
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

  /** Format a compact parent-facing notification line. */
  formatNotification(type: DelegationNotificationType, delegationId: string, message: string): string {
    return `${NOTIFICATION_ICONS[type]} [DT:${delegationId}] ${type} — ${message}`
  }
}
