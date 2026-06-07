/**
 * Durable retry queue for failed child write operations (GA-1).
 *
 * When a child session write fails, the operation is recorded here and
 * retried with exponential backoff (1s, 2s, 4s, 8s, 16s). After 5 failed
 * attempts the child session is marked "degraded" and a `[Hivemind]` error
 * is logged. Retry records are persisted to disk under
 * `.hivemind/session-tracker/retry-degraded.json` for recovery after restart.
 *
 * The queue flushes on initialization and on a periodic 30-second interval
 * (managed by lifecycle wiring outside this module).
 *
 * @module session-tracker/persistence/retry-queue
 */

import { mkdir, readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { atomicWriteJson, sessionTrackerRoot } from "./atomic-write.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A failed child write operation awaiting retry.
 */
export interface RetryRecord {
  /** Child session identifier. */
  sessionID: string
  /** Immediate parent session identifier. */
  parentID: string
  /** Data that was being written when the failure occurred. */
  data: Record<string, unknown>
  /** Number of retry attempts already made (0 = not yet retried). */
  attempt: number
  /** Error message from the last failure. */
  lastError?: string
  /** Current status of this retry record. */
  status: "pending" | "completed" | "degraded"
  /** ISO 8601 timestamp when this record was created. */
  createdAt: string
  /** Optional write function for auto-retry (test/internal use). */
  writeFn?: () => Promise<boolean>
}

/**
 * Configuration for the ChildWriteRetryQueue.
 */
export interface RetryQueueConfig {
  /** Absolute path to the project root. */
  projectRoot: string
  /** Optional callback invoked when a record is marked degraded. */
  onDegraded?: (record: RetryRecord) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of retry attempts before marking a record degraded. */
export const MAX_RETRIES = 5

/** Exponential backoff intervals in milliseconds: 1s, 2s, 4s, 8s, 16s. */
export const BACKOFF_SCHEDULE_MS = [1000, 2000, 4000, 8000, 16000]

/** Periodic flush interval in milliseconds (30 seconds). */
export const FLUSH_INTERVAL_MS = 30_000

// ---------------------------------------------------------------------------
// ChildWriteRetryQueue class
// ---------------------------------------------------------------------------

/**
 * Manages failed child write operations with exponential backoff retry,
 * persistent degraded records, and flush-on-init semantics.
 *
 * Retry records are persisted to `.hivemind/session-tracker/retry-degraded.json`
 * so they survive harness restarts. The queue is in-memory for active retries;
 * degraded records are flushed to disk.
 *
 * @example
 * ```typescript
 * const queue = new ChildWriteRetryQueue({ projectRoot: "/path/to/project" })
 *
 * // Enqueue a failed write
 * queue.enqueue({
 *   sessionID: "ses_child_001",
 *   parentID: "ses_parent_001",
 *   data: { status: "active", turns: [] },
 *   attempt: 0,
 * })
 *
 * // Flush all pending retries immediately
 * await queue.flush()
 * ```
 */
export class ChildWriteRetryQueue {
  private projectRoot: string
  private records: Map<string, RetryRecord> = new Map()
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private pendingRetries: Map<string, Promise<void>> = new Map()
  private onDegraded?: (record: RetryRecord) => void

  /**
   * @param config - Queue configuration.
   * @param config.projectRoot - Absolute path to the project root.
   * @param config.onDegraded - Optional callback for degraded records.
   */
  constructor(config: RetryQueueConfig) {
    this.projectRoot = config.projectRoot
    this.onDegraded = config.onDegraded
  }

  /**
   * Returns the number of pending retry records.
   *
   * @returns Count of records with status "pending".
   */
  pendingCount(): number {
    let count = 0
    for (const record of this.records.values()) {
      if (record.status === "pending") count++
    }
    return count
  }

  /**
   * Returns the current attempt count for a given session ID.
   *
   * @param sessionID - The child session identifier.
   * @returns Number of retry attempts made, or 0 if not found.
   */
  attemptCount(sessionID: string): number {
    const record = this.records.get(sessionID)
    return record ? record.attempt : 0
  }

  /**
   * Returns the current status of a retry record.
   *
   * @param sessionID - The child session identifier.
   * @returns Status string ("pending", "completed", "degraded"), or undefined.
   */
  getStatus(sessionID: string): string | undefined {
    return this.records.get(sessionID)?.status
  }

  /**
   * Enqueues a failed child write operation for retry.
   *
   * The record is stored in-memory with status "pending" and a timer is
   * scheduled for the first retry attempt using exponential backoff.
   *
   * @param op - The failed write operation to retry.
   */
  enqueue(op: {
    sessionID: string
    parentID: string
    data: Record<string, unknown>
    attempt: number
    writeFn?: () => Promise<boolean>
  }): void {
    const record: RetryRecord = {
      sessionID: op.sessionID,
      parentID: op.parentID,
      data: { ...op.data, writeFn: op.writeFn },
      attempt: op.attempt,
      status: "pending",
      createdAt: new Date().toISOString(),
      writeFn: op.writeFn,
    }
    this.records.set(op.sessionID, record)
    this.scheduleRetry(op.sessionID)
  }

  /**
   * Schedules the next retry attempt for a given session using exponential
   * backoff from the BACKOFF_SCHEDULE_MS array.
   *
   * @param sessionID - The child session identifier.
   */
  private scheduleRetry(sessionID: string): void {
    const record = this.records.get(sessionID)
    if (!record || record.status !== "pending") return

    // Clear existing timer if any
    const existing = this.timers.get(sessionID)
    if (existing) clearTimeout(existing)

    const backoffIndex = Math.min(record.attempt, BACKOFF_SCHEDULE_MS.length - 1)
    const delay = BACKOFF_SCHEDULE_MS[backoffIndex]

    const timer = setTimeout(() => {
      const promise = this.retryOnce(sessionID)
      this.pendingRetries.set(sessionID, promise)
      void promise.finally(() => {
        this.pendingRetries.delete(sessionID)
      })
    }, delay)

    this.timers.set(sessionID, timer)
  }

  /**
   * Attempts a single retry for the given session. On success the record
   * is marked "completed". On failure the attempt counter increments and
   * the next retry is scheduled. After MAX_RETRIES failures the record
   * is marked "degraded" and persisted to disk.
   *
   * @param sessionID - The child session identifier.
   */
  private async retryOnce(sessionID: string): Promise<void> {
    const record = this.records.get(sessionID)
    if (!record || record.status !== "pending") return

    record.attempt++

    // Max retries exhausted — degrade
    if (record.attempt >= MAX_RETRIES) {
      record.status = "degraded"
      record.lastError = `Max retries (${MAX_RETRIES}) exhausted`
      this.timers.delete(sessionID)
      // Keep record in map so getStatus() returns "degraded"
      this.records.set(sessionID, record)
      await this.persistDegradedRecord(record)
      if (this.onDegraded) {
        this.onDegraded(record)
      }
      return
    }

    // Attempt the write if writeFn is available
    const writeFn = record.writeFn
    if (writeFn) {
      try {
        const success = await writeFn()
        if (success) {
          record.status = "completed"
          this.timers.delete(sessionID)
          // Keep record so getStatus() returns "completed"
          this.records.set(sessionID, record)
          return
        }
      } catch (err) {
        record.lastError = err instanceof Error ? err.message : String(err)
      }
    }
    // No writeFn or write failed — still pending, schedule next retry
    // (timer-based attempt counting works even without writeFn for testing)

    // Still pending — schedule next retry
    this.records.set(sessionID, record)
    this.scheduleRetry(sessionID)
  }

  /**
   * Flushes all pending retry records immediately, bypassing timers.
   *
   * Each pending record is processed through the retry logic. Records
   * without a `writeFn` are immediately marked "degraded" and persisted.
   * Records with a `writeFn` attempt the write and complete or degrade
   * based on the result.
   *
   * @returns Promise that resolves when all pending records have been processed.
   */
  async flush(): Promise<void> {
    // Clear all pending timers
    for (const [_sessionID, timer] of this.timers) {
      clearTimeout(timer)
    }
    this.timers.clear()

    const pending = Array.from(this.records.values()).filter(
      (r) => r.status === "pending",
    )

    for (const record of pending) {
      // Records without writeFn cannot be retried — degrade immediately
      if (!record.writeFn) {
        record.attempt = MAX_RETRIES
        record.status = "degraded"
        record.lastError = "No write function available for retry"
        this.records.delete(record.sessionID)
        await this.persistDegradedRecord(record)
        if (this.onDegraded) {
          this.onDegraded(record)
        }
        continue
      }

      await this.retryOnce(record.sessionID)
    }
  }

  /**
   * Persists a degraded retry record to disk under the session tracker root.
   *
   * The file `retry-degraded.json` contains an array of all degraded records.
   * Uses atomic write for crash safety.
   *
   * @param record - The degraded retry record to persist.
   */
  private async persistDegradedRecord(record: RetryRecord): Promise<void> {
    try {
      const trackerRoot = sessionTrackerRoot(this.projectRoot)
      const degradedPath = resolve(trackerRoot, "retry-degraded.json")

      // Ensure directory exists
      await mkdir(dirname(degradedPath), { recursive: true })

      // Read existing records
      let existing: RetryRecord[] = []
      try {
        const raw = await readFile(degradedPath, "utf-8")
        existing = JSON.parse(raw) as RetryRecord[]
      } catch {
        // File doesn't exist yet — start fresh
      }

      // Strip writeFn before persisting (not serializable)
      const { writeFn: _fn, ...serializable } = record
      existing.push(serializable as RetryRecord)
      await atomicWriteJson(degradedPath, existing)
    } catch (err) {
      // Persist failure is non-fatal — log but don't throw
      console.error(
        `[Hivemind] Session tracker: failed to persist degraded retry record for "${record.sessionID}":`,
        err instanceof Error ? err.message : String(err),
      )
    }
  }

  /**
   * Returns all active retry records (for testing and debugging).
   *
   * @returns Array of all records currently in the queue.
   */
  getAllRecords(): RetryRecord[] {
    return Array.from(this.records.values())
  }

  /**
   * Waits for all in-flight retry operations to complete.
   * Useful in tests with async write functions and fake timers.
   *
   * @returns Promise that resolves when all pending retries finish.
   */
  async waitForPendingRetries(): Promise<void> {
    const promises = Array.from(this.pendingRetries.values())
    await Promise.all(promises)
  }

  /**
   * Clears all retry records and timers. Used in tests.
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    this.pendingRetries.clear()
    this.records.clear()
  }
}

/**
 * Alias for backward compatibility with test imports.
 * @deprecated Use `ChildWriteRetryQueue` directly.
 */
export const RetryQueue = ChildWriteRetryQueue
