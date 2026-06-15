import { describe, it, expect, vi, beforeEach } from "vitest"
import { createToolBeforeGuard } from "../../../src/hooks/transforms/tool-before-guard.js"

describe("createToolBeforeGuard", () => {
  const mockToolGuardHook = vi.fn<(input: unknown, output: unknown) => Promise<void>>()
  const mockHandleToolExecuteBefore = vi.fn<[input: { sessionID: string; callID: string; subagentType: string; description: string; taskId?: string }], Promise<void>>()
  const mockSessionTracker = {
    handleToolExecuteBefore: mockHandleToolExecuteBefore,
  }
  const mockLogWarn = vi.fn<(message: string, error: unknown) => void>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const guard = createToolBeforeGuard({
      toolGuardHook: mockToolGuardHook,
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    expect(typeof guard).toBe("function")
  })

  it("calls toolGuardHook FIRST, then session-tracker detection for task tool", async () => {
    mockToolGuardHook.mockResolvedValue(undefined)
    mockHandleToolExecuteBefore.mockResolvedValue(undefined)

    const guard = createToolBeforeGuard({
      toolGuardHook: mockToolGuardHook,
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })

    await guard(
      { tool: "task", sessionID: "ses_abc", callID: "call_1" },
      { args: { subagent_type: "gsd-executor", description: "run tests" } },
    )

    // Tool guard MUST be called first
    expect(mockToolGuardHook).toHaveBeenCalled()
    const guardCallIdx = mockToolGuardHook.mock.invocationCallOrder[0]!
    const trackerCallIdx = mockHandleToolExecuteBefore.mock.invocationCallOrder[0]!
    expect(guardCallIdx).toBeLessThan(trackerCallIdx)
  })

  it("skips session-tracker when tool is NOT task", async () => {
    mockToolGuardHook.mockResolvedValue(undefined)

    const guard = createToolBeforeGuard({
      toolGuardHook: mockToolGuardHook,
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })

    await guard({ tool: "read" }, {})
    expect(mockToolGuardHook).toHaveBeenCalled()
    expect(mockHandleToolExecuteBefore).not.toHaveBeenCalled()
  })

  it("catches session-tracker errors — calls logWarn, does not throw", async () => {
    mockToolGuardHook.mockResolvedValue(undefined)
    mockHandleToolExecuteBefore.mockRejectedValue(new Error("boom"))

    const guard = createToolBeforeGuard({
      toolGuardHook: mockToolGuardHook,
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })

    await expect(guard(
      { tool: "task", sessionID: "ses_abc", callID: "call_1" },
      { args: { subagent_type: "test", description: "desc" } },
    )).resolves.toBeUndefined()

    expect(mockLogWarn).toHaveBeenCalled()
  })

  it("skips sessionTracker when sessionID is empty", async () => {
    mockToolGuardHook.mockResolvedValue(undefined)

    const guard = createToolBeforeGuard({
      toolGuardHook: mockToolGuardHook,
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })

    await guard({ tool: "task", sessionID: "", callID: "call_1" }, {})
    expect(mockToolGuardHook).toHaveBeenCalled()
    expect(mockHandleToolExecuteBefore).not.toHaveBeenCalled()
  })
})
