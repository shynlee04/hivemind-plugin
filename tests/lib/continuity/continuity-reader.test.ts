/**
 * Tests for continuity-reader.ts — session-tracker enrichment helpers.
 *
 * REQ-P41C-01 through REQ-P41C-07: Verifies enrichContinuityWithTracker and
 * enrichContinuityListWithTracker merge behavior, error handling, and
 * non-mutation guarantees.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { SessionContinuityRecord } from "../../../src/shared/types.js"

// Mock resolveSessionFile before importing the module under test
vi.mock("../../../src/tools/session/session-resolver.js", () => ({
  resolveSessionFile: vi.fn(),
}))

// Dynamic import so mocks are active
const mod = await import("../../../src/task-management/continuity/continuity-reader.js")
const { enrichContinuityWithTracker, enrichContinuityListWithTracker } = mod
const resolveSessionFile = (await import("../../../src/tools/session/session-resolver.js")).resolveSessionFile as ReturnType<typeof vi.fn>

/** Create a minimal SessionContinuityRecord for testing. */
function makeRecord(overrides?: Partial<SessionContinuityRecord>): SessionContinuityRecord {
  return {
    sessionID: "ses_test123",
    promptParams: {},
    metadata: {
      status: "running",
      description: "test",
      delegation: null,
      constraints: [],
      pendingNotifications: [],
      updatedAt: Date.now(),
      ...overrides?.metadata,
    },
    ...overrides,
  } as SessionContinuityRecord
}

describe("enrichContinuityWithTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns original when projectRoot is undefined", async () => {
    const record = makeRecord()
    const result = await enrichContinuityWithTracker(record, undefined)
    expect(result).toBe(record)
    expect(resolveSessionFile).not.toHaveBeenCalled()
  })

  it("returns original when resolveSessionFile returns null", async () => {
    resolveSessionFile.mockResolvedValue(null)
    const record = makeRecord()
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).toBe(record)
    expect(resolveSessionFile).toHaveBeenCalledWith("/fake/root", "ses_test123")
  })

  it("returns original when resolved is not a child record", async () => {
    resolveSessionFile.mockResolvedValue({ type: "main" })
    const record = makeRecord()
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).toBe(record)
  })

  it("returns original when childRecord has none of the 3 enrichment fields", async () => {
    resolveSessionFile.mockResolvedValue({
      type: "child",
      childRecord: {
        sessionID: "ses_test123",
        lifecycle: undefined,
        pendingNotifications: undefined,
        compactionCheckpoint: undefined,
      },
    })
    const record = makeRecord()
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).toBe(record)
  })

  it("merges childRecord lifecycle over record.metadata.lifecycle", async () => {
    const childLifecycle = { phase: "completed" as const, launchedAt: 1000, completedAt: 2000 }
    resolveSessionFile.mockResolvedValue({
      type: "child",
      childRecord: {
        sessionID: "ses_test123",
        lifecycle: childLifecycle,
        pendingNotifications: undefined,
        compactionCheckpoint: undefined,
      },
    })
    const record = makeRecord({
      metadata: {
        status: "running",
        description: "test",
        delegation: null,
        constraints: [],
        pendingNotifications: [],
        updatedAt: 500,
        lifecycle: { phase: "running" as const },
      },
    })
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).not.toBe(record) // new object
    expect(result.metadata.lifecycle).toEqual(childLifecycle)
    expect(record.metadata.lifecycle).toEqual({ phase: "running" }) // original unchanged
  })

  it("merges childRecord pendingNotifications over record.metadata.pendingNotifications", async () => {
    const childNotifs = [{ createdAt: 100, delivered: false, retryCount: 0, maxRetries: 3, sessionID: "ses_x", agent: "", description: "", status: "completed" as const }]
    resolveSessionFile.mockResolvedValue({
      type: "child",
      childRecord: {
        sessionID: "ses_test123",
        lifecycle: undefined,
        pendingNotifications: childNotifs,
        compactionCheckpoint: undefined,
      },
    })
    const record = makeRecord({
      metadata: {
        status: "running",
        description: "test",
        delegation: null,
        constraints: [],
        pendingNotifications: [{ createdAt: 200, delivered: false, retryCount: 0, maxRetries: 3, sessionID: "ses_y", agent: "", description: "", status: "completed" as const }],
        updatedAt: 500,
      },
    })
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).not.toBe(record)
    expect(result.metadata.pendingNotifications).toEqual(childNotifs)
    expect(record.metadata.pendingNotifications).not.toEqual(childNotifs) // original unchanged
  })

  it("merges childRecord compactionCheckpoint over record.metadata.compactionCheckpoint", async () => {
    const childCp = { agent: null, model: null, tools: [], delegationMeta: null, warnings: [], sessionStats: { total: 10, byTool: {}, loop: { signature: "", count: 0 } }, capturedAt: 999 }
    resolveSessionFile.mockResolvedValue({
      type: "child",
      childRecord: {
        sessionID: "ses_test123",
        lifecycle: undefined,
        pendingNotifications: undefined,
        compactionCheckpoint: childCp,
      },
    })
    const record = makeRecord({
      metadata: {
        status: "running",
        description: "test",
        delegation: null,
        constraints: [],
        pendingNotifications: [],
        updatedAt: 500,
      },
    })
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).not.toBe(record)
    expect(result.metadata.compactionCheckpoint).toEqual(childCp)
  })

  it("never throws — returns original on any error", async () => {
    resolveSessionFile.mockRejectedValue(new Error("disk error"))
    const record = makeRecord()
    const result = await enrichContinuityWithTracker(record, "/fake/root")
    expect(result).toBe(record)
  })

  it("does NOT mutate the original record object", async () => {
    const childLifecycle = { phase: "completed" as const, launchedAt: 1000 }
    resolveSessionFile.mockResolvedValue({
      type: "child",
      childRecord: {
        sessionID: "ses_test123",
        lifecycle: childLifecycle,
        pendingNotifications: undefined,
        compactionCheckpoint: undefined,
      },
    })
    const record = makeRecord({
      metadata: {
        status: "running",
        description: "test",
        delegation: null,
        constraints: [],
        pendingNotifications: [],
        updatedAt: 500,
        lifecycle: { phase: "running" as const },
      },
    })
    const snapshot = JSON.parse(JSON.stringify(record))
    await enrichContinuityWithTracker(record, "/fake/root")
    expect(JSON.parse(JSON.stringify(record))).toEqual(snapshot)
  })
})

describe("enrichContinuityListWithTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns original list when projectRoot is undefined", async () => {
    const records = [makeRecord(), makeRecord({ sessionID: "ses_abc" })]
    const result = await enrichContinuityListWithTracker(records, undefined)
    expect(result).toBe(records)
  })

  it("returns empty list when given empty list", async () => {
    const result = await enrichContinuityListWithTracker([], "/fake/root")
    expect(result).toEqual([])
  })

  it("runs all enrichments via Promise.all (parallel)", async () => {
    resolveSessionFile.mockResolvedValue(null) // returns original for all
    const records = [makeRecord({ sessionID: "ses_a" }), makeRecord({ sessionID: "ses_b" })]
    const result = await enrichContinuityListWithTracker(records, "/fake/root")
    expect(resolveSessionFile).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(records[0])
    expect(result[1]).toBe(records[1])
  })
})
