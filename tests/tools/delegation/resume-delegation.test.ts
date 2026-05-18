import { describe, it, expect, vi, beforeEach } from "vitest"
import { createResumeDelegationTool, ResumeDelegationSchema } from "../../../src/tools/delegation/resume-delegation.js"
import type { Delegation } from "../../../src/shared/types.js"

function createMockDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "dt-test-123",
    parentSessionId: "ses_parent",
    childSessionId: "ses_child",
    agent: "test-agent",
    status: "completed",
    createdAt: Date.now() - 60000,
    completedAt: Date.now(),
    lastMessageCount: 10,
    stablePollCount: 3,
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
    registerDelegation: vi.fn(),
    transition: vi.fn().mockReturnValue(true),
    v2Client: {
      session: {
        prompt: vi.fn().mockResolvedValue({ data: {} }),
      },
    } as any,
    directory: "/tmp/test",
    createDelegationId: vi.fn().mockReturnValue("dt-resumed-456"),
  }
}

describe("ResumeDelegationSchema", () => {
  it("validates required fields", () => {
    const result = ResumeDelegationSchema.safeParse({
      delegationId: "dt-123",
      prompt: "Continue the work",
    })
    expect(result.success).toBe(true)
  })

  it("accepts optional agent", () => {
    const result = ResumeDelegationSchema.safeParse({
      delegationId: "dt-123",
      prompt: "Continue",
      agent: "new-agent",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty prompt", () => {
    const result = ResumeDelegationSchema.safeParse({
      delegationId: "dt-123",
      prompt: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing delegationId", () => {
    const result = ResumeDelegationSchema.safeParse({
      prompt: "Continue",
    })
    expect(result.success).toBe(false)
  })
})

describe("createResumeDelegationTool", () => {
  let deps: ReturnType<typeof createMockDeps>
  let tool: ReturnType<typeof createResumeDelegationTool>

  beforeEach(() => {
    deps = createMockDeps()
    deps.getDelegation.mockReturnValue(createMockDelegation())
    tool = createResumeDelegationTool(deps)
  })

  it("returns error for missing sessionID", async () => {
    const result = await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue" },
      {},
    )
    expect(result).toContain("Missing caller session ID")
  })

  it("returns error for unknown delegation", async () => {
    deps.getDelegation.mockReturnValue(undefined)
    const result = await tool.execute(
      { delegationId: "dt-unknown", prompt: "Continue" },
      { sessionID: "ses_parent" },
    )
    expect(result).toContain("not found")
  })

  it("returns error for access denied", async () => {
    deps.canAccess.mockReturnValue(false)
    const result = await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue" },
      { sessionID: "ses_other" },
    )
    expect(result).toContain("Access denied")
  })

  it("returns error without v2 client", async () => {
    deps.v2Client = undefined
    const result = await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue" },
      { sessionID: "ses_parent" },
    )
    expect(result).toContain("requires v2 SDK client")
  })

  it("resumes delegation with new prompt", async () => {
    const result = await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue the analysis" },
      { sessionID: "ses_parent" },
    )

    expect(deps.registerDelegation).toHaveBeenCalled()
    expect(deps.transition).toHaveBeenCalledWith("dt-resumed-456", "running")
    expect(result).toContain("resumed")
    expect(result).toContain("dt-resumed-456")
  })

  it("creates new delegation with restartedFrom link", async () => {
    await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue" },
      { sessionID: "ses_parent" },
    )

    const registered = deps.registerDelegation.mock.calls[0][0] as Delegation
    expect(registered.restartedFrom).toBe("dt-test-123")
    expect(registered.status).toBe("dispatched")
    expect(registered.id).toBe("dt-resumed-456")
  })

  it("uses original agent when not specified", async () => {
    await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue" },
      { sessionID: "ses_parent" },
    )

    const registered = deps.registerDelegation.mock.calls[0][0] as Delegation
    expect(registered.agent).toBe("test-agent")
  })

  it("uses new agent when specified", async () => {
    await tool.execute(
      { delegationId: "dt-test-123", prompt: "Continue", agent: "reviewer-agent" },
      { sessionID: "ses_parent" },
    )

    const registered = deps.registerDelegation.mock.calls[0][0] as Delegation
    expect(registered.agent).toBe("reviewer-agent")
  })
})
