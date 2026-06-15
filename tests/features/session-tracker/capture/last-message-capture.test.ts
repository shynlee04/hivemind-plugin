import { describe, it, expect, vi } from "vitest"
import { LastMessageCapture } from "../../../../src/features/session-tracker/capture/last-message-capture.js"

describe("LastMessageCapture with thinking blocks", () => {
  it("should capture and format thinking block alongside text parts", () => {
    const onLastMessageUpdate = vi.fn()
    const lmc = new LastMessageCapture({ onLastMessageUpdate })

    // Simulate message.updated to register the assistant message
    lmc.handleEvent({
      type: "message.updated",
      properties: {
        info: {
          role: "assistant",
          id: "msg_123",
          sessionID: "ses_123",
        },
      },
    })

    // Simulate message.part.updated for thinking block
    lmc.handleEvent({
      type: "message.part.updated",
      properties: {
        part: {
          type: "thinking",
          messageID: "msg_123",
          text: "I am thinking about the code.",
        },
      },
    })

    // Verify onLastMessageUpdate was called with formatted thinking block
    expect(onLastMessageUpdate).toHaveBeenCalledWith(
      "ses_123",
      "<thinking>\nI am thinking about the code.\n</thinking>"
    )

    // Simulate message.part.updated for text block
    lmc.handleEvent({
      type: "message.part.updated",
      properties: {
        part: {
          type: "text",
          messageID: "msg_123",
          text: "Here is the solution.",
        },
      },
    })

    // Verify onLastMessageUpdate was called with combined text
    expect(onLastMessageUpdate).toHaveBeenLastCalledWith(
      "ses_123",
      "<thinking>\nI am thinking about the code.\n</thinking>\nHere is the solution."
    )

    // Verify getLastMessage returns the combined text
    expect(lmc.getLastMessage("ses_123")).toBe(
      "<thinking>\nI am thinking about the code.\n</thinking>\nHere is the solution."
    )
  })

  it("should handle empty text or thinking gracefully", () => {
    const lmc = new LastMessageCapture()

    lmc.handleEvent({
      type: "message.updated",
      properties: {
        info: {
          role: "assistant",
          id: "msg_456",
          sessionID: "ses_456",
        },
      },
    })

    lmc.handleEvent({
      type: "message.part.updated",
      properties: {
        part: {
          type: "text",
          messageID: "msg_456",
          text: "  ",
        },
      },
    })

    expect(lmc.getLastMessage("ses_456")).toBeUndefined()

    lmc.handleEvent({
      type: "message.part.updated",
      properties: {
        part: {
          type: "text",
          messageID: "msg_456",
          text: "Just text",
        },
      },
    })

    expect(lmc.getLastMessage("ses_456")).toBe("Just text")
  })
})
