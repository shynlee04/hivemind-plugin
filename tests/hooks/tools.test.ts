import { describe, it, expect, vi } from "vitest"
import { createToolAfterWorkflow } from "../../src/hooks/transforms/tool-after-workflow.js"
import { createChatMessageCapture } from "../../src/hooks/transforms/chat-message-capture.js"
import type { ToolAfterWorkflowDeps, ToolAfterWorkflowInput } from "../../src/hooks/transforms/tool-after-workflow.js"
import type { ChatMessageCaptureDeps } from "../../src/hooks/transforms/chat-message-capture.js"

describe("tools — tool-after-workflow", () => {
  function createDeps(overrides?: Partial<ToolAfterWorkflowDeps>): ToolAfterWorkflowDeps {
    return { ...overrides }
  }

  it("creates a handler function", () => {
    const handler = createToolAfterWorkflow(createDeps())
    expect(handler).toBeInstanceOf(Function)
  })

  it("returns early when tool is not configure-primitive", async () => {
    const handler = createToolAfterWorkflow(createDeps())
    // Should not throw — early return for non-matching tools
    await expect(
      handler({ tool: "read", sessionID: "ses_001", callID: "call_001" }),
    ).resolves.toBeUndefined()
  })

  it("returns early when args has no workflowId", async () => {
    const handler = createToolAfterWorkflow(createDeps())
    await expect(
      handler({ tool: "configure-primitive", args: {} } as ToolAfterWorkflowInput),
    ).resolves.toBeUndefined()
  })

  it("returns early when args has no workflowTurn", async () => {
    const handler = createToolAfterWorkflow(createDeps())
    await expect(
      handler({
        tool: "configure-primitive",
        args: { workflowId: "wf_001" },
      } as ToolAfterWorkflowInput),
    ).resolves.toBeUndefined()
  })

  it("handles missing logWarn gracefully", () => {
    const handler = createToolAfterWorkflow({})
    expect(handler).toBeDefined()
  })
})

describe("tools — chat-message-capture", () => {
  function createDeps(overrides?: Partial<ChatMessageCaptureDeps>): ChatMessageCaptureDeps {
    return {
      sessionTracker: { handleChatMessage: vi.fn() },
      ...overrides,
    }
  }

  it("creates a handler function", () => {
    const deps = createDeps()
    const handler = createChatMessageCapture(deps)
    expect(handler).toBeInstanceOf(Function)
  })

  it("calls handleChatMessage with input and output", async () => {
    const handleChatMessage = vi.fn()
    const deps = createDeps({ sessionTracker: { handleChatMessage } })
    const handler = createChatMessageCapture(deps)

    const input = { role: "user", content: "hello" }
    const output = { role: "assistant", content: "hi" }
    await handler(input, output)

    expect(handleChatMessage).toHaveBeenCalledWith(input, output)
  })

  it("does not throw when handleChatMessage throws", async () => {
    const handleChatMessage = vi.fn().mockRejectedValue(new Error("chat error"))
    const logWarn = vi.fn()
    const deps = createDeps({ sessionTracker: { handleChatMessage }, logWarn })
    const handler = createChatMessageCapture(deps)

    await expect(handler({ role: "user", content: "hello" }, { role: "assistant", content: "hi" })).resolves.toBeUndefined()
    expect(logWarn).toHaveBeenCalled()
  })

  it("handles undefined output gracefully", async () => {
    const handleChatMessage = vi.fn()
    const deps = createDeps({ sessionTracker: { handleChatMessage } })
    const handler = createChatMessageCapture(deps)

    await expect(handler({ role: "user", content: "hello" }, undefined)).resolves.toBeUndefined()
  })
})
