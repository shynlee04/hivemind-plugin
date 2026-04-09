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

const TERMINAL_EVENTS: Record<string, CompletionSignal> = {
  "session.idle": "idle",
  "session.error": "error",
  "session.deleted": "deleted",
}

export class CompletionDetector {
  private watchers = new Map<string, Watcher>()
  private cachedResults = new Map<string, CompletionResult>()
  private messageCounts = new Map<string, number>()
  private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(private readonly stabilityTimeoutMs: number = 10000) {}

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
      this.cachedResults.set(sessionID, result)
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
}
