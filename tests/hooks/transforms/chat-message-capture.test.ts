import { describe, it, expect, vi, beforeEach } from "vitest"
import { createChatMessageCapture } from "../../../src/hooks/transforms/chat-message-capture.js"

describe("createChatMessageCapture", () => {
  const mockHandleChatMessage = vi.fn<[input: unknown, output: unknown], Promise<void>>()
  const mockSessionTracker = {
    handleChatMessage: mockHandleChatMessage,
  }
  const mockLogWarn = vi.fn<(message: string, error: unknown) => void>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const capture = createChatMessageCapture({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    expect(typeof capture).toBe("function")
  })

  it("delegates to sessionTracker.handleChatMessage with input and output", async () => {
    mockHandleChatMessage.mockResolvedValue(undefined)
    const capture = createChatMessageCapture({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })

    const input = { role: "user", content: "hello" }
    const output = { role: "assistant", content: "hi there" }

    await capture(input, output)
    expect(mockHandleChatMessage).toHaveBeenCalledWith(input, output)
  })

  it("catches errors — calls logWarn, does not throw", async () => {
    mockHandleChatMessage.mockRejectedValue(new Error("boom"))
    const capture = createChatMessageCapture({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })

    await expect(capture({}, {})).resolves.toBeUndefined()
    expect(mockLogWarn).toHaveBeenCalled()
  })
})
