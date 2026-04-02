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

  feed(eventType: string, sessionID: string | undefined, error?: string): void {
    if (!sessionID) return
    const watcher = this.watchers.get(sessionID)
    if (!watcher) return

    switch (eventType) {
      case "session.idle": {
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "idle", sessionID })
        this.watchers.delete(sessionID)
        break
      }
      case "session.error": {
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "error", sessionID, error })
        this.watchers.delete(sessionID)
        break
      }
      case "session.deleted": {
        clearTimeout(watcher.timeoutId)
        watcher.resolve({ signal: "deleted", sessionID })
        this.watchers.delete(sessionID)
        break
      }
    }
  }

  watch(sessionID: string, timeoutMs: number): Promise<CompletionResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.watchers.delete(sessionID)
        resolve({ signal: "timeout", sessionID })
      }, timeoutMs)
      this.watchers.set(sessionID, { resolve, timeoutId })
    })
  }

  cancel(sessionID: string): void {
    const watcher = this.watchers.get(sessionID)
    if (watcher) {
      clearTimeout(watcher.timeoutId)
      watcher.resolve({ signal: "cancelled", sessionID })
      this.watchers.delete(sessionID)
    }
  }
}
