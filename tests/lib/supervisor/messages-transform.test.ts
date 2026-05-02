import { describe, it, expect } from "vitest"
import {
  transformMessagesForSupervisor,
  type SupervisorMessageView,
} from "../../../src/lib/supervisor/messages-transform.js"

describe("supervisor messages-transform", () => {
  it("transforms assistant messages to supervisor view", () => {
    const messages = [
      { role: "user", parts: [{ type: "text", text: "hello" }] },
      { role: "assistant", parts: [{ type: "text", text: "hi there" }] },
    ]
    const views = transformMessagesForSupervisor(messages)
    expect(views).toHaveLength(2)
    expect(views[0].role).toBe("user")
    expect(views[1].role).toBe("assistant")
    expect(views[1].text_preview).toBe("hi there")
  })

  it("truncates long text previews", () => {
    const longText = "a".repeat(200)
    const messages = [
      { role: "assistant", parts: [{ type: "text", text: longText }] },
    ]
    const views = transformMessagesForSupervisor(messages)
    expect(views[0].text_preview.length).toBeLessThanOrEqual(120)
    expect(views[0].truncated).toBe(true)
  })

  it("marks tool call messages", () => {
    const messages = [
      { role: "assistant", parts: [{ type: "tool_call", name: "read_file" }] },
    ]
    const views = transformMessagesForSupervisor(messages)
    expect(views[0].has_tool_call).toBe(true)
    expect(views[0].tool_name).toBe("read_file")
  })
})
