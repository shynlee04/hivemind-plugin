/**
 * ProjectIndexWriter tests — project-level continuity index with serial queue.
 *
 * @module tests/features/session-tracker/persistence/project-index-writer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm } from "node:fs/promises"
import { resolve, join } from "node:path"
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
      })

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const session = (data as any).sessions["ses_test12345abcdefg0"]
      expect(session.status).toBe("completed")
      // childCount is computed from hierarchyIndex (0 when not wired) — F-19
      expect(session.childCount).toBe(0)
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

  describe("incrementChildCount", () => {
    it("should increment childCount from 0 to 1 on first call", async () => {
      await writer.initializeIndex()
      await writer.addSession("ses_test12345abcdefg0", "ses_test12345abcdefg0/", "ses_test12345abcdefg0.md")
      mockAtomicWriteJson.mockClear()

      await writer.incrementChildCount("ses_test12345abcdefg0")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      const session = (data as any).sessions["ses_test12345abcdefg0"]
      expect(session.childCount).toBe(1)
    })

    it("should increment childCount from 1 to 2 on second call", async () => {
      await writer.initializeIndex()
      await writer.addSession("ses_test12345abcdefg0", "ses_test12345abcdefg0/", "ses_test12345abcdefg0.md")
      mockAtomicWriteJson.mockClear()

      await writer.incrementChildCount("ses_test12345abcdefg0")
      expect((mockAtomicWriteJson.mock.calls[0][1] as any).sessions["ses_test12345abcdefg0"].childCount).toBe(1)

      await writer.incrementChildCount("ses_test12345abcdefg0")
      expect((mockAtomicWriteJson.mock.calls[1][1] as any).sessions["ses_test12345abcdefg0"].childCount).toBe(2)
    })

    it("should serialize via writeQueue (REQ-ST-09)", async () => {
      await writer.initializeIndex()
      await writer.addSession("ses_test12345abcdefg0", "ses_test12345abcdefg0/", "ses_test12345abcdefg0.md")
      mockAtomicWriteJson.mockClear()

      // Fire 5 concurrent child count increments
      await Promise.all(
        Array.from({ length: 5 }, () =>
          writer.incrementChildCount("ses_test12345abcdefg0"),
        ),
      )

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(5)
      const [, finalData] = mockAtomicWriteJson.mock.calls[4]
      expect((finalData as any).sessions["ses_test12345abcdefg0"].childCount).toBe(5)
    })

    it("should be a no-op for non-existent session", async () => {
      await writer.initializeIndex()
      mockAtomicWriteJson.mockClear()

      await writer.incrementChildCount("ses_nonexistent")

      expect(mockAtomicWriteJson).toHaveBeenCalledTimes(1)
      const [, data] = mockAtomicWriteJson.mock.calls[0]
      expect((data as any).sessions["ses_nonexistent"]).toBeUndefined()
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

// ---------------------------------------------------------------------------
// HierarchyIndex childCount/depth computation (F-19)
// ---------------------------------------------------------------------------

describe("HierarchyIndex childCount/depth", () => {
  let hiDir: string

  beforeEach(() => {
    const { mkdtempSync } = require("node:fs") as typeof import("node:fs")
    hiDir = mkdtempSync(join(tmpdir(), "st-piw-"))
    const { mkdirSync } = require("node:fs") as typeof import("node:fs")
    mkdirSync(join(hiDir, ".hivemind", "session-tracker"), { recursive: true })
  })

  afterEach(() => {
    const { rmSync } = require("node:fs") as typeof import("node:fs")
    rmSync(hiDir, { recursive: true, force: true })
  })

  it("computeChildCount returns correct count from hierarchyIndex", async () => {
    const { HierarchyIndex } = await vi.importActual<
      typeof import("../../../../src/features/session-tracker/persistence/hierarchy-index.js")
    >("../../../../src/features/session-tracker/persistence/hierarchy-index.js")
    const hIndex = new HierarchyIndex({ projectRoot: hiDir })
    // Register 3 children
    hIndex.registerChild("root-session", "child-1")
    hIndex.registerChild("root-session", "child-2")
    hIndex.registerChild("root-session", "child-3")

    expect(hIndex.getChildCountForSession("root-session")).toBe(3)
    expect(hIndex.getChildCountForSession("child-1")).toBe(0)
  })

  it("getMaxDepthForSession returns max chain depth", async () => {
    const { HierarchyIndex } = await vi.importActual<
      typeof import("../../../../src/features/session-tracker/persistence/hierarchy-index.js")
    >("../../../../src/features/session-tracker/persistence/hierarchy-index.js")
    const hIndex = new HierarchyIndex({ projectRoot: hiDir })
    hIndex.registerChild("root-session", "child-1")
    hIndex.registerChild("child-1", "child-2")

    expect(hIndex.getMaxDepthForSession("root-session")).toBe(2)
    expect(hIndex.getMaxDepthForSession("child-1")).toBe(1)
    expect(hIndex.getMaxDepthForSession("child-2")).toBe(0)
  })
})
