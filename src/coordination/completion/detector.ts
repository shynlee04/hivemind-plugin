import type { DelegationResult, DelegationStatus } from "../delegation/types.js"

export type CompletionSignal = "idle" | "error" | "deleted" | "timeout" | "cancelled"

export type CompletionResult = {
  signal: CompletionSignal
  sessionID: string
  error?: string
}

type Watcher = {
  resolve: (result: CompletionResult) => void
  timeoutId: ReturnType<typeof setTimeout>
}

type DualSignalWatcher = {
  callback: (result: DelegationResult) => void
  completionResult?: DelegationResult
  fired: boolean
  gotCompletionEvent: boolean
  terminalStatus?: DelegationStatus
}

const TERMINAL_EVENTS: Record<string, CompletionSignal> = {
  "session.idle": "idle",
  "session.error": "error",
  "session.deleted": "deleted",
}

export class CompletionDetector {
  private watchers = new Map<string, Watcher>()
  private cachedResults = new Map<string, CompletionResult>()
  private dualSignalWatchers = new Map<string, DualSignalWatcher>()
  private messageCounts = new Map<string, number>()
  private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(private readonly stabilityTimeoutMs: number = 30000) {}

  feed(eventType: string, sessionID: string | undefined, error?: string): void {
    if (!sessionID) {
      return
    }

    const signal = TERMINAL_EVENTS[eventType]
    if (!signal) {
      return
    }

    const result: CompletionResult = { signal, sessionID }
    if (signal === "error" && error) {
      result.error = error
    }

    this.clearStabilityTimer(sessionID)

    const watcher = this.watchers.get(sessionID)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      this.watchers.delete(sessionID)
      watcher.resolve(result)
    } else {
      if (signal !== "idle") {
        this.cachedResults.set(sessionID, result)
      }
    }
  }

  async watch(sessionID: string, timeoutMs: number): Promise<CompletionResult> {
    const cached = this.cachedResults.get(sessionID)
    if (cached) {
      this.cachedResults.delete(sessionID)
      return cached
    }

    return new Promise<CompletionResult>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.watchers.delete(sessionID)
        resolve({ signal: "timeout", sessionID })
      }, timeoutMs)

      this.watchers.set(sessionID, { resolve, timeoutId })
    })
  }

  /**
   * Watches a WaiterModel delegation until both native completion and terminal status signals arrive.
   *
   * @param delegationId - Delegation record identifier used by the coordination layer
   * @param childSessionId - Child session associated with the delegated native Task execution
   * @param callback - Callback invoked exactly once after both completion signals are present
   */
  watchDualSignal(delegationId: string, _childSessionId: string, callback: (result: DelegationResult) => void): void {
    this.dualSignalWatchers.set(delegationId, {
      callback,
      fired: false,
      gotCompletionEvent: false,
    })
  }

  /** Marks that native Task completion was observed for a delegation. */
  signalCompletionEvent(delegationId: string, result?: DelegationResult): void {
    const watcher = this.dualSignalWatchers.get(delegationId)
    if (!watcher) return
    watcher.gotCompletionEvent = true
    watcher.completionResult = this.mergeCompletionResult(watcher.completionResult, result)
    this.fireDualSignalIfReady(delegationId, watcher)
  }

  /** Marks the latest lifecycle status for a delegation, completing only for terminal statuses. */
  signalTerminalStatus(delegationId: string, status: DelegationStatus): void {
    const watcher = this.dualSignalWatchers.get(delegationId)
    if (!watcher || !this.isTerminalStatus(status)) return
    watcher.terminalStatus = status
    this.fireDualSignalIfReady(delegationId, watcher)
  }

  /** Clears standard and WaiterModel completion state for the provided watcher key. */
  unwatch(key: string): void {
    const watcher = this.watchers.get(key)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      this.watchers.delete(key)
    }
    this.dualSignalWatchers.delete(key)
  }

  /**
   * Non-destructively peeks at a cached terminal signal without consuming it.
   *
   * Used by the SDK polling loop (Phase 36.1 re-wiring) so a poll cycle can
   * look ahead without losing the cached result if it decides not to act.
   *
   * @param sessionID - Child session ID being polled.
   * @returns The cached `CompletionResult`, or `undefined` if none is cached.
   */
  peekCachedResult(sessionID: string): CompletionResult | undefined {
    return this.cachedResults.get(sessionID)
  }

  /**
   * Consumes (reads + clears) a cached terminal signal for the given session.
   *
   * Used by the SDK polling loop (Phase 36.1 re-wiring) when a cached signal
   * has been acted on and should not fire a second time. Idempotent: returns
   * `undefined` if there is no cached result, or if a previous call already
   * consumed it.
   *
   * @param sessionID - Child session ID being polled.
   * @returns The previously cached `CompletionResult`, or `undefined`.
   */
  consumeCachedResult(sessionID: string): CompletionResult | undefined {
    const cached = this.cachedResults.get(sessionID)
    if (!cached) return undefined
    this.cachedResults.delete(sessionID)
    return cached
  }

  cancel(sessionID: string): void {
    this.clearStabilityTimer(sessionID)

    const watcher = this.watchers.get(sessionID)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      this.watchers.delete(sessionID)
      watcher.resolve({ signal: "cancelled", sessionID })
    } else {
      this.cachedResults.set(sessionID, { signal: "cancelled", sessionID })
    }
  }

  feedMessageCount(sessionID: string, count: number): void {
    if (count == null || !Number.isFinite(count) || count < 0) return  // Bug F3: graceful no-op
    const prev = this.messageCounts.get(sessionID)
    this.messageCounts.set(sessionID, count)

    if (prev === undefined) {
      this.startStabilityTimer(sessionID)
    } else if (prev !== count) {
      this.clearStabilityTimer(sessionID)
      this.startStabilityTimer(sessionID)
    }
  }

  private startStabilityTimer(sessionID: string): void {
    const timerId = setTimeout(() => {
      this.stabilityTimers.delete(sessionID)
      this.messageCounts.delete(sessionID)

      const watcher = this.watchers.get(sessionID)
      if (watcher) {
        clearTimeout(watcher.timeoutId)
        this.watchers.delete(sessionID)
        watcher.resolve({ signal: "idle", sessionID })
      } else {
        this.cachedResults.set(sessionID, { signal: "idle", sessionID })
      }
    }, this.stabilityTimeoutMs)

    this.stabilityTimers.set(sessionID, timerId)
  }

  private clearStabilityTimer(sessionID: string): void {
    const timerId = this.stabilityTimers.get(sessionID)
    if (timerId) {
      clearTimeout(timerId)
      this.stabilityTimers.delete(sessionID)
    }
    this.messageCounts.delete(sessionID)
  }

  private fireDualSignalIfReady(delegationId: string, watcher: DualSignalWatcher): void {
    if (watcher.fired || !watcher.gotCompletionEvent || !watcher.terminalStatus) return
    watcher.fired = true
    watcher.callback({ ...watcher.completionResult, delegationId, status: watcher.terminalStatus })
  }

  private mergeCompletionResult(previous: DelegationResult | undefined, next: DelegationResult | undefined): DelegationResult | undefined {
    if (!previous) return next
    if (!next) return previous
    return { ...previous, ...next }
  }

  private isTerminalStatus(status: DelegationStatus): boolean {
    return status === "completed" || status === "error" || status === "timeout"
  }
}
