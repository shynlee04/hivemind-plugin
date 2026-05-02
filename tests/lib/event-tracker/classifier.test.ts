import { describe, it, expect } from "vitest"
import type { ClassifiedEvent, ClassifiedEventType } from "../../../src/lib/event-tracker/types.js"

describe("classifyEvent", () => {
  it("classifies user_message events from raw input with role=user", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ role: "user", content: "hello" })
    expect(result.type).toBe("user_message")
  })

  it("classifies assistant_output events from raw input with role=assistant", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ role: "assistant", content: "response" })
    expect(result.type).toBe("assistant_output")
  })

  it("classifies tool_invocation events from raw input with toolName", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ toolName: "delegate-task", status: "completed" })
    expect(result.type).toBe("tool_invocation")
  })

  it("classifies delegation_created events from raw input with delegationId and status=created", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ delegationId: "del_123", status: "created" })
    expect(result.type).toBe("delegation_created")
  })

  it("classifies delegation_returned events from raw input with delegationId and status=returned", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ delegationId: "del_123", status: "returned" })
    expect(result.type).toBe("delegation_returned")
  })

  it("classifies compaction events from raw input with type=compaction", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "compaction" })
    expect(result.type).toBe("compaction")
  })

  it("classifies session_start events from raw input with type=session_start", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "session_start", sessionId: "ses_test" })
    expect(result.type).toBe("session_start")
  })

  it("classifies session_end events from raw input with type=session_end", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "session_end", sessionId: "ses_test" })
    expect(result.type).toBe("session_end")
  })

  it("classifies injection events from raw input with type=injection", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "injection" })
    expect(result.type).toBe("injection")
  })

  it("classifies error events from raw input with type=error or error field", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "error", message: "something failed" })
    expect(result.type).toBe("error")
  })

  it("classifies error events from raw input with error field present", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ error: new Error("boom") })
    expect(result.type).toBe("error")
  })

  it("classifies unknown events when no pattern matches", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ random: "data" })
    expect(result.type).toBe("unknown")
  })

  it("preserves original data in the classified event", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const raw = { role: "user", content: "hello", sessionId: "ses_abc1" }
    const result = classifyEvent(raw)
    expect(result.type).toBe("user_message")
    expect(result.original).toBe(raw)
    expect(result.classifiedAt).toBeTypeOf("number")
  })

  it("handles null input safely", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent(null)
    expect(result.type).toBe("unknown")
  })

  it("handles undefined input safely", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent(undefined)
    expect(result.type).toBe("unknown")
  })

  it("handles string input safely", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent("just a string")
    expect(result.type).toBe("unknown")
  })

  it("classifies delegation_created for hook type session.created with delegationId", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "session.created", delegationId: "del_abc" })
    expect(result.type).toBe("delegation_created")
  })

  it("classifies delegation_returned for hook type tool.executed with delegationId and completed", async () => {
    const { classifyEvent } = await import("../../../src/lib/event-tracker/classifier.js")
    const result = classifyEvent({ type: "tool.executed", delegationId: "del_abc", status: "completed" })
    expect(result.type).toBe("delegation_returned")
  })
})
