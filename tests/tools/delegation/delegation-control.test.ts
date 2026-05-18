import { describe, it, expect, vi, beforeEach } from "vitest"
import { createDelegationControlTool, DelegationControlSchema } from "../../../src/tools/delegation/delegation-control.js"
import type { Delegation } from "../../../src/shared/types.js"

function createMockDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "dt-test-123",
    parentSessionId: "ses_parent",
    childSessionId: "ses_child",
    agent: "test-agent",
    status: "running",
    createdAt: Date.now(),
    lastMessageCount: 5,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: "/tmp/test",
    queueKey: "test:agent",
    ...overrides,
  }
}

function createMockDeps() {
  return {
    canAccess: vi.fn().mockReturnValue(true),
    getDelegation: vi.fn(),
    getAllDelegations: vi.fn().mockReturnValue([]),
    abortDelegation: vi.fn(),
    cancelDelegation: vi.fn(),
    terminateChild: vi.fn().mockResolvedValue({}),
    v2Client: {
      session: {
        prompt: vi.fn().mockResolvedValue({ data: {} }),
        update: vi.fn().mockResolvedValue({ data: {} }),
      },
    } as any,
    directory: "/tmp/test",
  }
}

describe("DelegationControlSchema", () => {
  it("validates abort action", () => {
    const result = DelegationControlSchema.safeParse({
      action: "abort",
      delegationId: "dt-123",
    })
    expect(result.success).toBe(true)
  })

  it("validates adjust-prompt with prompt", () => {
    const result = DelegationControlSchema.safeParse({
      action: "adjust-prompt",
      delegationId: "dt-123",
      prompt: "New instructions",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid action", () => {
    const result = DelegationControlSchema.safeParse({
      action: "invalid",
      delegationId: "dt-123",
    })
    expect(result.success).toBe(false)
  })
})

describe("createDelegationControlTool", () => {
  let deps: ReturnType<typeof createMockDeps>
  let tool: ReturnType<typeof createDelegationControlTool>

  beforeEach(() => {
    deps = createMockDeps()
    deps.getDelegation.mockReturnValue(createMockDelegation())
    tool = createDelegationControlTool(deps)
  })

  it("returns error for missing sessionID", async () => {
    const result = await tool.execute(
      { action: "abort", delegationId: "dt-test-123" },
      {},
    )
    expect(result).toContain("Missing caller session ID")
  })

  it("returns error for unknown delegation", async () => {
    deps.getDelegation.mockReturnValue(undefined)
    const result = await tool.execute(
      { action: "abort", delegationId: "dt-unknown" },
      { sessionID: "ses_parent" },
    )
    expect(result).toContain("not found")
  })

  it("returns error for access denied", async () => {
    deps.canAccess.mockReturnValue(false)
    const result = await tool.execute(
      { action: "abort", delegationId: "dt-test-123" },
      { sessionID: "ses_other" },
    )
    expect(result).toContain("Access denied")
  })

  describe("abort action", () => {
    it("aborts delegation and terminates child", async () => {
      const result = await tool.execute(
        { action: "abort", delegationId: "dt-test-123" },
        { sessionID: "ses_parent" },
      )
      expect(deps.abortDelegation).toHaveBeenCalled()
      expect(deps.terminateChild).toHaveBeenCalledWith("ses_child")
      expect(result).toContain("aborted")
    })
  })

  describe("cancel action", () => {
    it("cancels delegation and terminates child", async () => {
      const result = await tool.execute(
        { action: "cancel", delegationId: "dt-test-123" },
        { sessionID: "ses_parent" },
      )
      expect(deps.cancelDelegation).toHaveBeenCalled()
      expect(deps.terminateChild).toHaveBeenCalledWith("ses_child")
      expect(result).toContain("cancelled")
    })
  })

  describe("restart action", () => {
    it("returns blocked message", async () => {
      const result = await tool.execute(
        { action: "restart", delegationId: "dt-test-123" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("runtime-blocked")
    })
  })

  describe("redirect action", () => {
    it("returns error without agent parameter", async () => {
      const result = await tool.execute(
        { action: "redirect", delegationId: "dt-test-123" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("requires agent parameter")
    })

    it("returns blocked message with agent", async () => {
      const result = await tool.execute(
        { action: "redirect", delegationId: "dt-test-123", agent: "new-agent" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("not supported")
    })
  })

  describe("adjust-prompt action", () => {
    it("returns error without prompt", async () => {
      const result = await tool.execute(
        { action: "adjust-prompt", delegationId: "dt-test-123" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("requires prompt parameter")
    })

    it("returns error without v2 client", async () => {
      deps.v2Client = undefined
      const result = await tool.execute(
        { action: "adjust-prompt", delegationId: "dt-test-123", prompt: "New prompt" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("requires v2 SDK client")
    })
  })

  describe("change-agent action", () => {
    it("returns error without agent parameter", async () => {
      const result = await tool.execute(
        { action: "change-agent", delegationId: "dt-test-123" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("requires agent parameter")
    })

    it("returns error without v2 client", async () => {
      deps.v2Client = undefined
      const result = await tool.execute(
        { action: "change-agent", delegationId: "dt-test-123", agent: "new-agent" },
        { sessionID: "ses_parent" },
      )
      expect(result).toContain("requires v2 SDK client")
    })
  })
})
