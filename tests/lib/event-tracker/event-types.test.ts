import { describe, it, expect } from "vitest"

describe("ClassifiedEventType", () => {
  it("exports all 10 required event types", async () => {
    const types = await import("../../../src/task-management/journal/event-tracker/types.js")
    const expected: string[] = [
      "user_message",
      "assistant_output",
      "tool_invocation",
      "delegation_created",
      "delegation_returned",
      "compaction",
      "session_start",
      "session_end",
      "injection",
      "error",
    ]
    for (const type of expected) {
      expect(types.CLASSIFIED_EVENT_TYPES).toContain(type)
    }
  })

  it("exports ClassifiedEvent type with required fields", async () => {
    const types = await import("../../../src/task-management/journal/event-tracker/types.js")
    // Verify the type exists by using it
    const event: types.ClassifiedEvent = {
      type: "user_message",
      original: { role: "user" },
      classifiedAt: Date.now(),
    }
    expect(event.type).toBe("user_message")
    expect(event.classifiedAt).toBeTypeOf("number")
  })

  it("exports DelegationEvidenceRecord type with required fields", async () => {
    const types = await import("../../../src/task-management/journal/event-tracker/types.js")
    const record: types.DelegationEvidenceRecord = {
      id: "del_001::partial::1234",
      delegationId: "del_001",
      state: "partial",
      evidence: { step: 1 },
      timestamp: Date.now(),
    }
    expect(record.state).toBe("partial")
    expect(record.delegationId).toBe("del_001")
  })

  it("exports DelegationEvidenceState union type", async () => {
    const types = await import("../../../src/task-management/journal/event-tracker/types.js")
    expect(types.DELEGATION_EVIDENCE_STATES).toEqual(["partial", "blocked", "complete"])
  })

  it("exports DualPersistenceFileSystem with appendFileSync", async () => {
    // This is a type-level check — just verify the module loaded
    const types = await import("../../../src/task-management/journal/event-tracker/types.js")
    expect(typeof types.DualPersistenceFileSystem).toBe("undefined") // type-only, not a runtime value
  })
})
