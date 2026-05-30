import { describe, it, expect, vi } from "vitest"
import { createToolBeforeGuard } from "../../src/hooks/transforms/tool-before-guard.js"
import type { ToolBeforeGuardDeps } from "../../src/hooks/transforms/tool-before-guard.js"

describe("auth — tool-before-guard", () => {
  function createDeps(overrides?: Partial<ToolBeforeGuardDeps>): ToolBeforeGuardDeps {
    return {
      toolGuardHook: vi.fn(),
      sessionTracker: { handleToolExecuteBefore: vi.fn() },
      ...overrides,
    }
  }

  it("creates a handler function", () => {
    const deps = createDeps()
    const handler = createToolBeforeGuard(deps)
    expect(handler).toBeInstanceOf(Function)
  })

  it("calls toolGuardHook on every invocation", async () => {
    const toolGuardHook = vi.fn()
    const deps = createDeps({ toolGuardHook })
    const handler = createToolBeforeGuard(deps)
    await handler({ tool: "read" }, {})
    expect(toolGuardHook).toHaveBeenCalledOnce()
  })

  it("calls handleToolExecuteBefore when tool is 'task'", async () => {
    const handleToolExecuteBefore = vi.fn()
    const deps = createDeps({ sessionTracker: { handleToolExecuteBefore } })
    const handler = createToolBeforeGuard(deps)

    await handler(
      { tool: "task", sessionID: "ses_task", callID: "call_001", agent: "test-agent" },
      { args: { agent: "test-agent", prompt: "do work" } },
    )

    expect(handleToolExecuteBefore).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "ses_task",
        callID: "call_001",
        subagentType: "test-agent",
      }),
    )
  })

  it("calls handleToolExecuteBefore when tool is 'delegate-task'", async () => {
    const handleToolExecuteBefore = vi.fn()
    const deps = createDeps({ sessionTracker: { handleToolExecuteBefore } })
    const handler = createToolBeforeGuard(deps)

    await handler(
      { tool: "delegate-task", sessionID: "ses_del", callID: "call_002", agent: "del-agent" },
      { args: { agent: "del-agent", prompt: "delegate work" } },
    )

    expect(handleToolExecuteBefore).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "ses_del",
        callID: "call_002",
        subagentType: "del-agent",
      }),
    )
  })

  it("does not call handleToolExecuteBefore for non-task tools", async () => {
    const handleToolExecuteBefore = vi.fn()
    const deps = createDeps({ sessionTracker: { handleToolExecuteBefore } })
    const handler = createToolBeforeGuard(deps)

    await handler(
      { tool: "read", sessionID: "ses_read", callID: "call_003", agent: "reader" },
      {},
    )

    expect(handleToolExecuteBefore).not.toHaveBeenCalled()
  })

  it("extracts subagentType from args.subagent_type when present", async () => {
    const handleToolExecuteBefore = vi.fn()
    const deps = createDeps({ sessionTracker: { handleToolExecuteBefore } })
    const handler = createToolBeforeGuard(deps)

    await handler(
      { tool: "task", sessionID: "ses_sub", callID: "call_004", agent: "fallback" },
      { args: { subagent_type: "specialist-agent", agent: "fallback" } },
    )

    expect(handleToolExecuteBefore).toHaveBeenCalledWith(
      expect.objectContaining({ subagentType: "specialist-agent" }),
    )
  })

  it("extracts taskId from args.task_id", async () => {
    const handleToolExecuteBefore = vi.fn()
    const deps = createDeps({ sessionTracker: { handleToolExecuteBefore } })
    const handler = createToolBeforeGuard(deps)

    await handler(
      { tool: "task", sessionID: "ses_tid", callID: "call_005", agent: "test" },
      { args: { agent: "test", task_id: "ses_parent_123" } },
    )

    expect(handleToolExecuteBefore).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "ses_parent_123" }),
    )
  })

  it("does not throw when sessionTracker.handleToolExecuteBefore throws", async () => {
    const handleToolExecuteBefore = vi.fn().mockRejectedValue(new Error("tracker error"))
    const logWarn = vi.fn()
    const deps = createDeps({ sessionTracker: { handleToolExecuteBefore }, logWarn })
    const handler = createToolBeforeGuard(deps)

    await expect(
      handler(
        { tool: "task", sessionID: "ses_err", callID: "call_006", agent: "test" },
        { args: { agent: "test" } },
      ),
    ).resolves.toBeUndefined()

    expect(logWarn).toHaveBeenCalled()
  })
})
