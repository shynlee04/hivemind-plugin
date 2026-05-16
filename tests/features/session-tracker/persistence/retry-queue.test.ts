/**
 * Retry queue tests for child write persistence (GA-1).
 *
 * Verifies that failed child writes are retried with exponential backoff,
 * capped at 5 retries, and marked "degraded" after max retries exhausted.
 *
 * These tests assert behavior that doesn't exist yet (TDD RED):
 * - RetryQueue class with enqueue/retry/flush lifecycle
 * - Exponential backoff: 1s, 2s, 4s, 8s, 16s
 * - Max 5 retries then mark as "degraded"
 * - Flush resolves all pending retries
 *
 * @module tests/features/session-tracker/persistence/retry-queue
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdir, rm, readFile, writeFile, existsSync } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"

// NOTE: RetryQueue doesn't exist yet — importing will fail (TDD RED).
// The import path matches where the source will be created.
import { RetryQueue } from "../../../../src/features/session-tracker/persistence/retry-queue.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tempProjectRoot(): Promise<string> {
  const dir = resolve(tmpdir(), `st-retry-queue-${randomBytes(4).toString("hex")}`)
  await mkdir(dir, { recursive: true })
  return dir
}

// ---------------------------------------------------------------------------
// Tests — TDD RED (expect import failure until source is created)
// ---------------------------------------------------------------------------

describe("RetryQueue — child write persistence (GA-1)", () => {
  let testRoot: string

  beforeEach(async () => {
    testRoot = await tempProjectRoot()
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.useRealTimers()
    try {
      await rm(testRoot, { recursive: true, force: true })
    } catch {
      /* cleanup best-effort */
    }
  })

  describe("enqueue and retry lifecycle", () => {
    it("enqueues a failed write and retries with exponential backoff", async () => {
      const queue = new RetryQueue({ projectRoot: testRoot })

      const writeOp = {
        sessionID: "ses_child_001",
        parentID: "ses_parent_001",
        data: { status: "active", turns: [] },
        attempt: 0,
      }

      queue.enqueue(writeOp)

      // Should have 1 pending item
      expect(queue.pendingCount()).toBe(1)

      // First retry at 1s
      await vi.advanceTimersByTimeAsync(1000)
      expect(queue.attemptCount("ses_child_001")).toBe(1)

      // Second retry at 2s (total 3s)
      await vi.advanceTimersByTimeAsync(2000)
      expect(queue.attemptCount("ses_child_001")).toBe(2)

      // Third retry at 4s (total 7s)
      await vi.advanceTimersByTimeAsync(4000)
      expect(queue.attemptCount("ses_child_001")).toBe(3)
    })

    it("retries up to 5 times then marks as degraded", async () => {
      const queue = new RetryQueue({ projectRoot: testRoot })

      const writeOp = {
        sessionID: "ses_child_002",
        parentID: "ses_parent_002",
        data: { status: "active", turns: [] },
        attempt: 0,
      }

      queue.enqueue(writeOp)

      // Exhaust all 5 retries
      // Backoff: 1s, 2s, 4s, 8s, 16s = 31s total
      await vi.advanceTimersByTimeAsync(32000)

      // Should be marked degraded after 5 attempts
      expect(queue.getStatus("ses_child_002")).toBe("degraded")
      expect(queue.attemptCount("ses_child_002")).toBe(5)
      expect(queue.pendingCount()).toBe(0) // Removed from active queue
    })

    it("resolves write successfully and removes from queue before max retries", async () => {
      const queue = new RetryQueue({ projectRoot: testRoot })

      // Make the 3rd attempt succeed by creating the target directory
      const childDir = resolve(
        testRoot,
        ".hivemind",
        "session-tracker",
        "ses_parent_003",
      )
      let attemptCount = 0

      const writeOp = {
        sessionID: "ses_child_003",
        parentID: "ses_parent_003",
        data: { status: "active", turns: [] },
        attempt: 0,
        // Custom write function that succeeds on 3rd attempt
        writeFn: async () => {
          attemptCount++
          if (attemptCount >= 3) {
            await mkdir(childDir, { recursive: true })
            await writeFile(resolve(childDir, "ses_child_003.json"), "{}")
            return true
          }
          throw new Error("ENOENT: mock write failure")
        },
      }

      queue.enqueue(writeOp)

      // Advance through retries: 1s + 2s + 4s = 7s
      await vi.advanceTimersByTimeAsync(7000)

      // Write should have succeeded
      expect(queue.getStatus("ses_child_003")).toBe("completed")
      expect(queue.pendingCount()).toBe(0)
    })
  })

  describe("flush and drain", () => {
    it("flush resolves all pending retries immediately", async () => {
      const queue = new RetryQueue({ projectRoot: testRoot })

      queue.enqueue({
        sessionID: "ses_child_010",
        parentID: "ses_parent_010",
        data: { status: "active" },
        attempt: 0,
      })

      queue.enqueue({
        sessionID: "ses_child_011",
        parentID: "ses_parent_010",
        data: { status: "active" },
        attempt: 0,
      })

      expect(queue.pendingCount()).toBe(2)

      // Flush immediately processes all pending
      await queue.flush()

      // Both should have been attempted (and degraded since write fails)
      expect(queue.pendingCount()).toBe(0)
    })
  })

  describe("degraded state persistence", () => {
    it("persists degraded records to disk for recovery after restart", async () => {
      const queue = new RetryQueue({ projectRoot: testRoot })

      queue.enqueue({
        sessionID: "ses_child_020",
        parentID: "ses_parent_020",
        data: { status: "active" },
        attempt: 0,
      })

      // Exhaust retries
      await vi.advanceTimersByTimeAsync(32000)

      // Degraded record should be on disk
      const degradedFile = resolve(
        testRoot,
        ".hivemind",
        "session-tracker",
        "retry-degraded.json",
      )
      const content = await readFile(degradedFile, "utf-8")
      const records = JSON.parse(content)
      expect(records).toHaveLength(1)
      expect(records[0].sessionID).toBe("ses_child_020")
      expect(records[0].status).toBe("degraded")
    })
  })
})
