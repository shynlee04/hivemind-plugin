/**
 * Per-child serial write queue infrastructure for ChildWriter.
 *
 * Provides stale-queue detection and serial write enqueue logic
 * to prevent concurrent read-modify-write corruption on child `.json` files.
 *
 * @module session-tracker/persistence/child-writer-queue
 */

import type { ChildWriteRetryQueue } from "./retry-queue.js"

// ---------------------------------------------------------------------------
// Logger (local to avoid cross-module circular deps)
// ---------------------------------------------------------------------------

/** Minimal structured logger matching the harness pattern. */
interface Logger {
  debug: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
}

const noopLog: Logger = { debug: () => {}, warn: () => {}, error: () => {} }

/** Module-level logger. Default is no-op. Use `setQueueLogger()` to inject. */
let log: Logger = noopLog

/**
 * Inject a structured logger into the child-writer-queue module.
 * Called by the plugin composition root to wire the harness-level logger.
 */
export function setQueueLogger(injected: Logger): void {
  log = injected
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data envelope for retry queue enrollment on write failure. */
export interface RetryData {
  sessionID: string
  parentID: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Stale-queue detection
// ---------------------------------------------------------------------------

/**
 * Threshold (in milliseconds) before a per-child queue is considered
 * stale and auto-reset. Shared across ChildWriter instances.
 */
export const STALE_QUEUE_MS = 5 * 60 * 1000

/**
 * Detects and resets a stale write queue for a given child.
 *
 * If no write has completed for this child file within `STALE_QUEUE_MS`,
 * the queue is replaced with a fresh resolved promise so subsequent
 * writes are not blocked by a stuck preceding promise.
 *
 * @param queueKey - The queue key (`parentID/childID`).
 * @param writeQueues - The per-child queue map.
 * @param lastWriteTimes - The per-child last-write timestamp map.
 */
export function detectStaleQueue(
  queueKey: string,
  writeQueues: Map<string, Promise<void>>,
  lastWriteTimes: Map<string, number>,
): void {
  const lastTime = lastWriteTimes.get(queueKey)
  // No write has completed for this child yet — nothing to reset
  if (lastTime === undefined) return
  if (Date.now() - lastTime > STALE_QUEUE_MS) {
    writeQueues.set(queueKey, Promise.resolve())
  }
}

// ---------------------------------------------------------------------------
// Serial write enqueue
// ---------------------------------------------------------------------------

/**
 * Enqueues a write operation into the per-child serial queue.
 *
 * Stale-queue detection runs first to auto-recover from a frozen pipeline.
 * Chains the provided function onto the end of the child's write queue
 * so that only one write per child file is in-flight at a time. Records
 * `lastWriteTime` on success. Failed writes are enqueued to the retry
 * queue (RC-5) and the error is propagated to the caller.
 *
 * @param queueKey - The queue key (`parentID/childID`).
 * @param fn - The write operation to enqueue.
 * @param retryData - Optional data for retry queue enrollment on failure.
 * @param writeQueues - The per-child queue map (mutated in place).
 * @param lastWriteTimes - The per-child timestamp map (mutated in place).
 * @param retryQueue - Optional retry queue for failed writes (RC-5).
 * @returns Promise that resolves when the enqueued write completes.
 */
export function enqueueWrite(
  queueKey: string,
  fn: () => Promise<void>,
  retryData: RetryData | undefined,
  writeQueues: Map<string, Promise<void>>,
  lastWriteTimes: Map<string, number>,
  retryQueue: ChildWriteRetryQueue | undefined,
): Promise<void> {
  detectStaleQueue(queueKey, writeQueues, lastWriteTimes)
  const current = writeQueues.get(queueKey) ?? Promise.resolve()
  const next = current.then(async () => {
    await fn()
    lastWriteTimes.set(queueKey, Date.now())
  }).catch(async (err) => {
    // RC-5: Enqueue failed write to retry queue instead of swallowing
    if (retryData && retryQueue) {
      retryQueue.enqueue({
        sessionID: retryData.sessionID,
        parentID: retryData.parentID,
        data: retryData.data,
        attempt: 0,
        writeFn: async () => {
          await fn()
          return true
        },
      })
    }
    // Propagate error to caller
    throw err
  })
  writeQueues.set(
    queueKey,
    next.catch((err) => {
      // Error already propagated via throw and enters retry queue.
      // This catch prevents unhandled rejection while still logging for observability.
      // P41-G: Suppress log for ENOENT (child file missing) — already handled
      // by per-method try-catch; this catch only fires when an unexpected error occurs.
      if (err && typeof err === "object" && "code" in err && (err as Record<string, unknown>).code === "ENOENT") {
        return
      }
      log.warn("session-tracker: ChildWriter queue write failed", {
        service: "session-tracker",
        queueKey,
        error: err instanceof Error ? err.message : String(err),
      })
    }),
  )
  return next
}
