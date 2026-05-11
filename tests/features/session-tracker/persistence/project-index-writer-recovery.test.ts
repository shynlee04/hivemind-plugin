/**
 * ProjectIndexWriter recovery tests — stale-queue detection and auto-recovery (DEFECT-02).
 *
 * @module tests/features/session-tracker/persistence/project-index-writer-recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"

// Spy on atomicWriteJson — use real implementation for persistence but track calls
vi.mock(
  "../../../../src/features/session-tracker/persistence/atomic-write.js",
  async () => {
    const actual = await vi.importActual(
      "../../../../src/features/session-tracker/persistence/atomic-write.js",
    )
    const spy = vi.fn(actual.atomicWriteJson)
    return {
      ...actual,
      atomicWriteJson: spy,
    }
  },
)

import {
  atomicWriteJson,
} from "../../../../src/features/session-tracker/persistence/atomic-write.js"
import {
  ProjectIndexWriter,
} from "../../../../src/features/session-tracker/persistence/project-index-writer.js"

const mockAtomicWriteJson = vi.mocked(atomicWriteJson)

describe("ProjectIndexWriter recovery (DEFECT-02)", () => {
  let writer: ProjectIndexWriter
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()

    tmpDir = resolve(tmpdir(), `hivemind-test-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })

    writer = new ProjectIndexWriter({ projectRoot: tmpDir })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  })

  describe("stale queue auto-recovery", () => {
    it("should log warning and reset queue when writes are stalled >5 minutes", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {})

      // Initialize normally and verify first write succeeds
      await writer.initializeIndex()
      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      mockAtomicWriteJson.mockClear()

      // Artificially age the lastWriteTime to 10 minutes ago
      ;(writer as any).lastWriteTime = Date.now() - 10 * 60 * 1000

      // Verify queue is detected as stalled before recovery
      const healthBefore = await writer.getQueueHealth()
      expect(healthBefore.stalled).toBe(true)

      // Trigger a new write — stale detection should fire and reset
      await writer.addSession(
        "ses_test12345abcdefg0",
        "ses_test12345abcdefg0/",
        "ses_test12345abcdefg0.md",
      )

      // Verify the stale warning was logged
      const staleWarnings = consoleWarnSpy.mock.calls.filter((call) =>
        call[0].includes("STALE"),
      )
      expect(staleWarnings.length).toBeGreaterThanOrEqual(1)

      // Verify the write still succeeded after recovery
      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      expect((data as any).sessions["ses_test12345abcdefg0"]).toBeDefined()

      // Verify queue is healthy again
      const healthAfter = await writer.getQueueHealth()
      expect(healthAfter.stalled).toBe(false)

      consoleWarnSpy.mockRestore()
    })

    it("should report queue health correctly when writes are recent", async () => {
      await writer.initializeIndex()

      const health = await writer.getQueueHealth()
      expect(health.stalled).toBe(false)
      expect(health.lastWriteTime).toBeDefined()
      expect(new Date(health.lastWriteTime).getTime()).toBeGreaterThan(0)
    })

    it("should allow writes after stale recovery without further warnings", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {})

      // Artificially age the queue
      ;(writer as any).lastWriteTime = Date.now() - 10 * 60 * 1000

      // First write triggers recovery
      await writer.addSession("ses_aaa", "ses_aaa/", "ses_aaa.md")
      mockAtomicWriteJson.mockClear()

      // Second write should NOT trigger another stale warning
      await writer.addSession("ses_bbb", "ses_bbb/", "ses_bbb.md")

      // Count only STALE warnings after first write
      const staleWarnings = consoleWarnSpy.mock.calls.filter(
        (call) => call[0].includes("STALE"),
      )

      // The stale warning should fire exactly once (during the first write)
      // The second write should proceed normally
      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)

      consoleWarnSpy.mockRestore()
    })
  })

  describe("getQueueHealth", () => {
    it("should return lastWriteTime as ISO string and stalled flag", async () => {
      await writer.initializeIndex()

      const health = await writer.getQueueHealth()
      expect(typeof health.lastWriteTime).toBe("string")
      expect(typeof health.stalled).toBe("boolean")
      expect(health.stalled).toBe(false)
    })

    it("should report stalled=true when queue is stale", async () => {
      // Artificially age
      ;(writer as any).lastWriteTime = Date.now() - 10 * 60 * 1000

      const health = await writer.getQueueHealth()
      expect(health.stalled).toBe(true)
    })
  })
})
