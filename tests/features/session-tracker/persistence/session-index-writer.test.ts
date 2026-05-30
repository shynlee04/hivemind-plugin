/**
 * SessionIndexWriter tests — session-local continuity index management.
 *
 * @module tests/features/session-tracker/persistence/session-index-writer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import {
  SessionIndexWriter,
} from "../../../../src/features/session-tracker/persistence/session-index-writer.js"

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

// We still need safeSessionPath and ensureDirectory
import {
  atomicWriteJson,
  safeSessionPath,
  ensureDirectory,
} from "../../../../src/features/session-tracker/persistence/atomic-write.js"

const mockAtomicWriteJson = vi.mocked(atomicWriteJson)

describe("SessionIndexWriter", () => {
  let writer: SessionIndexWriter
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()

    tmpDir = resolve(tmpdir(), `hivemind-test-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })

    writer = new SessionIndexWriter({ projectRoot: tmpDir })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  })

  describe("initializeIndex", () => {
    it("should write initial session-continuity.json", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [filePath, data] = mockAtomicWriteJson.mock.calls[0]
      expect(filePath).toContain("session-continuity.json")
      expect(data).toMatchObject({
        version: "2.0",
        sessionID: "ses_test12345abcdefg0",
        turnCount: 0,
      })
      expect((data as any).hierarchy.children).toEqual({})
      expect((data as any).toolSummary).toEqual({})
    })
  })

  describe("addChild", () => {
    it("should add child to hierarchy in index", async () => {
      // First initialize
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.addChild(
        "ses_test12345abcdefg0",
        "ses_child123456789ab",
        "ses_child123456789ab.json",
        1,
        "Hm-L0-Orchestrator",
      )

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const hierarchy = (data as any).hierarchy
      expect(hierarchy.children["ses_child123456789ab"]).toBeDefined()
      expect(hierarchy.children["ses_child123456789ab"]).toMatchObject({
        file: "ses_child123456789ab.json",
        depth: 1,
        status: "active",
        delegatedBy: "Hm-L0-Orchestrator",
      })
    })
  })

  describe("updateChildStatus", () => {
    it("should update child status in index", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      await writer.addChild(
        "ses_test12345abcdefg0",
        "ses_child123456789ab",
        "ses_child123456789ab.json",
        1,
        "Hm-L0-Orchestrator",
      )
      mockAtomicWriteJson.mockClear()

      await writer.updateChildStatus(
        "ses_test12345abcdefg0",
        "ses_child123456789ab",
        "completed",
      )

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const child = (data as any).hierarchy.children["ses_child123456789ab"]
      expect(child.status).toBe("completed")
    })

    it("should no-op if child not found", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.updateChildStatus(
        "ses_test12345abcdefg0",
        "ses_nonexistent",
        "completed",
      )

      // Should still write (no-op update)
      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
    })

    it("should update nested child status in root-owned hierarchy", async () => {
      await writer.initializeIndex("ses_root1234567890")
      await writer.addChild(
        "ses_root1234567890",
        "ses_l1child123456",
        "ses_l1child123456.json",
        1,
        "hm-l0-orchestrator",
      )
      await writer.addChild(
        "ses_root1234567890",
        "ses_l2child123456",
        "ses_l2child123456.json",
        2,
        "hm-l1-coordinator",
        "ses_l1child123456",
      )
      mockAtomicWriteJson.mockClear()

      await writer.updateChildStatus(
        "ses_root1234567890",
        "ses_l2child123456",
        "completed",
      )

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const l1 = (data as any).hierarchy.children["ses_l1child123456"]
      expect(l1.children["ses_l2child123456"].status).toBe("completed")
    })
  })

  describe("incrementTurnCount", () => {
    it("should increment turn count", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.incrementTurnCount("ses_test12345abcdefg0")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      expect((data as any).turnCount).toBe(1)
    })

    it("should increment multiple times correctly", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.incrementTurnCount("ses_test12345abcdefg0")
      await writer.incrementTurnCount("ses_test12345abcdefg0")
      await writer.incrementTurnCount("ses_test12345abcdefg0")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(3)
      const [, data] = mockAtomicWriteJson.mock.calls[2]
      expect((data as any).turnCount).toBe(3)
    })
  })

  describe("updateToolSummary", () => {
    it("should increment tool count in summary", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.updateToolSummary("ses_test12345abcdefg0", "skill")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      expect((data as any).toolSummary.skill).toBe(1)
    })

    it("should accumulate tool counts", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.updateToolSummary("ses_test12345abcdefg0", "skill")
      await writer.updateToolSummary("ses_test12345abcdefg0", "skill")
      await writer.updateToolSummary("ses_test12345abcdefg0", "read")

      const [, data] = mockAtomicWriteJson.mock.calls[2]
      expect((data as any).toolSummary.skill).toBe(2)
      expect((data as any).toolSummary.read).toBe(1)
    })
  })

  describe("writes to same index", () => {
    it("should handle multiple sequential adds to same index", async () => {
      await writer.initializeIndex("ses_test12345abcdefg0")
      mockAtomicWriteJson.mockClear()

      await writer.addChild("ses_test12345abcdefg0", "child_a", "child_a.json", 1, "AgentA")
      await writer.addChild("ses_test12345abcdefg0", "child_b", "child_b.json", 1, "AgentB")
      await writer.addChild("ses_test12345abcdefg0", "child_c", "child_c.json", 2, "AgentC")

      // All writes should complete
      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(3)
    })
  })

  // ---------------------------------------------------------------------------
  // F-07: Concurrency tests — serial write queue
  // ---------------------------------------------------------------------------

  describe("concurrent writes — serial write queue (F-07)", () => {
    let concurrencyTmpDir: string
    let concurrencyWriter: SessionIndexWriter

    beforeEach(async () => {
      concurrencyTmpDir = resolve(tmpdir(), `hivemind-conc-${randomUUID()}`)
      await mkdir(concurrencyTmpDir, { recursive: true })
      concurrencyWriter = new SessionIndexWriter({ projectRoot: concurrencyTmpDir })
    })

    afterEach(async () => {
      await rm(concurrencyTmpDir, { recursive: true, force: true }).catch(() => {})
    })

    /**
     * Helper to read the session-continuity.json on disk.
     */
    async function readIndexOnDisk(sessionID: string): Promise<Record<string, unknown>> {
      const filePath = safeSessionPath(concurrencyTmpDir, sessionID, "session-continuity.json")
      const raw = await readFile(filePath, "utf-8")
      return JSON.parse(raw) as Record<string, unknown>
    }

    it("should not lose children under 10 concurrent addChild calls", async () => {
      const sessionID = "ses_conc_test12345678"
      await concurrencyWriter.initializeIndex(sessionID)

      // Fire 10 concurrent addChild calls
      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          concurrencyWriter.addChild(
            sessionID,
            `child_${i}`,
            `child_${i}.json`,
            1,
            `Agent${i}`,
          ),
        ),
      )

      // Read the final index from disk
      const index = await readIndexOnDisk(sessionID)
      const children = (index as any).hierarchy?.children ?? {}

      // All 10 children must be present — no lost writes
      expect(Object.keys(children)).toHaveLength(10)
      for (let i = 0; i < 10; i++) {
        expect(children[`child_${i}`]).toBeDefined()
        expect(children[`child_${i}`].file).toBe(`child_${i}.json`)
      }
    })

    it("should produce correct turnCount after 10 concurrent incrementTurnCount calls", async () => {
      const sessionID = "ses_conc_turns1234567"
      await concurrencyWriter.initializeIndex(sessionID)

      // Fire 10 concurrent incrementTurnCount calls
      await Promise.all(
        Array.from({ length: 10 }, () =>
          concurrencyWriter.incrementTurnCount(sessionID),
        ),
      )

      // Read the final index from disk
      const index = await readIndexOnDisk(sessionID)
      // Without a serial queue, turnCount will be < 10 due to interleaved reads
      expect(index.turnCount).toBe(10)
    })

    it("should not lose tool summary updates under 10 concurrent calls", async () => {
      const sessionID = "ses_conc_tools1234567"
      await concurrencyWriter.initializeIndex(sessionID)

      // Fire 10 concurrent updateToolSummary calls for the same tool
      await Promise.all(
        Array.from({ length: 10 }, () =>
          concurrencyWriter.updateToolSummary(sessionID, "read"),
        ),
      )

      const index = await readIndexOnDisk(sessionID)
      // Without a queue, the count will be less than 10
      expect((index as any).toolSummary?.read).toBe(10)
    })

    it("should auto-reset a stale write queue after 5 minutes of inactivity", async () => {
      const sessionID = "ses_stale_test1234567"
      await concurrencyWriter.initializeIndex(sessionID)

      // Do one write to establish lastWriteTime
      await concurrencyWriter.addChild(sessionID, "child_1", "child_1.json", 1, "AgentA")

      // Advance time past the stale threshold (5 minutes)
      vi.useFakeTimers()
      vi.advanceTimersByTime(6 * 60 * 1000) // 6 minutes

      // This write should succeed despite the stale timer (queue auto-resets)
      await concurrencyWriter.addChild(sessionID, "child_2", "child_2.json", 1, "AgentB")

      vi.useRealTimers()

      // Both children should exist on disk
      const index = await readIndexOnDisk(sessionID)
      const children = (index as any).hierarchy?.children ?? {}
      expect(children["child_1"]).toBeDefined()
      expect(children["child_2"]).toBeDefined()
    })
  })
})
