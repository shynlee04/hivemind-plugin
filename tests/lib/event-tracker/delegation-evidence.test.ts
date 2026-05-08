import { describe, it, expect, beforeEach } from "vitest"
import type { DelegationEvidenceRecord } from "../../../src/task-management/journal/event-tracker/types.js"

describe("trackDelegationEvidence", () => {
  let tracker: Awaited<ReturnType<typeof import("../../../src/task-management/journal/event-tracker/delegation-evidence.js")>["createDelegationEvidenceTracker"]>

  beforeEach(async () => {
    const mod = await import("../../../src/task-management/journal/event-tracker/delegation-evidence.js")
    tracker = mod.createDelegationEvidenceTracker()
  })

  it("tracks a partial delegation state", () => {
    const record = tracker.track("del_001", "partial", { toolCallsCompleted: 3, toolCallsTotal: 10 })
    expect(record.delegationId).toBe("del_001")
    expect(record.state).toBe("partial")
    expect(record.evidence).toEqual({ toolCallsCompleted: 3, toolCallsTotal: 10 })
    expect(record.timestamp).toBeTypeOf("number")
  })

  it("tracks a blocked delegation state", () => {
    const record = tracker.track("del_002", "blocked", { reason: "auth_required" })
    expect(record.delegationId).toBe("del_002")
    expect(record.state).toBe("blocked")
    expect(record.evidence).toEqual({ reason: "auth_required" })
  })

  it("tracks a complete delegation state", () => {
    const record = tracker.track("del_003", "complete", { result: "success", durationMs: 5000 })
    expect(record.delegationId).toBe("del_003")
    expect(record.state).toBe("complete")
    expect(record.evidence).toEqual({ result: "success", durationMs: 5000 })
  })

  it("accumulates multiple records for the same delegation", () => {
    tracker.track("del_004", "partial", { step: 1 })
    tracker.track("del_004", "partial", { step: 2 })
    tracker.track("del_004", "complete", { step: 3 })
    const records = tracker.query("del_004")
    expect(records).toHaveLength(3)
    expect(records[0].state).toBe("partial")
    expect(records[1].state).toBe("partial")
    expect(records[2].state).toBe("complete")
  })

  it("returns empty array for unknown delegation ID", () => {
    const records = tracker.query("del_nonexistent")
    expect(records).toEqual([])
  })

  it("preserves chronological order of records", () => {
    tracker.track("del_005", "partial", { phase: "planning" })
    tracker.track("del_005", "complete", { phase: "done" })
    const records = tracker.query("del_005")
    expect(records[0].evidence).toEqual({ phase: "planning" })
    expect(records[1].evidence).toEqual({ phase: "done" })
  })

  it("provides the latest state for a delegation", () => {
    tracker.track("del_006", "partial", { step: 1 })
    tracker.track("del_006", "blocked", { reason: "timeout" })
    tracker.track("del_006", "complete", { result: "ok" })
    const latest = tracker.latestState("del_006")
    expect(latest).not.toBeNull()
    expect(latest!.state).toBe("complete")
  })

  it("returns null for latest state of unknown delegation", () => {
    const latest = tracker.latestState("del_nonexistent")
    expect(latest).toBeNull()
  })

  it("generates deterministic record IDs", () => {
    const r1 = tracker.track("del_007", "partial", { a: 1 })
    const r2 = tracker.track("del_007", "complete", { a: 2 })
    expect(r1.id).not.toBe(r2.id)
    expect(r1.id).toContain("del_007")
    expect(r2.id).toContain("del_007")
  })

  it("rejects invalid state values", () => {
    expect(() => tracker.track("del_008", "invalid" as never, {})).toThrow()
  })
})
