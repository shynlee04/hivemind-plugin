/**
 * P58.8 (S4, REQ-58-10) — in-memory child event bus.
 *
 * Subscribes to child session events via the OpenCode SDK and pushes a
 * bounded ring buffer per session. Used by `delegation-status {action:
 * "progress"}` to surface the latest event without re-running the
 * counter-based `progressPct` calculation.
 *
 * Design constraints (per 58-PLAN-08-GAP-FIX.md:233-237):
 * - ≤ 100 LOC module
 * - Ring buffer per session, capped at 100 events (drop oldest on overflow)
 * - Singleton export `childEventStream`
 * - Subscribe/unsubscribe wrap in try/catch — silent fallback to
 *   counter-based progress when the SDK doesn't expose
 *   `client.session.subscribe` (per R2 mitigation in the plan).
 *
 * The shape of an event is intentionally loose: `{ eventType, sessionId,
 * emittedAt, payload }`. Callers (delegation-status progress action) read
 * `eventType` and `payload` to render a meaningful "what is the child
 * doing right now" answer.
 */
// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * One event observed from a child session's SDK event stream.
 * `payload` is intentionally `Record<string, unknown>` — the SDK's
 * event payload shape varies by `eventType` and version; we do not
 * validate at the bus boundary.
 */
export interface ChildEvent {
  eventType: string
  sessionId: string
  emittedAt: number
  payload: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/**
 * Subscription handle returned by `subscribe`. Stored in the bus so
 * `unsubscribe` can detach the listener when the delegation terminal.
 * Kept intentionally loose — the SDK's subscribe signature varies;
 * we hold onto whatever it returns so we can call any standard
 * unsubscribe / close method.
 */
type SubscriptionHandle = {
  close?: () => void | Promise<void>
  unsubscribe?: () => void | Promise<void>
  // Some SDKs return a Promise, some return the handle directly. We
  // accept both — `close`/`unsubscribe` are no-ops on Promise returners.
}

interface Logger {
  debug: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
}

const noopLog: Logger = { debug: () => {}, warn: () => {}, error: () => {} }

// ---------------------------------------------------------------------------
// ChildEventStream — the bus
// ---------------------------------------------------------------------------

const MAX_EVENTS_PER_SESSION = 100

export class ChildEventStream {
  private readonly events: Map<string, ChildEvent[]> = new Map()
  private readonly subscriptions: Map<string, SubscriptionHandle> = new Map()
  private log: Logger = noopLog

  /**
   * Inject a logger. Default is no-op. Plugin composition root wires
   * the harness-level logger.
   */
  setLogger(log: Logger): void {
    this.log = log
  }

  /**
   * Subscribe to events for a child session. Calls the SDK's
   * `client.session.subscribe(sessionId, handler)` if available;
   * otherwise returns silently (the caller can rely on counter-based
   * progress). All errors are caught and logged at warn level.
   */
  async subscribe(
    sessionId: string,
    sdkClient: { session?: { subscribe?: (id: string, handler: (event: unknown) => void) => Promise<SubscriptionHandle> | SubscriptionHandle } },
  ): Promise<void> {
    if (this.subscriptions.has(sessionId)) {
      this.log.debug("ChildEventStream.subscribe: already subscribed", { sessionId })
      return
    }
    const subscribeFn = sdkClient.session?.subscribe
    if (typeof subscribeFn !== "function") {
      this.log.debug("ChildEventStream.subscribe: sdkClient.session.subscribe not available; falling back to counter-based progress", { sessionId })
      return
    }
    try {
      const handle = await subscribeFn.call(sdkClient.session, sessionId, (event: unknown) => {
        this.pushEvent(sessionId, event)
      })
      this.subscriptions.set(sessionId, handle ?? {})
    } catch (err) {
      this.log.warn("ChildEventStream.subscribe: subscribe failed; falling back to counter-based progress", { sessionId, err })
    }
  }

  /**
   * Unsubscribe the listener for a child session. Idempotent. Errors
   * from the SDK's close/unsubscribe are caught and logged.
   */
  async unsubscribe(sessionId: string): Promise<void> {
    const handle = this.subscriptions.get(sessionId)
    if (!handle) return
    this.subscriptions.delete(sessionId)
    try {
      if (typeof handle.close === "function") await handle.close()
      else if (typeof handle.unsubscribe === "function") await handle.unsubscribe()
    } catch (err) {
      this.log.warn("ChildEventStream.unsubscribe: cleanup failed (non-fatal)", { sessionId, err })
    }
  }

  /**
   * Read the most recent event for a child session, or `null` if no
   * events have been recorded (or no subscription ever ran).
   */
  getLastEvent(sessionId: string): ChildEvent | null {
    const list = this.events.get(sessionId)
    if (!list || list.length === 0) return null
    return list[list.length - 1] ?? null
  }

  /**
   * Return live counters derived from the bus:
   * - `actionCount`: total events seen
   * - `messageCount`: events with eventType in {message, message.part}
   * - `toolCallCount`: events with eventType in {tool.call, tool.execute}
   *
   * The counter-based progressPct (in delegation-status) is a separate
   * signal that uses these counters as a fallback when the bus is
   * unavailable.
   */
  getCounters(sessionId: string): { actionCount: number; messageCount: number; toolCallCount: number } {
    const list = this.events.get(sessionId) ?? []
    let actionCount = 0
    let messageCount = 0
    let toolCallCount = 0
    for (const ev of list) {
      actionCount++
      if (ev.eventType === "message" || ev.eventType === "message.part") messageCount++
      if (ev.eventType === "tool.call" || ev.eventType === "tool.execute") toolCallCount++
    }
    return { actionCount, messageCount, toolCallCount }
  }

  /**
   * Test seam — wipe all events and subscriptions. Not for production
   * callers; the bus is intentionally module-singleton.
   */
  __resetForTesting(): void {
    this.events.clear()
    this.subscriptions.clear()
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private pushEvent(sessionId: string, rawEvent: unknown): void {
    const eventType = extractEventType(rawEvent)
    const payload = extractPayload(rawEvent)
    const emittedAt = Date.now()
    const event: ChildEvent = { eventType, sessionId, emittedAt, payload }
    const list = this.events.get(sessionId) ?? []
    list.push(event)
    // Ring buffer — drop oldest on overflow.
    if (list.length > MAX_EVENTS_PER_SESSION) {
      list.shift()
    }
    this.events.set(sessionId, list)
  }
}

function extractEventType(raw: unknown): string {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (typeof obj.type === "string") return obj.type
    if (typeof obj.eventType === "string") return obj.eventType
    if (typeof obj.kind === "string") return obj.kind
  }
  return "unknown"
}

function extractPayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    if (obj.payload && typeof obj.payload === "object") return obj.payload as Record<string, unknown>
    return obj
  }
  return {}
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Module-singleton instance. Wire this into the dispatch lifecycle:
 * `childEventStream.subscribe(childSessionId, sdkClient)` after a
 * delegation is dispatched; `childEventStream.unsubscribe(...)` on
 * terminal. The progress action in `delegation-status` reads via
 * `getLastEvent` and `getCounters`.
 */
export const childEventStream = new ChildEventStream()
