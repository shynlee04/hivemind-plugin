import { describe, it, expect, vi } from "vitest"
import { createToolAfterWorkflow } from "../../src/hooks/transforms/tool-after-workflow.js"
import { createChatMessageCapture } from "../../src/hooks/transforms/chat-message-capture.js"
import type { ToolAfterWorkflowDeps } from "../../src/hooks/transforms/tool-after-workflow.js"
import type { ChatMessageCaptureDeps } from "../../src/hooks/transforms/chat-message-capture.js"

describe("tools — tool-after-workflow & chat-message-capture", () => {
  it("tool-after-workflow — RED phase placeholder", () => {
    const deps: ToolAfterWorkflowDeps = {}
    const handler = createToolAfterWorkflow(deps)
    expect(handler).toBeDefined()
    // Deliberately failing assertion
    expect(0).toBe(1)
  })

  it("chat-message-capture — RED phase placeholder", () => {
    const deps: ChatMessageCaptureDeps = {
      sessionTracker: { handleChatMessage: vi.fn() },
    }
    const handler = createChatMessageCapture(deps)
    expect(handler).toBeDefined()
    // Deliberately failing assertion
    expect("exists").toBe("nonexistent")
  })
})
