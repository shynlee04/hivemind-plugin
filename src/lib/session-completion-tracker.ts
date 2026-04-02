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

export class SessionCompletionTracker {
  private watchers = new Map<string, Watcher>()
  private cachedResults = new Map<string, CompletionResult>()

  feed(eventType: string, sessionID: string | undefined, error?: string): void {
    if (!sessionID) return
    const watcher = this.watchers.get(sessionID)

    switch (eventType) {
      case "session.idle": {
        if (!watcher) {
          this.cachedResults.set(sessionID, { signal: "idle", sessionID })
          break
        }
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "idle", sessionID })
        this.watchers.delete(sessionID)
        break
      }
      case "session.error": {
        if (!watcher) {
          this.cachedResults.set(sessionID, { signal: "error", sessionID, error })
          break
        }
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "error", sessionID, error })
        this.watchers.delete(sessionID)
        break
      }
      case "session.deleted": {
        if (!watcher) {
          this.cachedResults.set(sessionID, { signal: "deleted", sessionID })
          break
        }
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "deleted", sessionID })
        this.watchers.delete(sessionID)
        break
      }
    }
  }

  watch(sessionID: string, timeoutMs: number): Promise<CompletionResult> {
    const cachedResult = this.cachedResults.get(sessionID)
    if (cachedResult) {
      this.cachedResults.delete(sessionID)
      return Promise.resolve(cachedResult)
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.watchers.delete(sessionID)
        resolve({ signal: "timeout", sessionID })
      }, timeoutMs)
      this.watchers.set(sessionID, { resolve, timeoutId })
    })
  }

  cancel(sessionID: string): void {
    this.cachedResults.delete(sessionID)
    const watcher = this.watchers.get(sessionID)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      watcher.resolve({ signal: "cancelled", sessionID })
      this.watchers.delete(sessionID)
    }
  }
}
