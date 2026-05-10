/**
 * SessionIndexWriter tests — session-local continuity index management.
 *
 * @module tests/features/session-tracker/persistence/session-index-writer
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mkdir, rm } from "node:fs/promises"
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
})
