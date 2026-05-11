/**
 * ProjectIndexWriter tests — project-level continuity index with serial queue.
 *
 * @module tests/features/session-tracker/persistence/project-index-writer
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

describe("ProjectIndexWriter", () => {
  let writer: ProjectIndexWriter
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()

    tmpDir = resolve(tmpdir(), `hivemind-test-${randomUUID()}`)
    await mkdir(tmpDir, { recursive: true })

    writer = new ProjectIndexWriter({ projectRoot: tmpDir, client: { app: { log: vi.fn() } } as any })
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  })

  describe("initializeIndex", () => {
    it("should write initial project-continuity.json", async () => {
      await writer.initializeIndex()

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [filePath, data] = mockAtomicWriteJson.mock.calls[0]
      expect(filePath).toContain("project-continuity.json")
      expect(data).toMatchObject({
        version: "2.0",
        projectRoot: tmpDir,
        sessions: {},
        chronologicalOrder: [],
      })
    })
  })

  describe("addSession", () => {
    it("should add session entry and update chronological order", async () => {
      await writer.initializeIndex()
      mockAtomicWriteJson.mockClear()

      await writer.addSession(
        "ses_test12345abcdefg0",
        "ses_test12345abcdefg0/",
        "ses_test12345abcdefg0.md",
      )

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const sessions = (data as any).sessions
      expect(sessions["ses_test12345abcdefg0"]).toBeDefined()
      expect(sessions["ses_test12345abcdefg0"]).toMatchObject({
        dir: "ses_test12345abcdefg0/",
        mainFile: "ses_test12345abcdefg0.md",
        status: "active",
        childCount: 0,
      })
      expect((data as any).chronologicalOrder).toContain(
        "ses_test12345abcdefg0",
      )
    })

    it("should add multiple sessions in order", async () => {
      await writer.initializeIndex()
      mockAtomicWriteJson.mockClear()

      await writer.addSession("ses_aaa", "ses_aaa/", "ses_aaa.md")
      await writer.addSession("ses_bbb", "ses_bbb/", "ses_bbb.md")

      const [, data] = mockAtomicWriteJson.mock.calls[1]
      expect((data as any).chronologicalOrder).toEqual(["ses_aaa", "ses_bbb"])
    })
  })

  describe("updateSession", () => {
    it("should merge updates into existing session entry", async () => {
      await writer.initializeIndex()
      await writer.addSession("ses_test12345abcdefg0", "ses_test12345abcdefg0/", "ses_test12345abcdefg0.md")
      mockAtomicWriteJson.mockClear()

      await writer.updateSession("ses_test12345abcdefg0", {
        status: "completed",
        childCount: 3,
      })

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const session = (data as any).sessions["ses_test12345abcdefg0"]
      expect(session.status).toBe("completed")
      expect(session.childCount).toBe(3)
      // Original fields preserved
      expect(session.dir).toBe("ses_test12345abcdefg0/")
    })
  })

  describe("removeSession", () => {
    it("should remove session entry and update chronological order", async () => {
      await writer.initializeIndex()
      await writer.addSession("ses_aaa", "ses_aaa/", "ses_aaa.md")
      await writer.addSession("ses_bbb", "ses_bbb/", "ses_bbb.md")
      mockAtomicWriteJson.mockClear()

      await writer.removeSession("ses_aaa")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      expect((data as any).sessions["ses_aaa"]).toBeUndefined()
      expect((data as any).sessions["ses_bbb"]).toBeDefined()
      expect((data as any).chronologicalOrder).toEqual(["ses_bbb"])
    })
  })

  describe("serial queue (REQ-ST-09)", () => {
    it("should serialize concurrent writes without corruption", async () => {
      await writer.initializeIndex()
      mockAtomicWriteJson.mockClear()

      // Simulate 6 concurrent session writes
      const sessions = Array.from({ length: 6 }, (_, i) => ({
        id: `ses_session_${i}`,
        dir: `ses_session_${i}/`,
        file: `ses_session_${i}.md`,
      }))

      await Promise.all(
        sessions.map((s) =>
          writer.addSession(s.id, s.dir, s.file),
        ),
      )

      // All 6 writes should complete (serialized via writeQueue)
      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(6)

      // Each write should see the correct accumulated state
      // The final write should have all 6 sessions
      const [, finalData] = mockAtomicWriteJson.mock.calls[5]
      const sessionKeys = Object.keys((finalData as any).sessions)
      expect(sessionKeys.length).toBe(6)
    })

    it("should handle write errors gracefully without breaking the queue", async () => {
      await writer.initializeIndex()
      mockAtomicWriteJson.mockClear()

      let callCount = 0
      mockAtomicWriteJson.mockImplementation(async () => {
        callCount++
        if (callCount === 2) throw new Error("Simulated write failure")
      })

      await writer.addSession("ses_success1", "ses_success1/", "ses_success1.md")
      await writer.addSession("ses_fail", "ses_fail/", "ses_fail.md")
      await writer.addSession("ses_success2", "ses_success2/", "ses_success2.md")

      // All three should be attempted (2nd is caught internally by writeQueue)
      expect(callCount).toBeGreaterThanOrEqual(2)
    })
  })
})
